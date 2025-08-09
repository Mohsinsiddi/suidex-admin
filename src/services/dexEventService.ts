// services/dexEventService.ts
import { suiClient } from '../utils/suiClient'
import { CONSTANTS } from '../constants'
import { extractTokenName } from '../utils/poolUtils'

export interface DexEvent {
  id: string
  type: 'PairCreated' | 'Swap' | 'LPMint' | 'LPBurn'
  eventName: string
  pairAddress?: string
  pairName?: string
  data: any
  timestamp: string
  txDigest: string
  sender: string
}

export interface DexEventFilters {
  eventType: string
  pairType: string
  dateRange: string
  searchTerm: string
  limit: number
}

export interface DexEventResponse {
  events: DexEvent[]
  hasNextPage: boolean
  nextCursor?: string
  totalCount: number
}

export class DexEventService {
  
  // Fetch PairCreated events from factory
  static async fetchPairCreatedEvents(): Promise<DexEvent[]> {
    try {
      const events = await suiClient.queryEvents({
        query: {
          MoveEventType: `${CONSTANTS.PACKAGE_ID}::factory::PairCreated`
        },
        limit: 50,
        order: 'descending'
      })

      if (!events || !events.data || events.data.length === 0) {
        return []
      }

      const processedEvents: DexEvent[] = events.data.map((event, index) => {
        const parsedEvent = event.parsedJson as any

        // Extract token names from TypeName objects or strings
        const token0 = this.extractTokenFromTypeInfo(parsedEvent.token0)
        const token1 = this.extractTokenFromTypeInfo(parsedEvent.token1)
        const pairName = `${token0}/${token1} LP`

        return {
          id: `pair-created-${event.id.txDigest}-${index}`,
          type: 'PairCreated',
          eventName: 'Pair Created',
          pairAddress: parsedEvent.pair || '',
          pairName,
          data: {
            token0,
            token1,
            pairAddress: parsedEvent.pair || '',
            pairLength: parsedEvent.pair_len || 0
          },
          timestamp: event.timestampMs || '0',
          txDigest: event.id.txDigest || '',
          sender: 'factory'
        }
      })

      return processedEvents
    } catch (error) {
      console.error('Error fetching PairCreated events:', error)
      return []
    }
  }

  // Helper to extract token name from TypeName or string
  static extractTokenFromTypeInfo(tokenInfo: any): string {
    try {
      if (!tokenInfo) return 'Unknown'
      
      // If it's a TypeName object with name property
      if (tokenInfo.name) {
        return extractTokenName(tokenInfo.name)
      }
      
      // If it's already a string
      if (typeof tokenInfo === 'string') {
        return extractTokenName(tokenInfo)
      }
      
      // Fallback
      return 'Unknown'
    } catch (error) {
      console.error('Error extracting token name:', error, 'tokenInfo:', tokenInfo)
      return 'Unknown'
    }
  }

  // Fetch Swap events from pair module
  static async fetchSwapEvents(): Promise<DexEvent[]> {
    try {
      const events = await suiClient.queryEvents({
        query: {
          MoveEventModule: {
            package: CONSTANTS.PACKAGE_ID,
            module: 'pair'
          }
        },
        limit: 100,
        order: 'descending'
      })

      if (!events || !events.data || events.data.length === 0) {
        return []
      }

      // Filter for Swap events
      const swapEvents = events.data.filter(event => 
        event.type.includes('::pair::Swap<')
      )

      const processedEvents: DexEvent[] = swapEvents.slice(0, 30).map((event, index) => {
        const parsedEvent = event.parsedJson as any

        // Extract token names from the full event type
        const typeMatch = event.type.match(/::pair::Swap<([^,]+),\s*([^>]+)>/)
        let pairName = 'Unknown Pair'
        if (typeMatch) {
          const token0 = extractTokenName(typeMatch[1])
          const token1 = extractTokenName(typeMatch[2])
          pairName = `${token0}/${token1}`
        }

        const { swapAmountIn, swapAmountOut } = this.calculateSwapAmounts(parsedEvent)

        return {
          id: `swap-${event.id.txDigest}-${index}`,
          type: 'Swap',
          eventName: 'Token Swap',
          pairName,
          data: {
            sender: parsedEvent.sender || '',
            amount0In: parsedEvent.amount0_in || '0',
            amount1In: parsedEvent.amount1_in || '0',
            amount0Out: parsedEvent.amount0_out || '0',
            amount1Out: parsedEvent.amount1_out || '0',
            swapAmountIn,
            swapAmountOut,
            // Show raw amounts instead of formatted
            rawAmountIn: swapAmountIn,
            rawAmountOut: swapAmountOut
          },
          timestamp: event.timestampMs || '0',
          txDigest: event.id.txDigest || '',
          sender: parsedEvent.sender || 'unknown'
        }
      })

      return processedEvents
    } catch (error) {
      console.error('Error fetching Swap events:', error)
      return []
    }
  }

