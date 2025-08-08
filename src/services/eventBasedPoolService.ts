// services/eventBasedPoolService.ts
import { suiClient } from '../utils/suiClient'
import { CONSTANTS } from '../constants'
import type { Pool, FarmData } from '../types/pool'
import { 
  parseTypeName, 
  isNativePair, 
  formatTokenAmount, 
  calculateAPY,
  extractTokenName 
} from '../utils/poolUtils'

interface PoolCreatedEvent {
  poolType: string | { name: string }
  allocationPoints: string | number
  depositFee: string | number
  withdrawalFee: string | number
  isNativePair: boolean
  isLpToken: boolean
  timestamp?: string
  txDigest?: string
}

interface PoolConfigUpdatedEvent {
  poolType: string | { name: string }
  oldAllocationPoints: string | number
  newAllocationPoints: string | number
  oldDepositFee: string | number
  newDepositFee: string | number
  oldWithdrawalFee: string | number
  newWithdrawalFee: string | number
  oldActive: boolean
  newActive: boolean
  timestamp?: string
  txDigest?: string
}

interface CombinedPoolEvent {
  eventType: 'created' | 'updated'
  poolType: string
  allocationPoints: number
  depositFee: number
  withdrawalFee: number
  isNativePair: boolean
  isLpToken: boolean
  isActive: boolean
  timestamp: string
  txDigest: string
}

export class EventBasedPoolService {
  
  // Fetch farm data from the blockchain
  static async fetchFarmData(): Promise<FarmData> {
    try {
      const farmObject = await suiClient.getObject({
        id: CONSTANTS.FARM_ID,
        options: {
          showContent: true,
          showType: true
        }
      })

      if (!farmObject.data?.content || farmObject.data.content.dataType !== 'moveObject') {
        throw new Error('Invalid farm object')
      }

      const fields = farmObject.data.content.fields as any

      return {
        admin: fields.admin,
        burnAddress: fields.burn_address,
        devAddress: fields.dev_address,
        teamAddress: fields.team_address,
        lockerAddress: fields.locker_address,
        paused: fields.paused,
        totalAllocationPoints: fields.total_allocation_points,
        totalLpAllocationPoints: fields.total_lp_allocation_points,
        totalSingleAllocationPoints: fields.total_single_allocation_points,
        totalVictoryDistributed: fields.total_victory_distributed,
        poolList: fields.pool_list,
        poolsTableId: fields.pools.fields.id.id,
        allowedLpTypesTableId: fields.allowed_lp_types.fields.id.id
      }
    } catch (error) {
      console.error('Error fetching farm data:', error)
      throw error
    }
  }

  // Fetch PoolCreated events from the blockchain
  static async fetchPoolCreatedEvents(): Promise<PoolCreatedEvent[]> {
    try {
      console.log('Fetching PoolCreated events...')
      
      const events = await suiClient.queryEvents({
        query: {
          MoveEventType: `${CONSTANTS.PACKAGE_ID}::farm::PoolCreated`
        },
        limit: 100,
        order: 'descending'
      })

      console.log('PoolCreated events response:', events)

      if (!events || !events.data || events.data.length === 0) {
        console.warn('No PoolCreated events found')
        return []
      }

      const processedEvents: PoolCreatedEvent[] = events.data.map(event => {
        const parsedEvent = event.parsedJson as any
        console.log('Processing PoolCreated event:', parsedEvent)

        return {
          poolType: parsedEvent.pool_type || parsedEvent.poolType,
          allocationPoints: parsedEvent.allocation_points || parsedEvent.allocationPoints || 0,
          depositFee: parsedEvent.deposit_fee || parsedEvent.depositFee || 0,
          withdrawalFee: parsedEvent.withdrawal_fee || parsedEvent.withdrawalFee || 0,
          isNativePair: Boolean(parsedEvent.is_native_pair || parsedEvent.isNativePair),
          isLpToken: Boolean(parsedEvent.is_lp_token || parsedEvent.isLpToken),
          timestamp: event.timestampMs,
          txDigest: event.id.txDigest
        }
      })

      console.log(`Processed ${processedEvents.length} PoolCreated events`)
      return processedEvents
    } catch (error) {
      console.error('Error fetching PoolCreated events:', error)
      throw error
    }
  }

