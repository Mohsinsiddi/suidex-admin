// services/factoryService.ts
import { Transaction } from '@mysten/sui/transactions'
import { suiClient } from '../utils/suiClient'
import { CONSTANTS } from '../constants'

export interface FactoryConfig {
  admin: string
  teamAddresses: {
    team1: string    // 40%
    team2: string    // 50%
    dev: string      // 10%
    locker: string
    buyback: string
  }
  isPaused: boolean
  pauseAdmin: string
  totalPairs: number
}

export interface FactoryStats {
  totalPairs: number
  protocolStatus: 'Active' | 'Paused'
  factoryFee: string
  allPairs: string[]
}

export interface FactoryEvent {
  id: string
  type: 'ProtocolPaused' | 'ProtocolUnpaused' | 'AddressesUpdated' | 'PauseAdminTransferred'
  eventName: string
  data: any
  timestamp: string
  txDigest: string
  admin: string
}

export class FactoryService {
  
  // Fetch factory configuration
  static async fetchFactoryConfig(): Promise<FactoryConfig> {
    try {
      // Get factory object
      const factory = await suiClient.getObject({
        id: CONSTANTS.FACTORY_ID,
        options: {
          showContent: true,
          showType: true
        }
      })

      if (!factory.data?.content || factory.data.content.dataType !== 'moveObject') {
        throw new Error('Invalid factory object')
      }

      const fields = (factory.data.content as any).fields

      return {
        admin: fields.admin || '',
        teamAddresses: {
          team1: fields.team_1_address || '',
          team2: fields.team_2_address || '',
          dev: fields.dev_address || '',
          locker: fields.locker_address || '',
          buyback: fields.buyback_address || ''
        },
        isPaused: fields.is_paused || false,
        pauseAdmin: fields.pause_admin || '',
        totalPairs: parseInt(fields.all_pairs?.length || '0')
      }
    } catch (error) {
      console.error('Error fetching factory config:', error)
      return {
        admin: '',
        teamAddresses: {
          team1: '',
          team2: '',
          dev: '',
          locker: '',
          buyback: ''
        },
        isPaused: false,
        pauseAdmin: '',
        totalPairs: 0
      }
    }
  }

  // Fetch factory statistics
  static async fetchFactoryStats(): Promise<FactoryStats> {
    try {
      const config = await this.fetchFactoryConfig()
      
      // Get all pairs using Move call
      const tx = new Transaction()
      tx.moveCall({
        target: `${CONSTANTS.PACKAGE_ID}::factory::all_pairs_length`,
        arguments: [tx.object(CONSTANTS.FACTORY_ID)]
      })

      const result = await suiClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: '0x0000000000000000000000000000000000000000000000000000000000000000'
      })

      let totalPairs = 0
      if (result.results?.[0]?.returnValues) {
        totalPairs = parseInt(result.results[0].returnValues[0][0]) || 0
      }