  // Fetch LP Mint events from pair module
  static async fetchLPMintEvents(): Promise<DexEvent[]> {
    try {
      const events = await suiClient.queryEvents({
        query: {
          MoveEventModule: {
            package: CONSTANTS.PACKAGE_ID,
            module: 'pair'
          }
        },
        limit: 100,
        order: 'descending'
      })

      if (!events || !events.data || events.data.length === 0) {
        return []
      }

      // Filter for LPMint events
      const mintEvents = events.data.filter(event => 
        event.type.includes('::pair::LPMint<')
      )

      const processedEvents: DexEvent[] = mintEvents.slice(0, 25).map((event, index) => {
        const parsedEvent = event.parsedJson as any

        const typeMatch = event.type.match(/::pair::LPMint<([^,]+),\s*([^>]+)>/)
        let pairName = 'Unknown LP'
        if (typeMatch) {
          const token0 = extractTokenName(typeMatch[1])
          const token1 = extractTokenName(typeMatch[2])
          pairName = `${token0}/${token1} LP`
        }

        return {
          id: `lp-mint-${event.id.txDigest}-${index}`,
          type: 'LPMint',
          eventName: 'LP Tokens Minted',
          pairName,
          data: {
            sender: parsedEvent.sender || '',
            amount0: parsedEvent.amount0 || '0',
            amount1: parsedEvent.amount1 || '0',
            liquidity: parsedEvent.liquidity || '0',
            // Show raw amounts
            rawAmount0: parsedEvent.amount0 || '0',
            rawAmount1: parsedEvent.amount1 || '0',
            rawLiquidity: parsedEvent.liquidity || '0'
          },
          timestamp: event.timestampMs || '0',
          txDigest: event.id.txDigest || '',
          sender: parsedEvent.sender || 'unknown'
        }
      })

      return processedEvents
    } catch (error) {
      console.error('Error fetching LPMint events:', error)
      return []
    }
  }

  // Fetch LP Burn events from pair module
  static async fetchLPBurnEvents(): Promise<DexEvent[]> {
    try {
      const events = await suiClient.queryEvents({
        query: {
          MoveEventModule: {
            package: CONSTANTS.PACKAGE_ID,
            module: 'pair'
          }
        },
        limit: 100,
        order: 'descending'
      })

      if (!events || !events.data || events.data.length === 0) {
        return []
      }

      // Filter for LPBurn events
      const burnEvents = events.data.filter(event => 
        event.type.includes('::pair::LPBurn<')
      )

      const processedEvents: DexEvent[] = burnEvents.slice(0, 25).map((event, index) => {
        const parsedEvent = event.parsedJson as any

        const typeMatch = event.type.match(/::pair::LPBurn<([^,]+),\s*([^>]+)>/)
        let pairName = 'Unknown LP'
        if (typeMatch) {
          const token0 = extractTokenName(typeMatch[1])
          const token1 = extractTokenName(typeMatch[2])
          pairName = `${token0}/${token1} LP`
        }

        return {
          id: `lp-burn-${event.id.txDigest}-${index}`,
          type: 'LPBurn',
          eventName: 'LP Tokens Burned',
          pairName,
          data: {
            sender: parsedEvent.sender || '',
            amount0: parsedEvent.amount0 || '0',
            amount1: parsedEvent.amount1 || '0',
            liquidity: parsedEvent.liquidity || '0',
            // Show raw amounts
            rawAmount0: parsedEvent.amount0 || '0',
            rawAmount1: parsedEvent.amount1 || '0',
            rawLiquidity: parsedEvent.liquidity || '0'
          },
          timestamp: event.timestampMs || '0',
          txDigest: event.id.txDigest || '',
          sender: parsedEvent.sender || 'unknown'
        }
      })

      return processedEvents
    } catch (error) {
      console.error('Error fetching LPBurn events:', error)
      return []
    }
  }

  // Main method to get all events
  static async fetchAllDexEvents(filters: DexEventFilters): Promise<DexEventResponse> {
    try {
      let allEvents: DexEvent[] = []

      if (filters.eventType === 'all') {
        const [pairEvents, swapEvents, mintEvents, burnEvents] = await Promise.all([
          this.fetchPairCreatedEvents(),
          this.fetchSwapEvents(),
          this.fetchLPMintEvents(),
          this.fetchLPBurnEvents()
        ])
        
        allEvents = [...pairEvents, ...swapEvents, ...mintEvents, ...burnEvents]
        
      } else {
        switch (filters.eventType) {
          case 'PairCreated':
            allEvents = await this.fetchPairCreatedEvents()
            break
          case 'Swap':
            allEvents = await this.fetchSwapEvents()
            break
          case 'LPMint':
            allEvents = await this.fetchLPMintEvents()
            break
          case 'LPBurn':
            allEvents = await this.fetchLPBurnEvents()
            break
          default:
            allEvents = []
        }
      }

      // Sort by timestamp (newest first) - convert to numbers for proper sorting
      allEvents.sort((a, b) => {
        const timeA = parseInt(a.timestamp)
        const timeB = parseInt(b.timestamp) 
        return timeB - timeA // Newest first (descending order)
      })

      // Apply date range filter
      if (filters.dateRange !== 'all') {
        allEvents = this.applyDateRangeFilter(allEvents, filters.dateRange)
      }

      // Apply search filter
      if (filters.searchTerm && filters.searchTerm.trim()) {
        allEvents = this.applySearchFilter(allEvents, filters.searchTerm.trim())
      }
      
      // Apply limit
      const limitedEvents = allEvents.slice(0, Math.min(filters.limit, 200))

      return {
        events: limitedEvents,
        hasNextPage: false,
        totalCount: limitedEvents.length
      }
    } catch (error) {
      console.error('Error in fetchAllDexEvents:', error)
      return {
        events: [],
        hasNextPage: false,
        totalCount: 0
      }
    }
  }

