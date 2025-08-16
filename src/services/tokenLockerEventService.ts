// services/tokenLockerEventService.ts
import { suiClient } from '../utils/suiClient'
import { CONSTANTS } from '../constants'
import { extractTokenName } from '../utils/poolUtils'

export interface TokenLockerEvent {
  id: string
  type: 'TokensLocked' | 'TokensUnlocked' | 'VictoryRewardsClaimed' | 'PoolSUIClaimed' | 'WeeklyRevenueAdded' | 'VictoryAllocationsUpdated' | 'SUIAllocationsUpdated' | 'VaultDeposit' | 'AdminPresaleLockCreated' | 'BatchClaimCompleted' | 'UltimateBatchClaimCompleted' | 'SmartClaimResult' | 'EpochCreated' | 'EmissionWarning' | 'FundingDeferred' | 'SUIAutoClaimSummary'
  eventName: string
  user?: string
  admin?: string
  poolType?: string
  poolName?: string
  amount?: string
  data: any
  timestamp: string
  txDigest: string
  sender: string
}

export interface TokenLockerEventFilters {
  eventType: string
  userAddress?: string
  adminAddress?: string
  dateRange: string
  searchTerm: string
  limit: number
}

export interface TokenLockerEventResponse {
  events: TokenLockerEvent[]
  hasNextPage: boolean
  nextCursor?: string
  totalCount: number
}

export class TokenLockerEventService {
  
  // Helper to get time range filter
  static getTimeRangeFilter(dateRange: string): { startTime?: number; endTime?: number } | null {
    if (dateRange === 'all') return null
    
    const now = Date.now()
    const dayMs = 24 * 60 * 60 * 1000
    
    let startTime: number
    switch (dateRange) {
      case '1d':
        startTime = now - dayMs
        break
      case '7d':
        startTime = now - (7 * dayMs)
        break
      case '30d':
        startTime = now - (30 * dayMs)
        break
      default:
        return null
    }
    
    return { startTime, endTime: now }
  }

  // Helper to extract lock period display name
  static extractLockPeriodName(lockPeriod: any): string {
    try {
      const period = typeof lockPeriod === 'string' ? parseInt(lockPeriod) : lockPeriod
      
      switch (period) {
        case 7:
          return 'Week Lock'
        case 90:
          return '3-Month Lock'
        case 365:
          return 'Year Lock'
        case 1095:
          return '3-Year Lock'
        default:
          return `${period}-Day Lock`
      }
    } catch (error) {
      console.error('Error extracting lock period name:', error)
      return 'Unknown Lock'
    }
  }

  // Fetch TokensLocked events
  static async fetchTokensLockedEvents(limit: number = 50, dateRange: string = 'all'): Promise<TokenLockerEvent[]> {
    try {
      const events = await suiClient.queryEvents({
        query: {
          MoveEventType: `${CONSTANTS.PACKAGE_ID}::victory_token_locker::TokensLocked`
        },
        limit: Math.min(limit, 200),
        order: 'descending'
      })

      if (!events || !events.data || events.data.length === 0) {
        return []
      }

      const processedEvents: TokenLockerEvent[] = events.data.map((event, index) => {
        const parsedEvent = event.parsedJson as any
        const lockPeriodName = this.extractLockPeriodName(parsedEvent.lock_period)

        return {
          id: `tokens-locked-${event.id.txDigest}-${index}`,
          type: 'TokensLocked',
          eventName: 'Tokens Locked',
          user: parsedEvent.user || '',
          amount: parsedEvent.amount || '0',
          data: {
            user: parsedEvent.user || '',
            lockId: parsedEvent.lock_id || 0,
            amount: parsedEvent.amount || '0',
            lockPeriod: parsedEvent.lock_period || 0,
            lockPeriodName,
            lockEnd: parsedEvent.lock_end || 0,
            timestamp: parsedEvent.timestamp || 0
          },
          timestamp: event.timestampMs || '0',
          txDigest: event.id.txDigest || '',
          sender: parsedEvent.user || 'unknown'
        }
      })

      return processedEvents
    } catch (error) {
      console.error('Error fetching TokensLocked events:', error)
      return []
    }
  }