      return {
        totalPairs,
        protocolStatus: config.isPaused ? 'Paused' : 'Active',
        factoryFee: '0.3%', // Standard AMM fee
        allPairs: [] // Could fetch actual pairs if needed
      }
    } catch (error) {
      console.error('Error fetching factory stats:', error)
      return {
        totalPairs: 0,
        protocolStatus: 'Active',
        factoryFee: '0.3%',
        allPairs: []
      }
    }
  }

  // Fetch factory admin events
  static async fetchFactoryAdminEvents(): Promise<FactoryEvent[]> {
    try {
      const events = await suiClient.queryEvents({
        query: {
          MoveEventModule: {
            package: CONSTANTS.PACKAGE_ID,
            module: 'factory'
          }
        },
        limit: 50,
        order: 'descending'
      })

      if (!events || !events.data || events.data.length === 0) {
        return []
      }

      const processedEvents: FactoryEvent[] = events.data
        .filter(event => 
          event.type.includes('::factory::ProtocolPaused') ||
          event.type.includes('::factory::ProtocolUnpaused') ||
          event.type.includes('::factory::AddressesUpdated') ||
          event.type.includes('::factory::PauseAdminTransferred')
        )
        .map((event, index) => {
          const parsedEvent = event.parsedJson as any
          let eventType: FactoryEvent['type'] = 'ProtocolPaused'
          let eventName = 'Unknown Event'

          if (event.type.includes('ProtocolPaused')) {
            eventType = 'ProtocolPaused'
            eventName = 'Protocol Paused'
          } else if (event.type.includes('ProtocolUnpaused')) {
            eventType = 'ProtocolUnpaused'
            eventName = 'Protocol Unpaused'
          } else if (event.type.includes('AddressesUpdated')) {
            eventType = 'AddressesUpdated'
            eventName = 'Team Addresses Updated'
          } else if (event.type.includes('PauseAdminTransferred')) {
            eventType = 'PauseAdminTransferred'
            eventName = 'Pause Admin Transferred'
          }

          return {
            id: `factory-${eventType}-${event.id.txDigest}-${index}`,
            type: eventType,
            eventName,
            data: parsedEvent,
            timestamp: event.timestampMs || '0',
            txDigest: event.id.txDigest || '',
            admin: parsedEvent.admin || 'unknown'
          }
        })

      return processedEvents
    } catch (error) {
      console.error('Error fetching factory admin events:', error)
      return []
    }
  }

  // TRANSACTION BUILDERS FOR ADMIN OPERATIONS

  // Emergency pause protocol
  static buildEmergencyPauseTransaction(): Transaction {
    const tx = new Transaction()
    tx.moveCall({
      target: `${CONSTANTS.PACKAGE_ID}::factory::emergency_pause`,
      arguments: [tx.object(CONSTANTS.FACTORY_ID)]
    })
    return tx
  }

  // Unpause protocol
  static buildUnpauseTransaction(): Transaction {
    const tx = new Transaction()
    tx.moveCall({
      target: `${CONSTANTS.PACKAGE_ID}::factory::unpause`,
      arguments: [tx.object(CONSTANTS.FACTORY_ID)]
    })
    return tx
  }

  // Update team addresses
  static buildSetAddressesTransaction(addresses: {
    team1: string
    team2: string
    dev: string
    locker: string
    buyback: string
  }): Transaction {
    const tx = new Transaction()
    tx.moveCall({
      target: `${CONSTANTS.PACKAGE_ID}::factory::set_addresses`,
      arguments: [
        tx.object(CONSTANTS.FACTORY_ID),
        tx.pure.address(addresses.team1),
        tx.pure.address(addresses.team2),
        tx.pure.address(addresses.dev),
        tx.pure.address(addresses.locker),
        tx.pure.address(addresses.buyback)
      ]
    })
    return tx
  }

  // Transfer pause admin
  static buildTransferPauseAdminTransaction(newAdmin: string): Transaction {
    const tx = new Transaction()
    tx.moveCall({
      target: `${CONSTANTS.PACKAGE_ID}::factory::transfer_pause_admin`,
      arguments: [
        tx.object(CONSTANTS.FACTORY_ID),
        tx.pure.address(newAdmin)
      ]
    })
    return tx
  }

  // VALIDATION FUNCTIONS

  static validateAddresses(addresses: {
    team1: string
    team2: string
    dev: string
    locker: string
    buyback: string
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    
    // Check if all addresses are provided
    if (!addresses.team1) errors.push('Team 1 address is required')
    if (!addresses.team2) errors.push('Team 2 address is required')
    if (!addresses.dev) errors.push('Dev address is required')
    if (!addresses.locker) errors.push('Locker address is required')
    if (!addresses.buyback) errors.push('Buyback address is required')
    
    // Check address format (basic validation)
    const addressPattern = /^0x[a-fA-F0-9]{64}$/
    Object.entries(addresses).forEach(([key, address]) => {
      if (address && !addressPattern.test(address)) {
        errors.push(`${key} address format is invalid`)
      }
      if (address === '0x0000000000000000000000000000000000000000000000000000000000000000') {
        errors.push(`${key} cannot be zero address`)
      }
    })
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  static validatePauseAdmin(address: string): { isValid: boolean; error?: string } {
    if (!address) {
      return { isValid: false, error: 'Pause admin address is required' }
    }
    
    const addressPattern = /^0x[a-fA-F0-9]{64}$/
    if (!addressPattern.test(address)) {
      return { isValid: false, error: 'Invalid address format' }
    }
    
    if (address === '0x0000000000000000000000000000000000000000000000000000000000000000') {
      return { isValid: false, error: 'Cannot set zero address as pause admin' }
    }
    
    return { isValid: true }
  }

  // ERROR HANDLING

  static getFactoryOperationErrorMessage(error: any): string {
    if (typeof error === 'string') return error
    
    if (error?.message) {
      if (error.message.includes('ERROR_NOT_ADMIN')) {
        return 'Only factory admin can perform this operation'
      }
      if (error.message.includes('ERROR_NOT_PAUSE_ADMIN')) {
        return 'Only pause admin can perform this operation'
      }
      if (error.message.includes('ERROR_ALREADY_PAUSED')) {
        return 'Protocol is already paused'
      }
      if (error.message.includes('ERROR_NOT_PAUSED')) {
        return 'Protocol is not currently paused'
      }
      if (error.message.includes('ERROR_ZERO_ADDRESS')) {
        return 'Cannot use zero address'
      }
      if (error.message.includes('ERROR_IDENTICAL_TOKENS')) {
        return 'Token addresses cannot be identical'
      }
      if (error.message.includes('ERROR_PAIR_EXISTS')) {
        return 'Pair already exists'
      }
      if (error.message.includes('rejected')) {
        return 'Transaction was rejected by user'
      }
      
      return error.message
    }
    
    return 'An unknown error occurred'
  }

  // UTILITY FUNCTIONS

  static formatAddress(address: string): string {
    if (!address) return 'Unknown'
    return `${address.slice(0, 8)}...${address.slice(-6)}`
  }

  static formatTimestamp(timestamp: string): string {
    try {
      const date = new Date(parseInt(timestamp))
      return date.toLocaleString()
    } catch {
      return 'Unknown time'
    }
  }

  static getTeamAllocationInfo(): {
    team1: { percentage: number; description: string }
    team2: { percentage: number; description: string }
    dev: { percentage: number; description: string }
    locker: { description: string }
    buyback: { description: string }
  } {
    return {
      team1: {
        percentage: 40,
        description: 'Team allocation (40% of team fees)'
      },
      team2: {
        percentage: 50,
        description: 'Team allocation (50% of team fees)'
      },
      dev: {
        percentage: 10,
        description: 'Development fund (10% of team fees)'
      },
      locker: {
        description: 'Victory token locker contract'
      },
      buyback: {
        description: 'Token buyback and burn contract'
      }
    }
  }

  // Check if user can perform admin operations
  static canPerformAdminOperation(
    userAddress: string,
    factoryConfig: FactoryConfig,
    operation: 'pause' | 'addresses' | 'pauseAdmin'
  ): boolean {
    switch (operation) {
      case 'pause':
        return userAddress === factoryConfig.pauseAdmin
      case 'addresses':
        return userAddress === factoryConfig.admin
      case 'pauseAdmin':
        return userAddress === factoryConfig.pauseAdmin
      default:
        return false
    }
  }
}