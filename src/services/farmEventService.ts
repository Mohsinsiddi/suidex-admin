// services/farmEventService.ts
import { suiClient } from '../utils/suiClient'
import { CONSTANTS } from '../constants'
import { extractTokenName } from '../utils/poolUtils'

export interface FarmEvent {
  id: string
  type: 'Staked' | 'Unstaked' | 'RewardClaimed' | 'FeesCollected' | 'FarmPauseStateChanged' | 'AdminAddressesUpdated' | 'VaultDeposit' | 'PoolCreated' | 'PoolConfigUpdated' | 'LPTypeAllowed' | 'AdminVaultSweep' | 'FarmInitialized' | 'EmissionWarning'
  eventName: string
  user?: string
  poolType?: string
  poolName?: string
  amount?: string
  data: any
  timestamp: string
  txDigest: string
  sender: string
}

export interface FarmEventFilters {
  eventType: string
  userAddress?: string
  poolType?: string
  dateRange: string
  searchTerm: string
  limit: number
}

export interface FarmEventResponse {
  events: FarmEvent[]
  hasNextPage: boolean
  nextCursor?: string
  totalCount: number
}

export class FarmEventService {
  
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

  // Helper to extract pool name from type
  static extractPoolName(poolType: any): string {
    try {
      let typeString = ''
      
      if (typeof poolType === 'string') {
        typeString = poolType
      } else if (poolType && typeof poolType === 'object' && poolType.name) {
        typeString = poolType.name
      } else {
        return 'Unknown Pool'
      }

      // Handle LP tokens
      const lpMatch = typeString.match(/::pair::LPCoin<([^,]+),\s*([^>]+)>/)
      if (lpMatch) {
        const token0 = extractTokenName(lpMatch[1])
        const token1 = extractTokenName(lpMatch[2])
        return `${token0}/${token1} LP`
      }

      // Handle single tokens
      const tokenName = extractTokenName(typeString)
      return `${tokenName} Single`
    } catch (error) {
      console.error('Error extracting pool name:', error)
      return 'Unknown Pool'
    }
  }

  // Fetch Staked events
  static async fetchStakedEvents(limit: number = 50, dateRange: string = 'all'): Promise<FarmEvent[]> {
    try {
      const events = await suiClient.queryEvents({
        query: {
          MoveEventType: `${CONSTANTS.PACKAGE_ID}::farm::Staked`
        },
        limit: Math.min(limit, 200),
        order: 'descending'
      })

      if (!events || !events.data || events.data.length === 0) {
        return []
      }

      const processedEvents: FarmEvent[] = events.data.map((event, index) => {
        const parsedEvent = event.parsedJson as any
        const poolName = this.extractPoolName(parsedEvent.pool_type)

        return {
          id: `staked-${event.id.txDigest}-${index}`,
          type: 'Staked',
          eventName: 'Tokens Staked',
          user: parsedEvent.staker || '',
          poolType: parsedEvent.pool_type?.name || parsedEvent.pool_type || '',
          poolName,
          amount: parsedEvent.amount || '0',
          data: {
            staker: parsedEvent.staker || '',
            poolType: parsedEvent.pool_type || '',
            amount: parsedEvent.amount || '0',
            timestamp: parsedEvent.timestamp || 0
          },
          timestamp: event.timestampMs || '0',
          txDigest: event.id.txDigest || '',
          sender: parsedEvent.staker || 'unknown'
        }
      })

      return processedEvents
    } catch (error) {
      console.error('Error fetching Staked events:', error)
      return []
    }
  }