  // Fetch TokensUnlocked events
  static async fetchTokensUnlockedEvents(limit: number = 50, dateRange: string = 'all'): Promise<TokenLockerEvent[]> {
    try {
      const events = await suiClient.queryEvents({
        query: {
          MoveEventType: `${CONSTANTS.PACKAGE_ID}::victory_token_locker::TokensUnlocked`
        },
        limit: Math.min(limit, 200),
        order: 'descending'
      })

      if (!events || !events.data || events.data.length === 0) {
        return []
      }

      const processedEvents: TokenLockerEvent[] = events.data.map((event, index) => {
        const parsedEvent = event.parsedJson as any

        return {
          id: `tokens-unlocked-${event.id.txDigest}-${index}`,
          type: 'TokensUnlocked',
          eventName: 'Tokens Unlocked',
          user: parsedEvent.user || '',
          amount: parsedEvent.amount || '0',
          data: {
            user: parsedEvent.user || '',
            lockId: parsedEvent.lock_id || 0,
            amount: parsedEvent.amount || '0',
            victoryRewards: parsedEvent.victory_rewards || '0',
            suiRewards: parsedEvent.sui_rewards || '0',
            timestamp: parsedEvent.timestamp || 0
          },
          timestamp: event.timestampMs || '0',
          txDigest: event.id.txDigest || '',
          sender: parsedEvent.user || 'unknown'
        }
      })

      return processedEvents
    } catch (error) {
      console.error('Error fetching TokensUnlocked events:', error)
      return []
    }
  }

  // Fetch VictoryRewardsClaimed events
  static async fetchVictoryRewardsClaimedEvents(limit: number = 50, dateRange: string = 'all'): Promise<TokenLockerEvent[]> {
    try {
      const events = await suiClient.queryEvents({
        query: {
          MoveEventType: `${CONSTANTS.PACKAGE_ID}::victory_token_locker::VictoryRewardsClaimed`
        },
        limit: Math.min(limit, 200),
        order: 'descending'
      })

      if (!events || !events.data || events.data.length === 0) {
        return []
      }

      const processedEvents: TokenLockerEvent[] = events.data.map((event, index) => {
        const parsedEvent = event.parsedJson as any

        return {
          id: `victory-rewards-claimed-${event.id.txDigest}-${index}`,
          type: 'VictoryRewardsClaimed',
          eventName: 'Victory Rewards Claimed',
          user: parsedEvent.user || '',
          amount: parsedEvent.amount || '0',
          data: {
            user: parsedEvent.user || '',
            lockId: parsedEvent.lock_id || 0,
            amount: parsedEvent.amount || '0',
            timestamp: parsedEvent.timestamp || 0,
            totalClaimedForLock: parsedEvent.total_claimed_for_lock || '0'
          },
          timestamp: event.timestampMs || '0',
          txDigest: event.id.txDigest || '',
          sender: parsedEvent.user || 'unknown'
        }
      })

      return processedEvents
    } catch (error) {
      console.error('Error fetching VictoryRewardsClaimed events:', error)
      return []
    }
  }

  // Fetch PoolSUIClaimed events
  static async fetchPoolSUIClaimedEvents(limit: number = 50, dateRange: string = 'all'): Promise<TokenLockerEvent[]> {
    try {
      const events = await suiClient.queryEvents({
        query: {
          MoveEventType: `${CONSTANTS.PACKAGE_ID}::victory_token_locker::PoolSUIClaimed`
        },
        limit: Math.min(limit, 200),
        order: 'descending'
      })

      if (!events || !events.data || events.data.length === 0) {
        return []
      }

      const processedEvents: TokenLockerEvent[] = events.data.map((event, index) => {
        const parsedEvent = event.parsedJson as any
        const lockPeriodName = this.extractLockPeriodName(parsedEvent.lock_period)

        return {
          id: `pool-sui-claimed-${event.id.txDigest}-${index}`,
          type: 'PoolSUIClaimed',
          eventName: 'Pool SUI Claimed',
          user: parsedEvent.user || '',
          amount: parsedEvent.sui_claimed || '0',
          data: {
            user: parsedEvent.user || '',
            epochId: parsedEvent.epoch_id || 0,
            lockId: parsedEvent.lock_id || 0,
            lockPeriod: parsedEvent.lock_period || 0,
            lockPeriodName,
            poolType: parsedEvent.pool_type || 0,
            amountStaked: parsedEvent.amount_staked || '0',
            suiClaimed: parsedEvent.sui_claimed || '0',
            timestamp: parsedEvent.timestamp || 0
          },
          timestamp: event.timestampMs || '0',
          txDigest: event.id.txDigest || '',
          sender: parsedEvent.user || 'unknown'
        }
      })

      return processedEvents
    } catch (error) {
      console.error('Error fetching PoolSUIClaimed events:', error)
      return []
    }
  }