  // Fetch PoolConfigUpdated events from the blockchain
  static async fetchPoolConfigUpdatedEvents(): Promise<PoolConfigUpdatedEvent[]> {
    try {
      console.log('Fetching PoolConfigUpdated events...')
      
      const events = await suiClient.queryEvents({
        query: {
          MoveEventType: `${CONSTANTS.PACKAGE_ID}::farm::PoolConfigUpdated`
        },
        limit: 100,
        order: 'descending'
      })

      console.log('PoolConfigUpdated events response:', events)

      if (!events || !events.data || events.data.length === 0) {
        console.warn('No PoolConfigUpdated events found')
        return []
      }

      const processedEvents: PoolConfigUpdatedEvent[] = events.data.map(event => {
        const parsedEvent = event.parsedJson as any
        console.log('Processing PoolConfigUpdated event:', parsedEvent)

        return {
          poolType: parsedEvent.pool_type || parsedEvent.poolType,
          oldAllocationPoints: parsedEvent.old_allocation_points || parsedEvent.oldAllocationPoints || 0,
          newAllocationPoints: parsedEvent.new_allocation_points || parsedEvent.newAllocationPoints || 0,
          oldDepositFee: parsedEvent.old_deposit_fee || parsedEvent.oldDepositFee || 0,
          newDepositFee: parsedEvent.new_deposit_fee || parsedEvent.newDepositFee || 0,
          oldWithdrawalFee: parsedEvent.old_withdrawal_fee || parsedEvent.oldWithdrawalFee || 0,
          newWithdrawalFee: parsedEvent.new_withdrawal_fee || parsedEvent.newWithdrawalFee || 0,
          oldActive: Boolean(parsedEvent.old_active || parsedEvent.oldActive),
          newActive: Boolean(parsedEvent.new_active || parsedEvent.newActive),
          timestamp: event.timestampMs,
          txDigest: event.id.txDigest
        }
      })

      console.log(`Processed ${processedEvents.length} PoolConfigUpdated events`)
      return processedEvents
    } catch (error) {
      console.error('Error fetching PoolConfigUpdated events:', error)
      throw error
    }
  }

  // Combine and sort pool events by timestamp
  static async fetchAllPoolEvents(): Promise<CombinedPoolEvent[]> {
    try {
      const [createdEvents, updatedEvents] = await Promise.all([
        this.fetchPoolCreatedEvents(),
        this.fetchPoolConfigUpdatedEvents()
      ])

      const combinedEvents: CombinedPoolEvent[] = []

      // Process created events
      createdEvents.forEach(event => {
        const poolTypeString = this.extractPoolTypeString(event.poolType)
        combinedEvents.push({
          eventType: 'created',
          poolType: poolTypeString,
          allocationPoints: Number(event.allocationPoints),
          depositFee: Number(event.depositFee),
          withdrawalFee: Number(event.withdrawalFee),
          isNativePair: event.isNativePair,
          isLpToken: event.isLpToken,
          isActive: true, // Created pools are initially active
          timestamp: event.timestamp || '0',
          txDigest: event.txDigest || ''
        })
      })

      // Process updated events
      updatedEvents.forEach(event => {
        const poolTypeString = this.extractPoolTypeString(event.poolType)
        
        // Find if we already have this pool from created events
        const existingPool = combinedEvents.find(p => p.poolType === poolTypeString)
        
        combinedEvents.push({
          eventType: 'updated',
          poolType: poolTypeString,
          allocationPoints: Number(event.newAllocationPoints),
          depositFee: Number(event.newDepositFee),
          withdrawalFee: Number(event.newWithdrawalFee),
          isNativePair: existingPool?.isNativePair || false,
          isLpToken: existingPool?.isLpToken || false,
          isActive: event.newActive,
          timestamp: event.timestamp || '0',
          txDigest: event.txDigest || ''
        })
      })

      // Sort by timestamp (newest first)
      combinedEvents.sort((a, b) => 
        parseInt(b.timestamp) - parseInt(a.timestamp)
      )

      console.log(`Combined ${combinedEvents.length} pool events`)
      return combinedEvents
    } catch (error) {
      console.error('Error fetching all pool events:', error)
      throw error
    }
  }

  // Extract pool type string from various formats
  static extractPoolTypeString(poolType: string | { name: string }): string {
    if (typeof poolType === 'string') {
      return poolType
    } else if (poolType && typeof poolType === 'object' && poolType.name) {
      return poolType.name
    } else {
      console.warn('Unexpected poolType format:', poolType)
      return String(poolType)
    }
  }