  // Fetch Unstaked events
  static async fetchUnstakedEvents(limit: number = 50, dateRange: string = 'all'): Promise<FarmEvent[]> {
    try {
      const events = await suiClient.queryEvents({
        query: {
          MoveEventType: `${CONSTANTS.PACKAGE_ID}::farm::Unstaked`
        },
        limit: Math.min(limit, 200),
        order: 'descending'
      })

      if (!events || !events.data || events.data.length === 0) {
        return []
      }

      const processedEvents: FarmEvent[] = events.data.map((event, index) => {
        const parsedEvent = event.parsedJson as any
        const poolName = this.extractPoolName(parsedEvent.pool_type)

        return {
          id: `unstaked-${event.id.txDigest}-${index}`,
          type: 'Unstaked',
          eventName: 'Tokens Unstaked',
          user: parsedEvent.staker || '',
          poolType: parsedEvent.pool_type?.name || parsedEvent.pool_type || '',
          poolName,
          amount: parsedEvent.amount || '0',
          data: {
            staker: parsedEvent.staker || '',
            poolType: parsedEvent.pool_type || '',
            amount: parsedEvent.amount || '0',
            timestamp: parsedEvent.timestamp || 0
          },
          timestamp: event.timestampMs || '0',
          txDigest: event.id.txDigest || '',
          sender: parsedEvent.staker || 'unknown'
        }
      })

      return processedEvents
    } catch (error) {
      console.error('Error fetching Unstaked events:', error)
      return []
    }
  }

  // Fetch RewardClaimed events
  static async fetchRewardClaimedEvents(limit: number = 50, dateRange: string = 'all'): Promise<FarmEvent[]> {
    try {
      const events = await suiClient.queryEvents({
        query: {
          MoveEventType: `${CONSTANTS.PACKAGE_ID}::farm::RewardClaimed`
        },
        limit: Math.min(limit, 200),
        order: 'descending'
      })

      if (!events || !events.data || events.data.length === 0) {
        return []
      }

      const processedEvents: FarmEvent[] = events.data.map((event, index) => {
        const parsedEvent = event.parsedJson as any
        const poolName = this.extractPoolName(parsedEvent.pool_type)

        return {
          id: `reward-claimed-${event.id.txDigest}-${index}`,
          type: 'RewardClaimed',
          eventName: 'Rewards Claimed',
          user: parsedEvent.staker || '',
          poolType: parsedEvent.pool_type?.name || parsedEvent.pool_type || '',
          poolName,
          amount: parsedEvent.amount || '0',
          data: {
            staker: parsedEvent.staker || '',
            poolType: parsedEvent.pool_type || '',
            amount: parsedEvent.amount || '0',
            timestamp: parsedEvent.timestamp || 0
          },
          timestamp: event.timestampMs || '0',
          txDigest: event.id.txDigest || '',
          sender: parsedEvent.staker || 'unknown'
        }
      })

      return processedEvents
    } catch (error) {
      console.error('Error fetching RewardClaimed events:', error)
      return []
    }
  }

  // Fetch FeesCollected events
  static async fetchFeesCollectedEvents(limit: number = 50, dateRange: string = 'all'): Promise<FarmEvent[]> {
    try {
      const events = await suiClient.queryEvents({
        query: {
          MoveEventType: `${CONSTANTS.PACKAGE_ID}::farm::FeesCollected`
        },
        limit: Math.min(limit, 200),
        order: 'descending'
      })

      if (!events || !events.data || events.data.length === 0) {
        return []
      }

      const processedEvents: FarmEvent[] = events.data.map((event, index) => {
        const parsedEvent = event.parsedJson as any
        const poolName = this.extractPoolName(parsedEvent.pool_type)

        return {
          id: `fees-collected-${event.id.txDigest}-${index}`,
          type: 'FeesCollected',
          eventName: 'Fees Collected',
          poolType: parsedEvent.pool_type?.name || parsedEvent.pool_type || '',
          poolName,
          amount: parsedEvent.amount || '0',
          data: {
            poolType: parsedEvent.pool_type || '',
            amount: parsedEvent.amount || '0',
            feeType: parsedEvent.fee_type || 'unknown',
            timestamp: parsedEvent.timestamp || 0
          },
          timestamp: event.timestampMs || '0',
          txDigest: event.id.txDigest || '',
          sender: 'system'
        }
      })

      return processedEvents
    } catch (error) {
      console.error('Error fetching FeesCollected events:', error)
      return []
    }
  }