  // Fetch Revenue and Allocation events
  static async fetchRevenueAllocationEvents(limit: number = 50, dateRange: string = 'all'): Promise<TokenLockerEvent[]> {
    try {
      const [revenueEvents, victoryAllocEvents, suiAllocEvents] = await Promise.all([
        // WeeklyRevenueAdded
        suiClient.queryEvents({
          query: { MoveEventType: `${CONSTANTS.PACKAGE_ID}::victory_token_locker::WeeklyRevenueAdded` },
          limit: Math.min(limit, 100),
          order: 'descending'
        }),
        // VictoryAllocationsUpdated
        suiClient.queryEvents({
          query: { MoveEventType: `${CONSTANTS.PACKAGE_ID}::victory_token_locker::VictoryAllocationsUpdated` },
          limit: Math.min(limit, 100),
          order: 'descending'
        }),
        // SUIAllocationsUpdated
        suiClient.queryEvents({
          query: { MoveEventType: `${CONSTANTS.PACKAGE_ID}::victory_token_locker::SUIAllocationsUpdated` },
          limit: Math.min(limit, 100),
          order: 'descending'
        })
      ])

      const allEvents: TokenLockerEvent[] = []

      // Process WeeklyRevenueAdded events
      if (revenueEvents?.data) {
        revenueEvents.data.forEach((event, index) => {
          const parsedEvent = event.parsedJson as any

          allEvents.push({
            id: `weekly-revenue-${event.id.txDigest}-${index}`,
            type: 'WeeklyRevenueAdded',
            eventName: 'Weekly Revenue Added',
            amount: parsedEvent.amount || '0',
            data: {
              epochId: parsedEvent.epoch_id || 0,
              amount: parsedEvent.amount || '0',
              totalWeekRevenue: parsedEvent.total_week_revenue || '0',
              weekPoolSui: parsedEvent.week_pool_sui || '0',
              threeMonthPoolSui: parsedEvent.three_month_pool_sui || '0',
              yearPoolSui: parsedEvent.year_pool_sui || '0',
              threeYearPoolSui: parsedEvent.three_year_pool_sui || '0',
              dynamicAllocationsUsed: parsedEvent.dynamic_allocations_used || false,
              timestamp: parsedEvent.timestamp || 0
            },
            timestamp: event.timestampMs || '0',
            txDigest: event.id.txDigest || '',
            sender: 'admin'
          })
        })
      }

      // Process VictoryAllocationsUpdated events
      if (victoryAllocEvents?.data) {
        victoryAllocEvents.data.forEach((event, index) => {
          const parsedEvent = event.parsedJson as any

          allEvents.push({
            id: `victory-alloc-${event.id.txDigest}-${index}`,
            type: 'VictoryAllocationsUpdated',
            eventName: 'Victory Allocations Updated',
            data: {
              weekAllocation: parsedEvent.week_allocation || 0,
              threeMonthAllocation: parsedEvent.three_month_allocation || 0,
              yearAllocation: parsedEvent.year_allocation || 0,
              threeYearAllocation: parsedEvent.three_year_allocation || 0,
              totalCheck: parsedEvent.total_check || 0,
              timestamp: parsedEvent.timestamp || 0
            },
            timestamp: event.timestampMs || '0',
            txDigest: event.id.txDigest || '',
            sender: 'admin'
          })
        })
      }

      // Process SUIAllocationsUpdated events
      if (suiAllocEvents?.data) {
        suiAllocEvents.data.forEach((event, index) => {
          const parsedEvent = event.parsedJson as any

          allEvents.push({
            id: `sui-alloc-${event.id.txDigest}-${index}`,
            type: 'SUIAllocationsUpdated',
            eventName: 'SUI Allocations Updated',
            data: {
              weekAllocation: parsedEvent.week_allocation || 0,
              threeMonthAllocation: parsedEvent.three_month_allocation || 0,
              yearAllocation: parsedEvent.year_allocation || 0,
              threeYearAllocation: parsedEvent.three_year_allocation || 0,
              totalCheck: parsedEvent.total_check || 0,
              timestamp: parsedEvent.timestamp || 0
            },
            timestamp: event.timestampMs || '0',
            txDigest: event.id.txDigest || '',
            sender: 'admin'
          })
        })
      }

      return allEvents
    } catch (error) {
      console.error('Error fetching revenue/allocation events:', error)
      return []
    }
  }