  // Apply date range filter
  static applyDateRangeFilter(events: DexEvent[], dateRange: string): DexEvent[] {
    if (dateRange === 'all') return events
    
    const now = Date.now()
    const dayMs = 24 * 60 * 60 * 1000
    
    let cutoffTime: number
    switch (dateRange) {
      case '1d':
        cutoffTime = now - dayMs
        break
      case '7d':
        cutoffTime = now - (7 * dayMs)
        break
      case '30d':
        cutoffTime = now - (30 * dayMs)
        break
      default:
        return events
    }
    
    return events.filter(event => {
      const eventTime = parseInt(event.timestamp)
      return eventTime > cutoffTime
    })
  }

  // Apply search filter
  static applySearchFilter(events: DexEvent[], searchTerm: string): DexEvent[] {
    const searchLower = searchTerm.toLowerCase()
    
    return events.filter(event => {
      return (
        event.pairName?.toLowerCase().includes(searchLower) ||
        event.eventName.toLowerCase().includes(searchLower) ||
        event.txDigest.toLowerCase().includes(searchLower) ||
        event.sender.toLowerCase().includes(searchLower) ||
        event.type.toLowerCase().includes(searchLower)
      )
    })
  }

  // Helper methods
  static formatAmount(amount: string, decimals: number = 9): string {
    try {
      if (!amount || amount === '0') return '0'
      
      // Handle large numbers as strings to avoid precision loss
      const amountBigInt = BigInt(amount)
      if (amountBigInt === 0n) return '0'
      
      const divisor = BigInt(10 ** decimals)
      const integerPart = amountBigInt / divisor
      const fractionalPart = amountBigInt % divisor
      
      if (fractionalPart === 0n) {
        return integerPart.toLocaleString()
      }
      
      // Format fractional part with proper decimal places
      const fractionalStr = fractionalPart.toString().padStart(decimals, '0')
      const trimmedFractional = fractionalStr.replace(/0+$/, '').substring(0, 4) // Max 4 decimal places
      
      if (trimmedFractional === '') {
        return integerPart.toLocaleString()
      }
      
      return `${integerPart.toLocaleString()}.${trimmedFractional}`
    } catch (error) {
      console.error('Error formatting amount:', error, 'amount:', amount)
      return amount // Return original if formatting fails
    }
  }

  // Calculate swap amounts properly
  static calculateSwapAmounts(data: any): { swapAmountIn: string, swapAmountOut: string } {
    try {
      // Use the correct field names from the actual data
      const amount0In = BigInt(data.amount0_in || data.amount0In || '0')
      const amount1In = BigInt(data.amount1_in || data.amount1In || '0') 
      const amount0Out = BigInt(data.amount0_out || data.amount0Out || '0')
      const amount1Out = BigInt(data.amount1_out || data.amount1Out || '0')
      
      // Determine which token was swapped in/out
      const swapAmountIn = amount0In > 0n ? amount0In : amount1In
      const swapAmountOut = amount0Out > 0n ? amount0Out : amount1Out
      
      return {
        swapAmountIn: swapAmountIn.toString(),
        swapAmountOut: swapAmountOut.toString()
      }
    } catch (error) {
      console.error('Error calculating swap amounts:', error, 'data:', data)
      return {
        swapAmountIn: '0',
        swapAmountOut: '0'
      }
    }
  }

  static getEventStats(events: DexEvent[]): Record<string, any> {
    const stats = {
      total: events.length,
      PairCreated: 0,
      Swap: 0,
      LPMint: 0,
      LPBurn: 0,
      uniquePairs: new Set<string>(),
      uniqueUsers: new Set<string>()
    }

    events.forEach(event => {
      stats[event.type as keyof typeof stats] = (stats[event.type as keyof typeof stats] as number || 0) + 1
      
      if (event.pairName) {
        stats.uniquePairs.add(event.pairName)
      }
      
      if (event.sender && event.sender !== 'factory' && event.sender !== 'unknown') {
        stats.uniqueUsers.add(event.sender)
      }
    })

    return {
      ...stats,
      uniquePairs: stats.uniquePairs.size,
      uniqueUsers: stats.uniqueUsers.size
    }
  }
}