  // Create final pool state from events
  static buildFinalPoolState(events: CombinedPoolEvent[]): Map<string, CombinedPoolEvent> {
    const poolStateMap = new Map<string, CombinedPoolEvent>()

    // Group events by pool type
    const eventsByPool = new Map<string, CombinedPoolEvent[]>()
    
    events.forEach(event => {
      if (!eventsByPool.has(event.poolType)) {
        eventsByPool.set(event.poolType, [])
      }
      eventsByPool.get(event.poolType)!.push(event)
    })

    // For each pool, apply events in chronological order to get final state
    eventsByPool.forEach((poolEvents, poolType) => {
      // Sort events by timestamp (oldest first for replay)
      poolEvents.sort((a, b) => parseInt(a.timestamp) - parseInt(b.timestamp))

      let finalState: CombinedPoolEvent | null = null

      poolEvents.forEach(event => {
        if (event.eventType === 'created') {
          finalState = { ...event }
        } else if (event.eventType === 'updated' && finalState) {
          // Apply update to existing state
          finalState = {
            ...finalState,
            allocationPoints: event.allocationPoints,
            depositFee: event.depositFee,
            withdrawalFee: event.withdrawalFee,
            isActive: event.isActive,
            timestamp: event.timestamp, // Keep latest timestamp
            txDigest: event.txDigest
          }
        }
      })

      if (finalState) {
        poolStateMap.set(poolType, finalState)
      }
    })

    console.log(`Built final state for ${poolStateMap.size} pools`)
    return poolStateMap
  }

  // Extract LP tokens from a type string
  static extractLpTokens(typeString: string) {
    const lpTokens = []
    
    // Match LP tokens with pattern: address::pair::LPCoin<Token1, Token2>
    const lpRegex = /([0-9a-f]{64})::pair::LPCoin<([^,]+),\s*([^>]+)>/g
    let match
    
    while ((match = lpRegex.exec(typeString)) !== null) {
      const token1 = extractTokenName(match[2])
      const token2 = extractTokenName(match[3])
      
      // Create consistent display name
      let displayName
      if (token2 === 'SUI') {
        displayName = `${token1}/SUI LP`
      } else if (token1 === 'SUI') {
        displayName = `SUI/${token2} LP`
      } else {
        // For non-SUI pairs, sort alphabetically
        const tokens = [token1, token2].sort()
        displayName = `${tokens[0]}/${tokens[1]} LP`
      }
      
      lpTokens.push({
        displayName,
        isLp: true,
        typeString: match[0],
        tokens: [token1, token2],
        token0: token1,
        token1: token2
      })
    }
    
    return lpTokens
  }

  // Process pool type data to create consistent display objects
  static processPoolType(poolTypeString: string, isLpToken: boolean, isNativePair: boolean) {
    console.log('Processing pool type string:', poolTypeString)
    
    // Handle LP tokens
    if (isLpToken) {
      const lpMatches = this.extractLpTokens(poolTypeString)
      if (lpMatches.length > 0) {
        return {
          ...lpMatches[0],
          isNativePair
        }
      }
    }
    
    // Handle single asset tokens
    const tokenName = extractTokenName(poolTypeString)
    return {
      displayName: `${tokenName} Single Asset`,
      isLp: false,
      typeString: poolTypeString,
      tokens: [tokenName],
      singleToken: tokenName,
      isNativePair
    }
  }

  // Convert final pool states to Pool objects
  static convertFinalStatesToPools(finalStates: Map<string, CombinedPoolEvent>, farmData: FarmData): Pool[] {
    try {
      const pools: Pool[] = []
      let poolIdCounter = 1

      finalStates.forEach((state, poolType) => {
        try {
          const poolInfo = this.processPoolType(
            state.poolType, 
            state.isLpToken, 
            state.isNativePair
          )

          const pool: Pool = {
            id: poolIdCounter.toString(),
            name: poolInfo.displayName,
            type: poolInfo.isLp ? 'LP' : 'Single',
            typeName: poolInfo.typeString,
            token0: poolInfo.isLp ? poolInfo.token0 : undefined,
            token1: poolInfo.isLp ? poolInfo.token1 : undefined,
            singleToken: !poolInfo.isLp ? poolInfo.singleToken : undefined,
            totalStaked: '0.00', // Will be fetched separately if needed
            allocationPoints: state.allocationPoints,
            depositFee: state.depositFee,
            withdrawalFee: state.withdrawalFee,
            isActive: state.isActive,
            isNativePair: state.isNativePair,
            apy: calculateAPY(
              state.allocationPoints,
              Number(farmData.totalAllocationPoints) || 1
            ),
            poolAddress: undefined // Events don't contain pool object ID
          }

          pools.push(pool)
          poolIdCounter++
          console.log(`Added pool: ${pool.name}`, pool)
        } catch (error) {
          console.error(`Error processing pool state for ${poolType}:`, error)
        }
      })

      console.log(`Successfully converted ${pools.length} pool states to pools`)
      return pools
    } catch (error) {
      console.error('Error converting final states to pools:', error)
      return []
    }
  }