  // Fetch Admin events
  static async fetchAdminEvents(limit: number = 50, dateRange: string = 'all'): Promise<TokenLockerEvent[]> {
    try {
      console.log('🔍 Fetching token locker admin events...')
      
      const eventQueries = [
        { name: 'VaultDeposit', query: { MoveEventType: `${CONSTANTS.PACKAGE_ID}::victory_token_locker::VaultDeposit` } },
        { name: 'AdminPresaleLockCreated', query: { MoveEventType: `${CONSTANTS.PACKAGE_ID}::victory_token_locker::AdminPresaleLockCreated` } },
        { name: 'EpochCreated', query: { MoveEventType: `${CONSTANTS.PACKAGE_ID}::victory_token_locker::EpochCreated` } },
        { name: 'EmissionWarning', query: { MoveEventType: `${CONSTANTS.PACKAGE_ID}::victory_token_locker::EmissionWarning` } },
        { name: 'FundingDeferred', query: { MoveEventType: `${CONSTANTS.PACKAGE_ID}::victory_token_locker::FundingDeferred` } }
      ]

      const eventResults = await Promise.allSettled(
        eventQueries.map(async ({ name, query }) => {
          try {
            console.log(`🔍 Fetching ${name} events...`)
            const result = await suiClient.queryEvents({
              query,
              limit: Math.min(limit, 50),
              order: 'descending'
            })
            console.log(`✅ ${name}: Found ${result?.data?.length || 0} events`)
            return { name, data: result?.data || [] }
          } catch (error) {
            console.error(`❌ Error fetching ${name} events:`, error)
            return { name, data: [] }
          }
        })
      )

      const [vaultEvents, presaleEvents, epochEvents, warningEvents, deferredEvents] = eventResults.map(result => 
        result.status === 'fulfilled' ? result.value.data : []
      )

      const allEvents: TokenLockerEvent[] = []

      // Process all admin events with better error handling
      const eventProcessors = [
        { data: vaultEvents, type: 'VaultDeposit', name: 'Vault Deposit' },
        { data: presaleEvents, type: 'AdminPresaleLockCreated', name: 'Admin Presale Lock Created' },
        { data: epochEvents, type: 'EpochCreated', name: 'Epoch Created' },
        { data: warningEvents, type: 'EmissionWarning', name: 'Emission Warning' },
        { data: deferredEvents, type: 'FundingDeferred', name: 'Funding Deferred' }
      ]

      eventProcessors.forEach(({ data, type, name }) => {
        if (data && Array.isArray(data)) {
          console.log(`🔄 Processing ${data.length} ${type} events`)
          data.forEach((event, index) => {
            try {
              const parsedEvent = event.parsedJson as any
              console.log(`📝 Processing ${type} event:`, parsedEvent)

              // Handle different admin event types with specific data extraction
              let eventData = parsedEvent
              let amount = undefined
              let user = undefined
              let admin = undefined

              if (type === 'VaultDeposit') {
                amount = parsedEvent.amount || '0'
                eventData = {
                  vaultType: parsedEvent.vault_type || '',
                  amount: parsedEvent.amount || '0',
                  totalBalance: parsedEvent.total_balance || '0',
                  timestamp: parsedEvent.timestamp || 0
                }
              } else if (type === 'AdminPresaleLockCreated') {
                amount = parsedEvent.amount || '0'
                user = parsedEvent.user || ''
                admin = parsedEvent.admin || ''
                const lockPeriodName = this.extractLockPeriodName(parsedEvent.lock_period)
                eventData = {
                  admin: parsedEvent.admin || '',
                  user: parsedEvent.user || '',
                  lockId: parsedEvent.lock_id || 0,
                  amount: parsedEvent.amount || '0',
                  lockPeriod: parsedEvent.lock_period || 0,
                  lockPeriodName,
                  lockEnd: parsedEvent.lock_end || 0,
                  timestamp: parsedEvent.timestamp || 0
                }
              } else if (type === 'EpochCreated') {
                eventData = {
                  epochId: parsedEvent.epoch_id || 0,
                  weekStart: parsedEvent.week_start || 0,
                  weekEnd: parsedEvent.week_end || 0,
                  timestamp: parsedEvent.timestamp || 0
                }
              } else if (type === 'EmissionWarning') {
                eventData = {
                  message: parsedEvent.message || '',
                  lockId: parsedEvent.lock_id || null,
                  timestamp: parsedEvent.timestamp || 0
                }
              } else if (type === 'FundingDeferred') {
                eventData = {
                  reason: parsedEvent.reason || '',
                  required: parsedEvent.required || 0,
                  current: parsedEvent.current || 0,
                  timestamp: parsedEvent.timestamp || 0
                }
              }

              allEvents.push({
                id: `${type.toLowerCase()}-${event.id.txDigest}-${index}`,
                type: type as any,
                eventName: name,
                user,
                admin,
                amount,
                data: eventData,
                timestamp: event.timestampMs || '0',
                txDigest: event.id.txDigest || '',
                sender: admin || user || 'admin'
              })
            } catch (error) {
              console.error(`❌ Error processing ${type} event:`, error, event)
            }
          })
        } else {
          console.warn(`⚠️ No data for ${type} events`)
        }
      })

      console.log(`✅ Processed ${allEvents.length} total admin events`)
      return allEvents
    } catch (error) {
      console.error('❌ Error fetching admin events:', error)
      return []
    }
  }

