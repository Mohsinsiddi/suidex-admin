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
  poolType: string
  allocationPoints: string | number
  depositFee: string | number
  withdrawalFee: string | number
  isNativePair: boolean
  isLpToken: boolean
  timestamp?: string
  txDigest?: string
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
        limit: 100, // Increase limit to get more events
        order: 'descending' // Get newest events first
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
  static processPoolType(poolType: string, isLpToken: boolean, isNativePair: boolean) {
    let typeString = ""
    
    // Convert pool type to string format
    if (typeof poolType === 'string') {
      typeString = poolType
    } else {
      console.warn('Unexpected poolType format:', poolType)
      typeString = String(poolType)
    }
    
    // Handle LP tokens
    if (isLpToken) {
      const lpMatches = this.extractLpTokens(typeString)
      if (lpMatches.length > 0) {
        return {
          ...lpMatches[0],
          isNativePair
        }
      }
    }
    
    // Handle single asset tokens
    const tokenName = extractTokenName(typeString)
    return {
      displayName: `${tokenName} Single Asset`,
      isLp: false,
      typeString: typeString,
      tokens: [tokenName],
      singleToken: tokenName,
      isNativePair
    }
  }

  // Convert events to Pool objects
  static convertEventsToPools(events: PoolCreatedEvent[], farmData: FarmData): Pool[] {
    try {
      const pools: Pool[] = []
      const poolSet = new Set<string>()

      events.forEach((event, index) => {
        try {
          const poolInfo = this.processPoolType(
            event.poolType, 
            event.isLpToken, 
            event.isNativePair
          )

          // Create unique key to avoid duplicates
          const poolKey = poolInfo.isLp ? 
            `LP:${poolInfo.tokens.sort().join('-')}` : 
            `Single:${poolInfo.tokens[0]}`

          if (!poolSet.has(poolKey)) {
            poolSet.add(poolKey)

            const pool: Pool = {
              id: (index + 1).toString(),
              name: poolInfo.displayName,
              type: poolInfo.isLp ? 'LP' : 'Single',
              typeName: poolInfo.typeString,
              token0: poolInfo.isLp ? poolInfo.token0 : undefined,
              token1: poolInfo.isLp ? poolInfo.token1 : undefined,
              singleToken: !poolInfo.isLp ? poolInfo.singleToken : undefined,
              totalStaked: '0.00', // Will be fetched separately if needed
              allocationPoints: Number(event.allocationPoints) || 0,
              depositFee: Number(event.depositFee) || 0,
              withdrawalFee: Number(event.withdrawalFee) || 0,
              isActive: true, // Assume active from events
              isNativePair: event.isNativePair,
              apy: calculateAPY(
                Number(event.allocationPoints) || 0,
                Number(farmData.totalAllocationPoints) || 1
              ),
              poolAddress: undefined // Events don't contain pool object ID
            }

            pools.push(pool)
            console.log(`Added pool from event: ${pool.name}`, pool)
          }
        } catch (error) {
          console.error(`Error processing event ${index}:`, error)
        }
      })

      console.log(`Successfully converted ${pools.length} events to pools`)
      return pools
    } catch (error) {
      console.error('Error converting events to pools:', error)
      return []
    }
  }

  // Enhanced pool data fetching using events + individual pool info
  static async fetchPoolDataWithEvents(farmData: FarmData): Promise<Pool[]> {
    try {
      // First, get all PoolCreated events
      const events = await this.fetchPoolCreatedEvents()
      
      if (events.length === 0) {
        console.warn('No PoolCreated events found, falling back to basic method')
        return []
      }

      // Convert events to basic pool objects
      const basicPools = this.convertEventsToPools(events, farmData)

      // Enhance pool data with current blockchain state
      const enhancedPools = await Promise.all(
        basicPools.map(async (pool) => {
          try {
            const enhancedData = await this.fetchIndividualPoolInfo(pool.typeName)
            return {
              ...pool,
              ...enhancedData
            }
          } catch (error) {
            console.warn(`Could not enhance pool ${pool.name}:`, error)
            return pool // Return basic pool if enhancement fails
          }
        })
      )

      return enhancedPools
    } catch (error) {
      console.error('Error fetching pool data with events:', error)
      throw error
    }
  }

  // Fetch individual pool info using get_pool_info
  static async fetchIndividualPoolInfo(poolTypeString: string): Promise<Partial<Pool>> {
    try {
      console.log(`Fetching individual pool info for: ${poolTypeString}`)

      // Create a transaction to call get_pool_info
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

        // Parse the values according to the contract's return format
        // Typically: (total_staked, deposit_fee, withdrawal_fee, active, is_native_pair, is_lp_token)
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

  // Parse blockchain values (handles different formats)
  static parseBlockchainValue(value: any): any {
    try {
      // Handle array format: [[data], "type"]
      if (Array.isArray(value) && value.length === 2 && typeof value[1] === 'string') {
        const [dataArray, typeStr] = value

        // Handle numeric types
        if (typeStr.startsWith('u') && Array.isArray(dataArray)) {
          return this.parseU256ByteArray(dataArray)
        }

        // Handle boolean type
        if (typeStr === 'bool' && Array.isArray(dataArray)) {
          return dataArray.length === 1 ? dataArray[0] === 1 : false
        }
      }

      // Handle direct values
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

  // Parse u256 byte array to BigInt
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

  // Format BigInt for display
  static formatBigIntForDisplay(bigIntValue: bigint | number, decimals: number = 9): string {
    try {
      if (typeof bigIntValue !== 'bigint') {
        bigIntValue = BigInt(bigIntValue)
      }

      const divisor = BigInt(10 ** decimals)
      const integerPart = bigIntValue / divisor
      const fractionalPart = bigIntValue % divisor

      // Format with commas for the integer part
      const formattedInteger = integerPart.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")

      // Only show decimal part if non-zero
      if (fractionalPart === 0n) {
        return formattedInteger
      }

      // Format the fractional part, padding with leading zeros if needed
      let fractionalStr = fractionalPart.toString().padStart(decimals, '0')

      // Trim trailing zeros
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

  // Get all pools using event-based approach
  static async getAllPools(): Promise<{ pools: Pool[], farmData: FarmData }> {
    try {
      console.log('Starting event-based pool fetching...')
      
      // Fetch farm data and events in parallel
      const [farmData, pools] = await Promise.all([
        this.fetchFarmData(),
        this.fetchPoolCreatedEvents().then(events => 
          this.convertEventsToPools(events, { totalAllocationPoints: '1' } as FarmData)
        )
      ])

      // Now enhance the pools with the correct farm data
      const enhancedPools = pools.map(pool => ({
        ...pool,
        apy: calculateAPY(pool.allocationPoints, farmData.totalAllocationPoints)
      }))

      console.log('Event-based pool fetching completed:', {
        farmData,
        pools: enhancedPools
      })

      return { pools: enhancedPools, farmData }
    } catch (error) {
      console.error('Error in getAllPools:', error)
      throw error
    }
  }
}