  // Fetch Pool Management events (PoolCreated, PoolConfigUpdated)
  static async fetchPoolManagementEvents(limit: number = 50, dateRange: string = 'all'): Promise<FarmEvent[]> {
    try {
      const [createdEvents, updatedEvents, allowedEvents] = await Promise.all([
        // PoolCreated
        suiClient.queryEvents({
          query: { MoveEventType: `${CONSTANTS.PACKAGE_ID}::farm::PoolCreated` },
          limit: Math.min(limit, 100),
          order: 'descending'
        }),
        // PoolConfigUpdated
        suiClient.queryEvents({
          query: { MoveEventType: `${CONSTANTS.PACKAGE_ID}::farm::PoolConfigUpdated` },
          limit: Math.min(limit, 100),
          order: 'descending'
        }),
        // LPTypeAllowed
        suiClient.queryEvents({
          query: { MoveEventType: `${CONSTANTS.PACKAGE_ID}::farm::LPTypeAllowed` },
          limit: Math.min(limit, 100),
          order: 'descending'
        })
      ])

      const allEvents: FarmEvent[] = []

      // Process PoolCreated events
      if (createdEvents?.data) {
        createdEvents.data.forEach((event, index) => {
          const parsedEvent = event.parsedJson as any
          const poolName = this.extractPoolName(parsedEvent.pool_type)

          allEvents.push({
            id: `pool-created-${event.id.txDigest}-${index}`,
            type: 'PoolCreated',
            eventName: 'Pool Created',
            poolType: parsedEvent.pool_type?.name || parsedEvent.pool_type || '',
            poolName,
            data: {
              poolType: parsedEvent.pool_type || '',
              allocationPoints: parsedEvent.allocation_points || 0,
              depositFee: parsedEvent.deposit_fee || 0,
              withdrawalFee: parsedEvent.withdrawal_fee || 0,
              isNativePair: parsedEvent.is_native_pair || false,
              isLpToken: parsedEvent.is_lp_token || false
            },
            timestamp: event.timestampMs || '0',
            txDigest: event.id.txDigest || '',
            sender: 'admin'
          })
        })
      }

      // Process PoolConfigUpdated events
      if (updatedEvents?.data) {
        updatedEvents.data.forEach((event, index) => {
          const parsedEvent = event.parsedJson as any
          const poolName = this.extractPoolName(parsedEvent.pool_type)

          allEvents.push({
            id: `pool-updated-${event.id.txDigest}-${index}`,
            type: 'PoolConfigUpdated',
            eventName: 'Pool Config Updated',
            poolType: parsedEvent.pool_type?.name || parsedEvent.pool_type || '',
            poolName,
            data: {
              poolType: parsedEvent.pool_type || '',
              oldAllocationPoints: parsedEvent.old_allocation_points || 0,
              newAllocationPoints: parsedEvent.new_allocation_points || 0,
              oldDepositFee: parsedEvent.old_deposit_fee || 0,
              newDepositFee: parsedEvent.new_deposit_fee || 0,
              oldWithdrawalFee: parsedEvent.old_withdrawal_fee || 0,
              newWithdrawalFee: parsedEvent.new_withdrawal_fee || 0,
              oldActive: parsedEvent.old_active || false,
              newActive: parsedEvent.new_active || false,
              timestamp: parsedEvent.timestamp || 0
            },
            timestamp: event.timestampMs || '0',
            txDigest: event.id.txDigest || '',
            sender: 'admin'
          })
        })
      }

      // Process LPTypeAllowed events
      if (allowedEvents?.data) {
        allowedEvents.data.forEach((event, index) => {
          const parsedEvent = event.parsedJson as any
          const poolName = this.extractPoolName(parsedEvent.lp_type)

          allEvents.push({
            id: `lp-allowed-${event.id.txDigest}-${index}`,
            type: 'LPTypeAllowed',
            eventName: 'LP Type Allowed',
            poolType: parsedEvent.lp_type?.name || parsedEvent.lp_type || '',
            poolName,
            data: {
              lpType: parsedEvent.lp_type || ''
            },
            timestamp: event.timestampMs || '0',
            txDigest: event.id.txDigest || '',
            sender: 'admin'
          })
        })
      }

      return allEvents
    } catch (error) {
      console.error('Error fetching pool management events:', error)
      return []
    }
  }