  // Fetch Batch Claim events
  static async fetchBatchClaimEvents(limit: number = 50, dateRange: string = 'all'): Promise<TokenLockerEvent[]> {
    try {
      const [batchEvents, ultimateEvents, smartEvents, autoClaimEvents] = await Promise.all([
        // BatchClaimCompleted
        suiClient.queryEvents({
          query: { MoveEventType: `${CONSTANTS.PACKAGE_ID}::victory_token_locker::BatchClaimCompleted` },
          limit: Math.min(limit, 50),
          order: 'descending'
        }),
        // UltimateBatchClaimCompleted
        suiClient.queryEvents({
          query: { MoveEventType: `${CONSTANTS.PACKAGE_ID}::victory_token_locker::UltimateBatchClaimCompleted` },
          limit: Math.min(limit, 50),
          order: 'descending'
        }),
        // SmartClaimResult
        suiClient.queryEvents({
          query: { MoveEventType: `${CONSTANTS.PACKAGE_ID}::victory_token_locker::SmartClaimResult` },
          limit: Math.min(limit, 50),
          order: 'descending'
        }),
        // SUIAutoClaimSummary
        suiClient.queryEvents({
          query: { MoveEventType: `${CONSTANTS.PACKAGE_ID}::victory_token_locker::SUIAutoClaimSummary` },
          limit: Math.min(limit, 50),
          order: 'descending'
        })
      ])

      const allEvents: TokenLockerEvent[] = []

      // Process BatchClaimCompleted events
      if (batchEvents?.data) {
        batchEvents.data.forEach((event, index) => {
          const parsedEvent = event.parsedJson as any

          allEvents.push({
            id: `batch-claim-${event.id.txDigest}-${index}`,
            type: 'BatchClaimCompleted',
            eventName: 'Batch Claim Completed',
            user: parsedEvent.user || '',
            amount: parsedEvent.total_sui_claimed || '0',
            data: {
              user: parsedEvent.user || '',
              lockId: parsedEvent.lock_id || 0,
              epochsClaimed: parsedEvent.epochs_claimed || 0,
              totalSuiClaimed: parsedEvent.total_sui_claimed || '0',
              timestamp: parsedEvent.timestamp || 0
            },
            timestamp: event.timestampMs || '0',
            txDigest: event.id.txDigest || '',
            sender: parsedEvent.user || 'unknown'
          })
        })
      }

      // Process UltimateBatchClaimCompleted events
      if (ultimateEvents?.data) {
        ultimateEvents.data.forEach((event, index) => {
          const parsedEvent = event.parsedJson as any

          allEvents.push({
            id: `ultimate-batch-claim-${event.id.txDigest}-${index}`,
            type: 'UltimateBatchClaimCompleted',
            eventName: 'Ultimate Batch Claim Completed',
            user: parsedEvent.user || '',
            amount: parsedEvent.total_sui_claimed || '0',
            data: {
              user: parsedEvent.user || '',
              locksProcessed: parsedEvent.locks_processed || 0,
              totalEpochsClaimed: parsedEvent.total_epochs_claimed || 0,
              totalSuiClaimed: parsedEvent.total_sui_claimed || '0',
              timestamp: parsedEvent.timestamp || 0
            },
            timestamp: event.timestampMs || '0',
            txDigest: event.id.txDigest || '',
            sender: parsedEvent.user || 'unknown'
          })
        })
      }

      // Process SmartClaimResult events
      if (smartEvents?.data) {
        smartEvents.data.forEach((event, index) => {
          const parsedEvent = event.parsedJson as any

          allEvents.push({
            id: `smart-claim-${event.id.txDigest}-${index}`,
            type: 'SmartClaimResult',
            eventName: 'Smart Claim Result',
            user: parsedEvent.user || '',
            amount: parsedEvent.sui_claimed || '0',
            data: {
              user: parsedEvent.user || '',
              strategyUsed: parsedEvent.strategy_used || '',
              locksProcessed: parsedEvent.locks_processed || 0,
              epochsClaimed: parsedEvent.epochs_claimed || 0,
              suiClaimed: parsedEvent.sui_claimed || '0',
              timestamp: parsedEvent.timestamp || 0
            },
            timestamp: event.timestampMs || '0',
            txDigest: event.id.txDigest || '',
            sender: parsedEvent.user || 'unknown'
          })
        })
      }

      // Process SUIAutoClaimSummary events
      if (autoClaimEvents?.data) {
        autoClaimEvents.data.forEach((event, index) => {
          const parsedEvent = event.parsedJson as any

          allEvents.push({
            id: `auto-claim-summary-${event.id.txDigest}-${index}`,
            type: 'SUIAutoClaimSummary',
            eventName: 'SUI Auto Claim Summary',
            user: parsedEvent.user || '',
            amount: parsedEvent.total_sui_claimed || '0',
            data: {
              user: parsedEvent.user || '',
              lockId: parsedEvent.lock_id || 0,
              totalSuiClaimed: parsedEvent.total_sui_claimed || '0',
              timestamp: parsedEvent.timestamp || 0
            },
            timestamp: event.timestampMs || '0',
            txDigest: event.id.txDigest || '',
            sender: parsedEvent.user || 'unknown'
          })
        })
      }

      return allEvents
    } catch (error) {
      console.error('Error fetching batch claim events:', error)
      return []
    }
  }