  // Fetch individual pool info using get_pool_info (same as before)
  static async fetchIndividualPoolInfo(poolTypeString: string): Promise<Partial<Pool>> {
    try {
      console.log(`Fetching individual pool info for: ${poolTypeString}`)

      const tx = await suiClient.devInspectTransactionBlock({
        transactionBlock: {
          version: 1,
          sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
          expiration: { None: null },
          gasData: {
            payment: [],
            owner: '0x0000000000000000000000000000000000000000000000000000000000000000',
            price: '1000',
            budget: '10000000'
          },
          inputs: [
            {
              type: 'object',
              objectType: 'immOrOwnedObject',
              objectId: CONSTANTS.FARM_ID,
              version: '1',
              digest: ''
            }
          ],
          commands: [
            {
              MoveCall: {
                package: CONSTANTS.PACKAGE_ID,
                module: 'farm',
                function: 'get_pool_info',
                type_arguments: [poolTypeString],
                arguments: [{ Input: 0 }]
              }
            }
          ]
        },
        sender: '0x0000000000000000000000000000000000000000000000000000000000000000'
      })

      console.log('Pool info response:', tx)

      if (tx?.results?.[0]?.returnValues) {
        const rawValues = tx.results[0].returnValues
        console.log('Raw pool info values:', rawValues)

        const parsedValues = rawValues.map(this.parseBlockchainValue)
        console.log('Parsed pool info values:', parsedValues)

        const [totalStaked, depositFee, withdrawalFee, active, isNativePair, isLpToken] = parsedValues

        return {
          totalStaked: this.formatBigIntForDisplay(totalStaked || 0n),
          depositFee: Number(depositFee) || 0,
          withdrawalFee: Number(withdrawalFee) || 0,
          isActive: Boolean(active),
          isNativePair: Boolean(isNativePair)
        }
      }

      return {}
    } catch (error) {
      console.error(`Error fetching individual pool info for ${poolTypeString}:`, error)
      return {}
    }
  }

  // Parse blockchain values (same as before)
  static parseBlockchainValue(value: any): any {
    try {
      if (Array.isArray(value) && value.length === 2 && typeof value[1] === 'string') {
        const [dataArray, typeStr] = value

        if (typeStr.startsWith('u') && Array.isArray(dataArray)) {
          return this.parseU256ByteArray(dataArray)
        }

        if (typeStr === 'bool' && Array.isArray(dataArray)) {
          return dataArray.length === 1 ? dataArray[0] === 1 : false
        }
      }

      if (typeof value === 'number' || typeof value === 'bigint') {
        return value
      }

      if (typeof value === 'boolean') {
        return value
      }

      console.warn('Could not parse blockchain value:', value)
      return value
    } catch (error) {
      console.error('Error parsing blockchain value:', error)
      return 0
    }
  }

  // Parse u256 byte array to BigInt (same as before)
  static parseU256ByteArray(byteArray: number[]): bigint {
    if (!Array.isArray(byteArray) || byteArray.length === 0) {
      return 0n
    }

    let result = 0n
    let multiplier = 1n

    for (let i = 0; i < byteArray.length; i++) {
      if (typeof byteArray[i] === 'number') {
        result += BigInt(byteArray[i]) * multiplier
        multiplier *= 256n
      }
    }

    return result
  }

  // Format BigInt for display (same as before)
  static formatBigIntForDisplay(bigIntValue: bigint | number, decimals: number = 9): string {
    try {
      if (typeof bigIntValue !== 'bigint') {
        bigIntValue = BigInt(bigIntValue)
      }

      const divisor = BigInt(10 ** decimals)
      const integerPart = bigIntValue / divisor
      const fractionalPart = bigIntValue % divisor

      const formattedInteger = integerPart.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")

      if (fractionalPart === 0n) {
        return formattedInteger
      }

      let fractionalStr = fractionalPart.toString().padStart(decimals, '0')
      fractionalStr = fractionalStr.replace(/0+$/, '')

      if (fractionalStr.length === 0) {
        return formattedInteger
      }

      return `${formattedInteger}.${fractionalStr}`
    } catch (error) {
      console.error('Error formatting BigInt:', error)
      return '0'
    }
  }

  // Get all pools using enhanced event-based approach
  static async getAllPools(): Promise<{ pools: Pool[], farmData: FarmData }> {
    try {
      console.log('Starting enhanced event-based pool fetching...')
      
      // Fetch farm data first
      const farmData = await this.fetchFarmData()
      
      // Fetch all pool events and build final state
      const allEvents = await this.fetchAllPoolEvents()
      const finalStates = this.buildFinalPoolState(allEvents)
      const pools = this.convertFinalStatesToPools(finalStates, farmData)

      console.log('Enhanced event-based pool fetching completed:', {
        farmData,
        pools,
        totalEvents: allEvents.length,
        finalPools: finalStates.size
      })

      return { pools, farmData }
    } catch (error) {
      console.error('Error in getAllPools:', error)
      throw error
    }
  }
}