  // Fetch Admin events
  static async fetchAdminEvents(limit: number = 50, dateRange: string = 'all'): Promise<FarmEvent[]> {
    try {
      console.log('🔍 Fetching admin events...')
      
      const eventQueries = [
        { name: 'FarmPauseStateChanged', query: { MoveEventType: `${CONSTANTS.PACKAGE_ID}::farm::FarmPauseStateChanged` } },
        { name: 'AdminAddressesUpdated', query: { MoveEventType: `${CONSTANTS.PACKAGE_ID}::farm::AdminAddressesUpdated` } },
        { name: 'VaultDeposit', query: { MoveEventType: `${CONSTANTS.PACKAGE_ID}::farm::VaultDeposit` } },
        { name: 'AdminVaultSweep', query: { MoveEventType: `${CONSTANTS.PACKAGE_ID}::farm::AdminVaultSweep` } },
        { name: 'FarmInitialized', query: { MoveEventType: `${CONSTANTS.PACKAGE_ID}::farm::FarmInitialized` } }
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

      const [pauseEvents, addressEvents, vaultEvents, sweepEvents, initEvents] = eventResults.map(result => 
        result.status === 'fulfilled' ? result.value.data : []
      )

      const allEvents: FarmEvent[] = []

      // Process all admin events with better error handling
      const eventProcessors = [
        { data: pauseEvents, type: 'FarmPauseStateChanged', name: 'Farm Pause State Changed' },
        { data: addressEvents, type: 'AdminAddressesUpdated', name: 'Admin Addresses Updated' },
        { data: vaultEvents, type: 'VaultDeposit', name: 'Vault Deposit' },
        { data: sweepEvents, type: 'AdminVaultSweep', name: 'Admin Vault Sweep' },
        { data: initEvents, type: 'FarmInitialized', name: 'Farm Initialized' }
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

              if (type === 'VaultDeposit') {
                amount = parsedEvent.amount || '0'
                eventData = {
                  amount: parsedEvent.amount || '0',
                  totalBalance: parsedEvent.total_balance || parsedEvent.totalBalance || '0',
                  timestamp: parsedEvent.timestamp || 0
                }
              } else if (type === 'AdminVaultSweep') {
                amount = parsedEvent.amount || '0'
                user = parsedEvent.recipient || ''
                eventData = {
                  amount: parsedEvent.amount || '0',
                  recipient: parsedEvent.recipient || '',
                  remainingVaultBalance: parsedEvent.remaining_vault_balance || parsedEvent.remainingVaultBalance || '0',
                  timestamp: parsedEvent.timestamp || 0
                }
              } else if (type === 'AdminAddressesUpdated') {
                eventData = {
                  oldBurnAddress: parsedEvent.old_burn_address || parsedEvent.oldBurnAddress || '',
                  newBurnAddress: parsedEvent.new_burn_address || parsedEvent.newBurnAddress || '',
                  oldLockerAddress: parsedEvent.old_locker_address || parsedEvent.oldLockerAddress || '',
                  newLockerAddress: parsedEvent.new_locker_address || parsedEvent.newLockerAddress || '',
                  oldTeamAddress: parsedEvent.old_team_address || parsedEvent.oldTeamAddress || '',
                  newTeamAddress: parsedEvent.new_team_address || parsedEvent.newTeamAddress || '',
                  oldDevAddress: parsedEvent.old_dev_address || parsedEvent.oldDevAddress || '',
                  newDevAddress: parsedEvent.new_dev_address || parsedEvent.newDevAddress || '',
                  timestamp: parsedEvent.timestamp || 0
                }
              } else if (type === 'FarmPauseStateChanged') {
                eventData = {
                  oldPaused: parsedEvent.old_paused || parsedEvent.oldPaused || false,
                  newPaused: parsedEvent.new_paused || parsedEvent.newPaused || false,
                  admin: parsedEvent.admin || '',
                  timestamp: parsedEvent.timestamp || 0
                }
                user = parsedEvent.admin || ''
              }

              allEvents.push({
                id: `${type.toLowerCase()}-${event.id.txDigest}-${index}`,
                type: type as any,
                eventName: name,
                user,
                amount,
                data: eventData,
                timestamp: event.timestampMs || '0',
                txDigest: event.id.txDigest || '',
                sender: parsedEvent.admin || user || 'admin'
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

  // Main method to get all farm events
  static async fetchAllFarmEvents(filters: FarmEventFilters): Promise<FarmEventResponse> {
    try {
      let allEvents: FarmEvent[] = []

      if (filters.eventType === 'all') {
        const eventLimit = Math.floor(filters.limit / 6) // Distribute across event categories
        const [stakedEvents, unstakedEvents, rewardEvents, feeEvents, poolEvents, adminEvents] = await Promise.all([
          this.fetchStakedEvents(eventLimit, filters.dateRange),
          this.fetchUnstakedEvents(eventLimit, filters.dateRange),
          this.fetchRewardClaimedEvents(eventLimit, filters.dateRange),
          this.fetchFeesCollectedEvents(eventLimit, filters.dateRange),
          this.fetchPoolManagementEvents(eventLimit, filters.dateRange),
          this.fetchAdminEvents(eventLimit, filters.dateRange)
        ])
        
        allEvents = [...stakedEvents, ...unstakedEvents, ...rewardEvents, ...feeEvents, ...poolEvents, ...adminEvents]
        
      } else {
        // Fetch specific event type
        switch (filters.eventType) {
          case 'Staked':
            allEvents = await this.fetchStakedEvents(filters.limit, filters.dateRange)
            break
          case 'Unstaked':
            allEvents = await this.fetchUnstakedEvents(filters.limit, filters.dateRange)
            break
          case 'RewardClaimed':
            allEvents = await this.fetchRewardClaimedEvents(filters.limit, filters.dateRange)
            break
          case 'FeesCollected':
            allEvents = await this.fetchFeesCollectedEvents(filters.limit, filters.dateRange)
            break
          case 'PoolCreated':
          case 'PoolConfigUpdated':
          case 'LPTypeAllowed':
            allEvents = await this.fetchPoolManagementEvents(filters.limit, filters.dateRange)
            allEvents = allEvents.filter(event => event.type === filters.eventType)
            break
          case 'Admin':
            allEvents = await this.fetchAdminEvents(filters.limit, filters.dateRange)
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
          event.sender?.toLowerCase().includes(filters.userAddress!.toLowerCase())
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
      console.error('Error in fetchAllFarmEvents:', error)
      return {
        events: [],
        hasNextPage: false,
        totalCount: 0
      }
    }
  }

  // Apply search filter
  static applySearchFilter(events: FarmEvent[], searchTerm: string): FarmEvent[] {
    const searchLower = searchTerm.toLowerCase()
    
    return events.filter(event => {
      return (
        event.poolName?.toLowerCase().includes(searchLower) ||
        event.eventName.toLowerCase().includes(searchLower) ||
        event.txDigest.toLowerCase().includes(searchLower) ||
        event.sender.toLowerCase().includes(searchLower) ||
        event.user?.toLowerCase().includes(searchLower) ||
        event.type.toLowerCase().includes(searchLower)
      )
    })
  }

  // Get event statistics
  static getEventStats(events: FarmEvent[]): Record<string, any> {
    const stats = {
      total: events.length,
      Staked: 0,
      Unstaked: 0,
      RewardClaimed: 0,
      FeesCollected: 0,
      PoolCreated: 0,
      PoolConfigUpdated: 0,
      Admin: 0,
      uniqueUsers: new Set<string>(),
      uniquePools: new Set<string>()
    }

    events.forEach(event => {
      // Count by type
      if (event.type in stats) {
        stats[event.type as keyof typeof stats] = (stats[event.type as keyof typeof stats] as number || 0) + 1
      } else if (['FarmPauseStateChanged', 'AdminAddressesUpdated', 'VaultDeposit', 'AdminVaultSweep', 'FarmInitialized'].includes(event.type)) {
        stats.Admin += 1
      }
      
      // Track unique users
      if (event.user && event.user !== 'unknown') {
        stats.uniqueUsers.add(event.user)
      }
      if (event.sender && event.sender !== 'unknown' && event.sender !== 'admin' && event.sender !== 'system') {
        stats.uniqueUsers.add(event.sender)
      }
      
      // Track unique pools
      if (event.poolName) {
        stats.uniquePools.add(event.poolName)
      }
    })

    return {
      ...stats,
      uniqueUsers: stats.uniqueUsers.size,
      uniquePools: stats.uniquePools.size
    }
  }

  // Format amount for display
  static formatAmount(amount: string, decimals: number = 9): string {
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
}