  // Main method to get all token locker events
  static async fetchAllTokenLockerEvents(filters: TokenLockerEventFilters): Promise<TokenLockerEventResponse> {
    try {
      let allEvents: TokenLockerEvent[] = []

      if (filters.eventType === 'all') {
        const eventLimit = Math.floor(filters.limit / 7) // Distribute across event categories
        const [lockedEvents, unlockedEvents, victoryEvents, suiEvents, revenueEvents, adminEvents, batchEvents] = await Promise.all([
          this.fetchTokensLockedEvents(eventLimit, filters.dateRange),
          this.fetchTokensUnlockedEvents(eventLimit, filters.dateRange),
          this.fetchVictoryRewardsClaimedEvents(eventLimit, filters.dateRange),
          this.fetchPoolSUIClaimedEvents(eventLimit, filters.dateRange),
          this.fetchRevenueAllocationEvents(eventLimit, filters.dateRange),
          this.fetchAdminEvents(eventLimit, filters.dateRange),
          this.fetchBatchClaimEvents(eventLimit, filters.dateRange)
        ])
        
        allEvents = [...lockedEvents, ...unlockedEvents, ...victoryEvents, ...suiEvents, ...revenueEvents, ...adminEvents, ...batchEvents]
        
      } else {
        // Fetch specific event type
        switch (filters.eventType) {
          case 'TokensLocked':
            allEvents = await this.fetchTokensLockedEvents(filters.limit, filters.dateRange)
            break
          case 'TokensUnlocked':
            allEvents = await this.fetchTokensUnlockedEvents(filters.limit, filters.dateRange)
            break
          case 'VictoryRewardsClaimed':
            allEvents = await this.fetchVictoryRewardsClaimedEvents(filters.limit, filters.dateRange)
            break
          case 'PoolSUIClaimed':
            allEvents = await this.fetchPoolSUIClaimedEvents(filters.limit, filters.dateRange)
            break
          case 'Revenue':
            allEvents = await this.fetchRevenueAllocationEvents(filters.limit, filters.dateRange)
            allEvents = allEvents.filter(event => ['WeeklyRevenueAdded', 'VictoryAllocationsUpdated', 'SUIAllocationsUpdated'].includes(event.type))
            break
          case 'Admin':
            allEvents = await this.fetchAdminEvents(filters.limit, filters.dateRange)
            break
          case 'BatchClaim':
            allEvents = await this.fetchBatchClaimEvents(filters.limit, filters.dateRange)
            break
          default:
            allEvents = []
        }
      }

      // Sort by timestamp (newest first)
      allEvents.sort((a, b) => {
        const timeA = parseInt(a.timestamp)
        const timeB = parseInt(b.timestamp) 
        return timeB - timeA
      })

      // Apply search filter
      if (filters.searchTerm && filters.searchTerm.trim()) {
        allEvents = this.applySearchFilter(allEvents, filters.searchTerm.trim())
      }

      // Apply user filter
      if (filters.userAddress && filters.userAddress.trim()) {
        allEvents = allEvents.filter(event => 
          event.user?.toLowerCase().includes(filters.userAddress!.toLowerCase()) ||
          event.sender?.toLowerCase().includes(filters.userAddress!.toLowerCase()) ||
          event.admin?.toLowerCase().includes(filters.userAddress!.toLowerCase())
        )
      }

      // Apply admin filter
      if (filters.adminAddress && filters.adminAddress.trim()) {
        allEvents = allEvents.filter(event => 
          event.admin?.toLowerCase().includes(filters.adminAddress!.toLowerCase()) ||
          event.sender?.toLowerCase().includes(filters.adminAddress!.toLowerCase())
        )
      }
      
      // Apply final limit
      const limitedEvents = allEvents.slice(0, filters.limit)

      return {
        events: limitedEvents,
        hasNextPage: false,
        totalCount: limitedEvents.length
      }
    } catch (error) {
      console.error('Error in fetchAllTokenLockerEvents:', error)
      return {
        events: [],
        hasNextPage: false,
        totalCount: 0
      }
    }
  }

  // Apply search filter
  static applySearchFilter(events: TokenLockerEvent[], searchTerm: string): TokenLockerEvent[] {
    const searchLower = searchTerm.toLowerCase()
    
    return events.filter(event => {
      return (
        event.eventName.toLowerCase().includes(searchLower) ||
        event.txDigest.toLowerCase().includes(searchLower) ||
        event.sender.toLowerCase().includes(searchLower) ||
        event.user?.toLowerCase().includes(searchLower) ||
        event.admin?.toLowerCase().includes(searchLower) ||
        event.type.toLowerCase().includes(searchLower) ||
        JSON.stringify(event.data).toLowerCase().includes(searchLower)
      )
    })
  }

  // Get event statistics
  static getEventStats(events: TokenLockerEvent[]): Record<string, any> {
    const stats = {
      total: events.length,
      TokensLocked: 0,
      TokensUnlocked: 0,
      VictoryRewardsClaimed: 0,
      PoolSUIClaimed: 0,
      WeeklyRevenueAdded: 0,
      VictoryAllocationsUpdated: 0,
      SUIAllocationsUpdated: 0,
      VaultDeposit: 0,
      AdminPresaleLockCreated: 0,
      BatchClaimCompleted: 0,
      UltimateBatchClaimCompleted: 0,
      SmartClaimResult: 0,
      EpochCreated: 0,
      EmissionWarning: 0,
      FundingDeferred: 0,
      SUIAutoClaimSummary: 0,
      Admin: 0,
      Revenue: 0,
      BatchClaim: 0,
      uniqueUsers: new Set<string>(),
      uniqueAdmins: new Set<string>()
    }

    events.forEach(event => {
      // Count by type
      if (event.type in stats) {
        stats[event.type as keyof typeof stats] = (stats[event.type as keyof typeof stats] as number || 0) + 1
      }

      // Group admin events
      if (['VaultDeposit', 'AdminPresaleLockCreated', 'EpochCreated', 'EmissionWarning', 'FundingDeferred'].includes(event.type)) {
        stats.Admin += 1
      }

      // Group revenue events
      if (['WeeklyRevenueAdded', 'VictoryAllocationsUpdated', 'SUIAllocationsUpdated'].includes(event.type)) {
        stats.Revenue += 1
      }

      // Group batch claim events
      if (['BatchClaimCompleted', 'UltimateBatchClaimCompleted', 'SmartClaimResult', 'SUIAutoClaimSummary'].includes(event.type)) {
        stats.BatchClaim += 1
      }
      
      // Track unique users
      if (event.user && event.user !== 'unknown') {
        stats.uniqueUsers.add(event.user)
      }
      if (event.sender && event.sender !== 'unknown' && event.sender !== 'admin' && event.sender !== 'system') {
        stats.uniqueUsers.add(event.sender)
      }

      // Track unique admins
      if (event.admin && event.admin !== 'unknown') {
        stats.uniqueAdmins.add(event.admin)
      }
      if (event.sender === 'admin') {
        stats.uniqueAdmins.add('admin')
      }
    })

    return {
      ...stats,
      uniqueUsers: stats.uniqueUsers.size,
      uniqueAdmins: stats.uniqueAdmins.size
    }
  }

  // Format amount for display
  static formatAmount(amount: string, decimals: number = 6): string {
    try {
      if (!amount || amount === '0') return '0'
      
      const amountBigInt = BigInt(amount)
      if (amountBigInt === 0n) return '0'
      
      const divisor = BigInt(10 ** decimals)
      const integerPart = amountBigInt / divisor
      const fractionalPart = amountBigInt % divisor
      
      if (fractionalPart === 0n) {
        return integerPart.toLocaleString()
      }
      
      const fractionalStr = fractionalPart.toString().padStart(decimals, '0')
      const trimmedFractional = fractionalStr.replace(/0+$/, '').substring(0, 4)
      
      if (trimmedFractional === '') {
        return integerPart.toLocaleString()
      }
      
      return `${integerPart.toLocaleString()}.${trimmedFractional}`
    } catch (error) {
      console.error('Error formatting amount:', error)
      return amount
    }
  }

  // Format timestamp for display
  static formatTimestamp(timestamp: string): string {
    try {
      const date = new Date(parseInt(timestamp))
      return date.toLocaleString()
    } catch (error) {
      console.error('Error formatting timestamp:', error)
      return timestamp
    }
  }

  // Get lock period display name
  static getLockPeriodDisplayName(lockPeriod: number): string {
    switch (lockPeriod) {
      case 7:
        return 'Week Lock'
      case 90:
        return '3-Month Lock'
      case 365:
        return 'Year Lock'
      case 1095:
        return '3-Year Lock'
      default:
        return `${lockPeriod}-Day Lock`
    }
  }

  // Get pool type display name
  static getPoolTypeDisplayName(poolType: number): string {
    switch (poolType) {
      case 0:
        return 'Week Pool'
      case 1:
        return '3-Month Pool'
      case 2:
        return 'Year Pool'
      case 3:
        return '3-Year Pool'
      default:
        return `Pool ${poolType}`
    }
  }
}