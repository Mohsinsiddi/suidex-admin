// components/tokenlocker/services/tokenLockerService.ts - ENHANCED VERSION (Part 1)
import { Transaction } from '@mysten/sui/transactions'
import { suiClient } from '../utils/suiClient'
import { CONSTANTS } from '../constants'
import { VaultEventService, type VaultEvent } from './vaultEventService'

export interface TokenLockerConfig {
  admin: string
  vaultBalances: {
    lockedTokens: string
    victoryRewards: string
    suiRewards: string
  }
  vaultIds: {
    lockedTokenVaultId: string
    victoryRewardVaultId: string
    suiRewardVaultId: string
  }
  allocations: {
    victory: {
      week: number
      threeMonth: number
      year: number
      threeYear: number
      total: number
    }
    sui: {
      week: number
      threeMonth: number
      year: number
      threeYear: number
      total: number
    }
  }
  poolStats: {
    weekLocked: string
    threeMonthLocked: string
    yearLocked: string
    threeYearLocked: string
    totalLocked: string
  }
  currentEpoch: {
    id: number
    weekStart: number
    weekEnd: number
    isClaimable: boolean
    allocationsFinalized: boolean
  }
  balanceTracking: {
    totalLockedTokens: string
    totalRewardTokens: string
    lockCount: number
    unlockCount: number
  }
}

export interface TokenLockerStats {
  totalValueLocked: string
  activeLocks: number
  totalUsers: number
  suiRevenueThisWeek: string
  victoryRewardsDistributed: string
  currentEpochRevenue: string
}

export interface LockerAdminEvent {
  id: string
  type: 'VictoryAllocationsUpdated' | 'SUIAllocationsUpdated' | 'WeeklyRevenueAdded' | 
        'AdminPresaleLockCreated' | 'VaultDeposit' | 'FundingDeferred' | 'EpochCreated' |
        'TokensLocked' | 'TokensUnlocked' | 'VictoryRewardsClaimed' | 'PoolSUIClaimed'
  eventName: string
  data: any
  timestamp: string
  txDigest: string
  admin: string
}

export interface SystemHealth {
  overall: 'healthy' | 'warning' | 'critical'
  issues: string[]
  recommendations: string[]
}

export interface BatchLockOperation {
  userAddress: string
  amount: string
  lockPeriod: number
  status: 'pending' | 'success' | 'failed'
  error?: string
}

export class TokenLockerService {
  
  // UTILITY METHODS (existing)
  static mistToVictory(mist: string): string {
    const num = BigInt(mist)
    return (Number(num) / 1e6).toString()
  }

  static mistToSui(mist: string): string {
    const num = BigInt(mist)
    return (Number(num) / 1e9).toString()
  }

  static async fetchVaultBalance(vaultId: string, isVictoryVault: boolean = true): Promise<string> {
    try {
      if (!vaultId) {
        return '0'
      }

      const vaultObject = await suiClient.getObject({
        id: vaultId,
        options: { 
          showContent: true,
          showType: true
        }
      })

      if (vaultObject.error) {
        console.error('Vault object error:', vaultId, vaultObject.error)
        return '0'
      }

      if (vaultObject.data?.content && 'fields' in vaultObject.data.content) {
        const fields = vaultObject.data.content.fields as any
        const vaultType = vaultObject.data.type
        
        let balance = '0'
        
        if (vaultType?.includes('::farm::RewardVault')) {
          balance = fields.victory_balance || '0'
        } else if (vaultType?.includes('::victory_token_locker::VictoryRewardVault')) {
          balance = fields.victory_balance || '0'
        } else if (vaultType?.includes('::victory_token_locker::LockedTokenVault')) {
          balance = fields.locked_balance || '0'
        } else if (vaultType?.includes('::victory_token_locker::SUIRewardVault')) {
          balance = fields.sui_balance || '0'
        } else {
          balance = fields.victory_balance || fields.locked_balance || fields.sui_balance || fields.balance || '0'
        }
        
        return balance.toString()
      }

      return '0'
    } catch (error) {
      console.error('Error fetching TokenLocker vault balance:', vaultId, error)
      return '0'
    }
  }

  // Fetch token locker configuration
  static async fetchTokenLockerConfig(): Promise<TokenLockerConfig> {
    try {
      const tokenLocker = await suiClient.getObject({
        id: CONSTANTS.TOKEN_LOCKER_ID,
        options: {
          showContent: true,
          showType: true
        }
      })

      if (!tokenLocker.data?.content || tokenLocker.data.content.dataType !== 'moveObject') {
        throw new Error('Invalid token locker object')
      }

      const fields = (tokenLocker.data.content as any).fields

      const [vaultBalances, allocations, poolStats, epochInfo, balanceInfo] = await Promise.all([
        this.fetchVaultBalances(),
        this.fetchAllocations(),
        this.fetchPoolStatistics(),
        this.fetchCurrentEpochInfo(),
        this.fetchBalanceTracking()
      ])

      return {
        admin: fields.admin || '',
        vaultBalances,
        vaultIds: {
          lockedTokenVaultId: CONSTANTS.VAULT_IDS.LOCKER_LOCKED_VAULT_ID,
          victoryRewardVaultId: CONSTANTS.VAULT_IDS.LOCKER_REWARD_VAULT_ID,
          suiRewardVaultId: CONSTANTS.VAULT_IDS.SUI_REWARD_VAULT_ID
        },
        allocations,
        poolStats,
        currentEpoch: epochInfo,
        balanceTracking: balanceInfo
      }
    } catch (error) {
      console.error('Error fetching token locker config:', error)
      return this.getDefaultConfig()
    }
  }

  static async fetchVaultBalances(): Promise<TokenLockerConfig['vaultBalances']> {
    try {
      const [lockedBalance, victoryBalance, suiBalance] = await Promise.all([
        this.fetchVaultBalance(CONSTANTS.VAULT_IDS.LOCKER_LOCKED_VAULT_ID, true),
        this.fetchVaultBalance(CONSTANTS.VAULT_IDS.LOCKER_REWARD_VAULT_ID, true),
        this.fetchVaultBalance(CONSTANTS.VAULT_IDS.SUI_REWARD_VAULT_ID, false)
      ])

      return {
        lockedTokens: lockedBalance,
        victoryRewards: victoryBalance,
        suiRewards: suiBalance
      }
    } catch (error) {
      console.error('Error fetching vault balances:', error)
      return {
        lockedTokens: '0',
        victoryRewards: '0',
        suiRewards: '0'
      }
    }
  }

  static async fetchAllocations(): Promise<TokenLockerConfig['allocations']> {
    try {
      const tokenLocker = await suiClient.getObject({
        id: CONSTANTS.TOKEN_LOCKER_ID,
        options: {
          showContent: true,
          showType: true
        }
      })

      if (tokenLocker.data?.content && 'fields' in tokenLocker.data.content) {
        const fields = tokenLocker.data.content.fields as any
        
        const victoryWeek = parseInt(fields.victory_week_allocation || '200')
        const victoryThreeMonth = parseInt(fields.victory_three_month_allocation || '800')
        const victoryYear = parseInt(fields.victory_year_allocation || '2500')
        const victoryThreeYear = parseInt(fields.victory_three_year_allocation || '6500')
        
        const suiWeek = parseInt(fields.sui_week_allocation || '1000')
        const suiThreeMonth = parseInt(fields.sui_three_month_allocation || '2000')
        const suiYear = parseInt(fields.sui_year_allocation || '3000')
        const suiThreeYear = parseInt(fields.sui_three_year_allocation || '4000')

        const victoryTotal = victoryWeek + victoryThreeMonth + victoryYear + victoryThreeYear
        const suiTotal = suiWeek + suiThreeMonth + suiYear + suiThreeYear

        return {
          victory: {
            week: victoryWeek,
            threeMonth: victoryThreeMonth,
            year: victoryYear,
            threeYear: victoryThreeYear,
            total: victoryTotal
          },
          sui: {
            week: suiWeek,
            threeMonth: suiThreeMonth,
            year: suiYear,
            threeYear: suiThreeYear,
            total: suiTotal
          }
        }
      }

      // Fallback to Move function calls
      const tx = new Transaction()
      tx.moveCall({
        target: `${CONSTANTS.PACKAGE_ID}::victory_token_locker::get_victory_allocations`,
        arguments: [tx.object(CONSTANTS.TOKEN_LOCKER_ID)]
      })

      const suiTx = new Transaction()
      suiTx.moveCall({
        target: `${CONSTANTS.PACKAGE_ID}::victory_token_locker::get_sui_allocations`,
        arguments: [suiTx.object(CONSTANTS.TOKEN_LOCKER_ID)]
      })

      const [victoryResult, suiResult] = await Promise.all([
        suiClient.devInspectTransactionBlock({
          transactionBlock: tx,
          sender: '0x0000000000000000000000000000000000000000000000000000000000000000'
        }),
        suiClient.devInspectTransactionBlock({
          transactionBlock: suiTx,
          sender: '0x0000000000000000000000000000000000000000000000000000000000000000'
        })
      ])

      const victoryValues = victoryResult.results?.[0]?.returnValues || []
      const suiValues = suiResult.results?.[0]?.returnValues || []

      const victoryData = {
        week: parseInt(victoryValues[0]?.[0] || '200'),
        threeMonth: parseInt(victoryValues[1]?.[0] || '800'),
        year: parseInt(victoryValues[2]?.[0] || '2500'),
        threeYear: parseInt(victoryValues[3]?.[0] || '6500'),
        total: parseInt(victoryValues[4]?.[0] || '10000')
      }

      const suiData = {
        week: parseInt(suiValues[0]?.[0] || '1000'),
        threeMonth: parseInt(suiValues[1]?.[0] || '2000'),
        year: parseInt(suiValues[2]?.[0] || '3000'),
        threeYear: parseInt(suiValues[3]?.[0] || '4000'),
        total: parseInt(suiValues[4]?.[0] || '10000')
      }

      return {
        victory: victoryData,
        sui: suiData
      }
    } catch (error) {
      console.error('Error fetching allocations:', error)
      return {
        victory: { week: 200, threeMonth: 800, year: 2500, threeYear: 6500, total: 10000 },
        sui: { week: 1000, threeMonth: 2000, year: 3000, threeYear: 4000, total: 10000 }
      }
    }
  }

  static async fetchPoolStatistics(): Promise<TokenLockerConfig['poolStats']> {
    try {
      const tx = new Transaction()
      tx.moveCall({
        target: `${CONSTANTS.PACKAGE_ID}::victory_token_locker::get_pool_statistics`,
        arguments: [tx.object(CONSTANTS.TOKEN_LOCKER_ID)]
      })

      const result = await suiClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: '0x0000000000000000000000000000000000000000000000000000000000000000'
      })

      const values = result.results?.[0]?.returnValues || []

      return {
        weekLocked: values[0]?.[0] || '0',
        threeMonthLocked: values[1]?.[0] || '0',
        yearLocked: values[2]?.[0] || '0',
        threeYearLocked: values[3]?.[0] || '0',
        totalLocked: values[4]?.[0] || '0'
      }
    } catch (error) {
      console.error('Error fetching pool statistics:', error)
      return {
        weekLocked: '0',
        threeMonthLocked: '0',
        yearLocked: '0',
        threeYearLocked: '0',
        totalLocked: '0'
      }
    }
  }

  static async fetchCurrentEpochInfo(): Promise<TokenLockerConfig['currentEpoch']> {
    try {
      const epochCreatedEvents = await suiClient.queryEvents({
        query: {
          MoveEventType: `${CONSTANTS.PACKAGE_ID}::victory_token_locker::EpochCreated`
        },
        limit: 10,
        order: 'descending'
      })

      const revenueEvents = await suiClient.queryEvents({
        query: {
          MoveEventType: `${CONSTANTS.PACKAGE_ID}::victory_token_locker::WeeklyRevenueAdded`
        },
        limit: 20,
        order: 'descending'
      })

      let currentEpoch = {
        id: 0,
        weekStart: 0,
        weekEnd: 0,
        isClaimable: false,
        allocationsFinalized: false
      }

      if (epochCreatedEvents.data && epochCreatedEvents.data.length > 0) {
        const latestEpochEvent = epochCreatedEvents.data[0]
        const epochData = latestEpochEvent.parsedJson as any

        currentEpoch = {
          id: parseInt(epochData.epoch_id || '0'),
          weekStart: parseInt(epochData.week_start || '0'),
          weekEnd: parseInt(epochData.week_end || '0'),
          isClaimable: false,
          allocationsFinalized: false
        }

        if (revenueEvents.data && revenueEvents.data.length > 0) {
          const hasRevenueForEpoch = revenueEvents.data.some(event => {
            const revenueData = event.parsedJson as any
            return parseInt(revenueData.epoch_id || '0') === currentEpoch.id
          })

          if (hasRevenueForEpoch) {
            currentEpoch.isClaimable = true
            currentEpoch.allocationsFinalized = true
          }
        }
      }

      return currentEpoch

    } catch (error) {
      console.error('Error fetching epoch info from events:', error)
      
      try {
        const tokenLocker = await suiClient.getObject({
          id: CONSTANTS.TOKEN_LOCKER_ID,
          options: {
            showContent: true,
            showType: true
          }
        })

        if (tokenLocker.data?.content && 'fields' in tokenLocker.data.content) {
          const fields = tokenLocker.data.content.fields as any
          
          const epochId = parseInt(fields.current_epoch_id || '0')
          const weekStart = parseInt(fields.current_week_start || '0')
          const weekDuration = 7 * 24 * 60 * 60
          const weekEnd = weekStart > 0 ? weekStart + weekDuration : 0

          return {
            id: epochId,
            weekStart: weekStart,
            weekEnd: weekEnd,
            isClaimable: epochId > 0,
            allocationsFinalized: epochId > 0
          }
        }
      } catch (fallbackError) {
        console.error('Fallback epoch fetch also failed:', fallbackError)
      }

      return {
        id: 0,
        weekStart: 0,
        weekEnd: 0,
        isClaimable: false,
        allocationsFinalized: false
      }
    }
  }

  static async fetchBalanceTracking(): Promise<TokenLockerConfig['balanceTracking']> {
    try {
      const tx = new Transaction()
      tx.moveCall({
        target: `${CONSTANTS.PACKAGE_ID}::victory_token_locker::get_balance_overview`,
        arguments: [
          tx.object(CONSTANTS.TOKEN_LOCKER_ID),
          tx.object(CONSTANTS.VAULT_IDS.LOCKER_LOCKED_VAULT_ID),
          tx.object(CONSTANTS.VAULT_IDS.LOCKER_REWARD_VAULT_ID),
          tx.object(CONSTANTS.VAULT_IDS.SUI_REWARD_VAULT_ID)
        ]
      })

      const result = await suiClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: '0x0000000000000000000000000000000000000000000000000000000000000000'
      })

      const values = result.results?.[0]?.returnValues || []

      const lockTx = new Transaction()
      lockTx.moveCall({
        target: `${CONSTANTS.PACKAGE_ID}::victory_token_locker::get_locked_vault_statistics`,
        arguments: [lockTx.object(CONSTANTS.VAULT_IDS.LOCKER_LOCKED_VAULT_ID)]
      })

      const lockResult = await suiClient.devInspectTransactionBlock({
        transactionBlock: lockTx,
        sender: '0x0000000000000000000000000000000000000000000000000000000000000000'
      })

      const lockValues = lockResult.results?.[0]?.returnValues || []

      return {
        totalLockedTokens: values[1]?.[0] || '0',
        totalRewardTokens: values[3]?.[0] || '0',
        lockCount: parseInt(lockValues[3]?.[0] || '0'),
        unlockCount: parseInt(lockValues[4]?.[0] || '0')
      }
    } catch (error) {
      console.error('Error fetching balance tracking:', error)
      return {
        totalLockedTokens: '0',
        totalRewardTokens: '0',
        lockCount: 0,
        unlockCount: 0
      }
    }
  }

  static async fetchTokenLockerStats(): Promise<TokenLockerStats> {
    try {
      const config = await this.fetchTokenLockerConfig()
      
      const totalLocked = parseFloat(config.poolStats.totalLocked) / Math.pow(10, 6)
      const activeLocks = config.balanceTracking.lockCount
      
      return {
        totalValueLocked: totalLocked.toFixed(2) + ' VICTORY',
        activeLocks,
        totalUsers: Math.floor(activeLocks * 0.7), // Estimate
        suiRevenueThisWeek: this.formatSUIAmount(config.vaultBalances.suiRewards),
        victoryRewardsDistributed: this.formatVictoryAmount(config.vaultBalances.victoryRewards),
        currentEpochRevenue: '0 SUI'
      }
    } catch (error) {
      console.error('Error fetching token locker stats:', error)
      return {
        totalValueLocked: '0 VICTORY',
        activeLocks: 0,
        totalUsers: 0,
        suiRevenueThisWeek: '0 SUI',
        victoryRewardsDistributed: '0 VICTORY',
        currentEpochRevenue: '0 SUI'
      }
    }
  }

  // NEW: Fetch admin events using existing VaultEventService
  static async fetchLockerAdminEvents(): Promise<LockerAdminEvent[]> {
    try {
      // Get vault events from existing service
      const vaultEvents = await VaultEventService.fetchAllVaultEvents({
        eventType: 'all',
        module: 'token_locker',
        dateRange: 'all',
        searchTerm: '',
        limit: 50
      })

      // Get additional locker-specific events
      const lockerEvents = await this.fetchLockerSpecificEvents()

      // Combine and transform
      const adminEvents: LockerAdminEvent[] = [
        ...vaultEvents.events.map(this.transformVaultEventToAdminEvent),
        ...lockerEvents
      ]

      // Sort by timestamp
      adminEvents.sort((a, b) => parseInt(b.timestamp) - parseInt(a.timestamp))

      return adminEvents.slice(0, 20) // Latest 20 events
    } catch (error) {
      console.error('Error fetching locker admin events:', error)
      return []
    }
  }

  // Fetch locker-specific events
  static async fetchLockerSpecificEvents(): Promise<LockerAdminEvent[]> {
    try {
      const eventTypes = [
        'VictoryAllocationsUpdated',
        'SUIAllocationsUpdated', 
        'WeeklyRevenueAdded',
        'AdminPresaleLockCreated',
        'EpochCreated',
        'TokensLocked',
        'TokensUnlocked',
        'VictoryRewardsClaimed',
        'PoolSUIClaimed'
      ]

      const allEvents: LockerAdminEvent[] = []

      for (const eventType of eventTypes) {
        try {
          const events = await suiClient.queryEvents({
            query: {
              MoveEventType: `${CONSTANTS.PACKAGE_ID}::victory_token_locker::${eventType}`
            },
            limit: 10,
            order: 'descending'
          })

          if (events?.data) {
            const processedEvents = events.data.map((event, index) => {
              const parsedEvent = event.parsedJson as any
              
              return {
                id: `locker-${eventType}-${event.id.txDigest}-${index}`,
                type: eventType as LockerAdminEvent['type'],
                eventName: this.getEventDisplayName(eventType),
                data: parsedEvent,
                timestamp: event.timestampMs || '0',
                txDigest: event.id.txDigest || '',
                admin: parsedEvent.admin || parsedEvent.user || 'system'
              }
            })

            allEvents.push(...processedEvents)
          }
        } catch (eventError) {
          console.warn(`Could not fetch ${eventType} events:`, eventError)
        }
      }

      return allEvents
    } catch (error) {
      console.error('Error fetching locker-specific events:', error)
      return []
    }
  }

  // Transform vault event to admin event format
  static transformVaultEventToAdminEvent(vaultEvent: VaultEvent): LockerAdminEvent {
    return {
      id: vaultEvent.id,
      type: 'VaultDeposit',
      eventName: vaultEvent.eventName,
      data: vaultEvent.data,
      timestamp: vaultEvent.timestamp,
      txDigest: vaultEvent.txDigest,
      admin: vaultEvent.admin || vaultEvent.sender
    }
  }

  // Get display name for event types
  static getEventDisplayName(eventType: string): string {
    const displayNames: Record<string, string> = {
      'VictoryAllocationsUpdated': 'Victory Allocations Updated',
      'SUIAllocationsUpdated': 'SUI Allocations Updated',
      'WeeklyRevenueAdded': 'Weekly SUI Revenue Added',
      'AdminPresaleLockCreated': 'Admin Created User Lock',
      'VaultDeposit': 'Vault Deposit',
      'EpochCreated': 'New Epoch Created',
      'FundingDeferred': 'Revenue Funding Deferred',
      'TokensLocked': 'Tokens Locked',
      'TokensUnlocked': 'Tokens Unlocked',
      'VictoryRewardsClaimed': 'Victory Rewards Claimed',
      'PoolSUIClaimed': 'Pool SUI Claimed'
    }
    return displayNames[eventType] || eventType
  }

  // NEW: System Health Monitoring
  static async fetchSystemHealth(): Promise<SystemHealth> {
    try {
      const config = await this.fetchTokenLockerConfig()
      const vaultBalances = config.vaultBalances

      const issues: string[] = []
      const recommendations: string[] = []

      // Check vault health
      if (parseFloat(vaultBalances.victoryRewards) === 0) {
        issues.push('Victory reward vault is empty')
        recommendations.push('Deposit Victory tokens for user rewards')
      }

      if (parseFloat(vaultBalances.suiRewards) < 1000000000) { // Less than 1 SUI
        issues.push('SUI reward vault is low')
        recommendations.push('Add weekly SUI revenue for distribution')
      }

      // Check allocations
      if (config.allocations.victory.total !== 10000) {
        issues.push('Victory allocations do not sum to 100%')
        recommendations.push('Update Victory allocations to total 100%')
      }

      if (config.allocations.sui.total !== 10000) {
        issues.push('SUI allocations do not sum to 100%')
        recommendations.push('Update SUI allocations to total 100%')
      }

      // Check epochs
      if (config.currentEpoch.id > 0 && !config.currentEpoch.allocationsFinalized) {
        issues.push('Current epoch allocations not finalized')
        recommendations.push('Add SUI revenue to finalize current epoch')
      }

      const overall = issues.length === 0 ? 'healthy' :
                     issues.length <= 2 ? 'warning' : 'critical'

      return { overall, issues, recommendations }
    } catch (error) {
      console.error('Error fetching system health:', error)
      return {
        overall: 'critical',
        issues: ['Failed to fetch system health data'],
        recommendations: ['Check network connection and try again']
      }
    }
  }

  // TRANSACTION BUILDERS FOR ADMIN OPERATIONS

  // Deposit Victory tokens into reward vault
  static buildDepositVictoryTokensTransaction(amount: string): Transaction {
    const tx = new Transaction()
    
    const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(amount)])
    
    tx.moveCall({
      target: `${CONSTANTS.PACKAGE_ID}::victory_token_locker::deposit_victory_tokens`,
      arguments: [
        tx.object(CONSTANTS.VAULT_IDS.LOCKER_REWARD_VAULT_ID),
        tx.object(CONSTANTS.TOKEN_LOCKER_ID),
        coin,
        tx.object(CONSTANTS.TOKEN_LOCKER_ADMIN_CAP_ID),
        tx.object(CONSTANTS.CLOCK_ID)
      ]
    })
    return tx
  }

  // Configure Victory allocations
  static buildConfigureVictoryAllocationsTransaction(allocations: {
    week: number
    threeMonth: number
    year: number
    threeYear: number
  }): Transaction {
    const tx = new Transaction()
    tx.moveCall({
      target: `${CONSTANTS.PACKAGE_ID}::victory_token_locker::configure_victory_allocations`,
      arguments: [
        tx.object(CONSTANTS.TOKEN_LOCKER_ID),
        tx.pure.u64(allocations.week),
        tx.pure.u64(allocations.threeMonth),
        tx.pure.u64(allocations.year),
        tx.pure.u64(allocations.threeYear),
        tx.object(CONSTANTS.TOKEN_LOCKER_ADMIN_CAP_ID),
        tx.object(CONSTANTS.CLOCK_ID)
      ]
    })
    return tx
  }

  // Configure SUI allocations
  static buildConfigureSUIAllocationsTransaction(allocations: {
    week: number
    threeMonth: number
    year: number
    threeYear: number
  }): Transaction {
    const tx = new Transaction()
    tx.moveCall({
      target: `${CONSTANTS.PACKAGE_ID}::victory_token_locker::configure_sui_allocations`,
      arguments: [
        tx.object(CONSTANTS.TOKEN_LOCKER_ID),
        tx.pure.u64(allocations.week),
        tx.pure.u64(allocations.threeMonth),
        tx.pure.u64(allocations.year),
        tx.pure.u64(allocations.threeYear),
        tx.object(CONSTANTS.TOKEN_LOCKER_ADMIN_CAP_ID),
        tx.object(CONSTANTS.CLOCK_ID)
      ]
    })
    return tx
  }

  // Add weekly SUI revenue
  static buildAddWeeklySUIRevenueTransaction(amount: string): Transaction {
    const tx = new Transaction()
    
    const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(amount)])
    
    tx.moveCall({
      target: `${CONSTANTS.PACKAGE_ID}::victory_token_locker::add_weekly_sui_revenue`,
      arguments: [
        tx.object(CONSTANTS.TOKEN_LOCKER_ID),
        tx.object(CONSTANTS.VAULT_IDS.SUI_REWARD_VAULT_ID),
        coin,
        tx.object(CONSTANTS.TOKEN_LOCKER_ADMIN_CAP_ID),
        tx.object(CONSTANTS.CLOCK_ID)
      ]
    })
    return tx
  }

  // NEW: Create single user lock (for presale/admin)
  static buildCreateUserLockTransaction(
    userAddress: string,
    amount: string,
    lockPeriod: number
  ): Transaction {
    const tx = new Transaction()
    
    const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(amount)])
    
    tx.moveCall({
      target: `${CONSTANTS.PACKAGE_ID}::victory_token_locker::admin_create_user_lock`,
      arguments: [
        tx.object(CONSTANTS.TOKEN_LOCKER_ID),
        tx.object(CONSTANTS.VAULT_IDS.LOCKER_LOCKED_VAULT_ID),
        coin,
        tx.pure.address(userAddress),
        tx.pure.u64(lockPeriod),
        tx.object(CONSTANTS.GLOBAL_EMISSION_CONTROLLER_ID),
        tx.object(CONSTANTS.TOKEN_LOCKER_ADMIN_CAP_ID),
        tx.object(CONSTANTS.CLOCK_ID)
      ]
    })
    return tx
  }

  // NEW: Batch user lock creation
  static buildBatchCreateUserLocksTransaction(
    operations: BatchLockOperation[]
  ): Transaction {
    const tx = new Transaction()
    
    // Prepare arrays for batch operation
    const userAddresses = operations.map(op => op.userAddress)
    const amounts = operations.map(op => op.amount)
    const lockPeriods = operations.map(op => op.lockPeriod.toString())
    
    // Calculate total amount needed
    const totalAmount = amounts.reduce((sum, amount) => sum + BigInt(amount), BigInt(0))
    
    // Split coins for the total amount
    const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(totalAmount.toString())])
    
    tx.moveCall({
      target: `${CONSTANTS.PACKAGE_ID}::victory_token_locker::admin_batch_create_user_locks`,
      arguments: [
        tx.object(CONSTANTS.TOKEN_LOCKER_ID),
        tx.object(CONSTANTS.VAULT_IDS.LOCKER_LOCKED_VAULT_ID),
        coin,
        tx.pure.vector('address', userAddresses),
        tx.pure.vector('u64', amounts),
        tx.pure.vector('u64', lockPeriods),
        tx.object(CONSTANTS.GLOBAL_EMISSION_CONTROLLER_ID),
        tx.object(CONSTANTS.TOKEN_LOCKER_ADMIN_CAP_ID),
        tx.object(CONSTANTS.CLOCK_ID)
      ]
    })
    return tx
  }

  // NEW: Vault creation transactions
  static buildCreateLockedTokenVaultTransaction(): Transaction {
    const tx = new Transaction()
    tx.moveCall({
      target: `${CONSTANTS.PACKAGE_ID}::victory_token_locker::create_locked_token_vault`,
      arguments: [tx.object(CONSTANTS.TOKEN_LOCKER_ADMIN_CAP_ID)]
    })
    return tx
  }

  static buildCreateVictoryRewardVaultTransaction(): Transaction {
    const tx = new Transaction()
    tx.moveCall({
      target: `${CONSTANTS.PACKAGE_ID}::victory_token_locker::create_victory_reward_vault`,
      arguments: [tx.object(CONSTANTS.TOKEN_LOCKER_ADMIN_CAP_ID)]
    })
    return tx
  }

  static buildCreateSUIRewardVaultTransaction(): Transaction {
    const tx = new Transaction()
    tx.moveCall({
      target: `${CONSTANTS.PACKAGE_ID}::victory_token_locker::create_sui_reward_vault`,
      arguments: [tx.object(CONSTANTS.TOKEN_LOCKER_ADMIN_CAP_ID)]
    })
    return tx
  }

  // VALIDATION FUNCTIONS

  static validateAllocations(allocations: {
    week: number
    threeMonth: number
    year: number
    threeYear: number
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    
    // Check all values are positive
    Object.entries(allocations).forEach(([key, value]) => {
      if (value < 0) errors.push(`${key} allocation cannot be negative`)
      if (value > 10000) errors.push(`${key} allocation cannot exceed 100%`)
    })
    
    // Check total equals 100% (10000 basis points)
    const total = allocations.week + allocations.threeMonth + allocations.year + allocations.threeYear
    if (total !== 10000) {
      errors.push(`Total allocation must equal 100% (currently ${total / 100}%)`)
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  static validateUserAddress(address: string): { isValid: boolean; error?: string } {
    if (!address) {
      return { isValid: false, error: 'User address is required' }
    }
    
    const addressPattern = /^0x[a-fA-F0-9]{64}$/
    if (!addressPattern.test(address)) {
      return { isValid: false, error: 'Invalid address format' }
    }
    
    if (address === '0x0000000000000000000000000000000000000000000000000000000000000000') {
      return { isValid: false, error: 'Cannot use zero address' }
    }
    
    return { isValid: true }
  }

  static validateLockPeriod(period: number): { isValid: boolean; error?: string } {
    const validPeriods = [7, 90, 365, 1095] // Week, 3-month, year, 3-year
    
    if (!validPeriods.includes(period)) {
      return { 
        isValid: false, 
        error: 'Invalid lock period. Must be 7, 90, 365, or 1095 days' 
      }
    }
    
    return { isValid: true }
  }

  static validateAmount(amount: string, minAmount: string = '1000000'): { isValid: boolean; error?: string } {
    try {
      const amountBigInt = BigInt(amount)
      const minAmountBigInt = BigInt(minAmount)
      
      if (amountBigInt <= 0) {
        return { isValid: false, error: 'Amount must be positive' }
      }
      
      if (amountBigInt < minAmountBigInt) {
        return { isValid: false, error: `Amount must be at least ${minAmount}` }
      }
      
      return { isValid: true }
    } catch (error) {
      return { isValid: false, error: 'Invalid amount format' }
    }
  }

  // NEW: Batch operations validation
  static validateBatchLockOperations(operations: BatchLockOperation[]): {
    isValid: boolean
    errors: string[]
    totalAmount: string
  } {
    const errors: string[] = []
    let totalAmount = BigInt(0)

    if (operations.length === 0) {
      errors.push('At least one lock operation is required')
    }

    if (operations.length > 100) {
      errors.push('Maximum 100 lock operations per batch')
    }

    operations.forEach((op, index) => {
      const addressValidation = this.validateUserAddress(op.userAddress)
      if (!addressValidation.isValid) {
        errors.push(`Row ${index + 1}: ${addressValidation.error}`)
      }

      const periodValidation = this.validateLockPeriod(op.lockPeriod)
      if (!periodValidation.isValid) {
        errors.push(`Row ${index + 1}: ${periodValidation.error}`)
      }

      const amountValidation = this.validateAmount(op.amount, '1000000')
      if (!amountValidation.isValid) {
        errors.push(`Row ${index + 1}: ${amountValidation.error}`)
      } else {
        totalAmount += BigInt(op.amount)
      }
    })

    return {
      isValid: errors.length === 0,
      errors,
      totalAmount: totalAmount.toString()
    }
  }

  // ERROR HANDLING

  static getTokenLockerOperationErrorMessage(error: any): string {
    if (typeof error === 'string') return error
    
    if (error?.message) {
      if (error.message.includes('E_NOT_AUTHORIZED')) {
        return 'Only admin can perform this operation'
      }
      if (error.message.includes('EVICTORY_ALLOCATION_NOT_100_PERCENT')) {
        return 'Victory allocations must sum to 100%'
      }
      if (error.message.includes('ESUI_ALLOCATION_NOT_100_PERCENT')) {
        return 'SUI allocations must sum to 100%'
      }
      if (error.message.includes('E_ZERO_ADDRESS')) {
        return 'Cannot use zero address'
      }
      if (error.message.includes('E_INVALID_LOCK_PERIOD')) {
        return 'Invalid lock period specified'
      }
      if (error.message.includes('EZERO_AMOUNT')) {
        return 'Amount must be greater than zero'
      }
      if (error.message.includes('E_INSUFFICIENT_')) {
        return 'Insufficient balance for this operation'
      }
      if (error.message.includes('E_WEEK_NOT_FINISHED')) {
        return 'Cannot add revenue until current week is finished'
      }
      if (error.message.includes('rejected')) {
        return 'Transaction was rejected by user'
      }
      
      return error.message
    }
    
    return 'An unknown error occurred'
  }

  // UTILITY FUNCTIONS

  static formatVictoryAmount(amount: string): string {
    return VaultEventService.formatVictoryAmount(amount)
  }

  static formatSUIAmount(amount: string): string {
    return VaultEventService.formatSUIAmount(amount)
  }

  static formatAddress(address: string): string {
    if (!address) return 'Unknown'
    return `${address.slice(0, 8)}...${address.slice(-6)}`
  }

  static formatTimestamp(timestamp: string): string {
    return VaultEventService.formatTimestamp(timestamp)
  }

  static formatAllocationPercentage(basisPoints: number): string {
    return (basisPoints / 100).toFixed(1) + '%'
  }

  static getLockPeriodDisplayName(period: number): string {
    const periodNames: Record<number, string> = {
      7: '1 Week',
      90: '3 Months',
      365: '1 Year',
      1095: '3 Years'
    }
    return periodNames[period] || `${period} days`
  }

  // NEW: Get lock period options for forms
  static getLockPeriodOptions(): Array<{ value: number; label: string; description: string }> {
    return [
      { value: 7, label: '1 Week', description: 'Short-term lock with 2% Victory allocation' },
      { value: 90, label: '3 Months', description: 'Medium-term lock with 8% Victory allocation' },
      { value: 365, label: '1 Year', description: 'Long-term lock with 25% Victory allocation' },
      { value: 1095, label: '3 Years', description: 'Ultra long-term lock with 65% Victory allocation' }
    ]
  }

  // NEW: Get minimum amounts for lock periods
  static getMinimumLockAmounts(): Record<number, string> {
    return {
      7: '1000000',      // 1 Victory token for 1 week
      90: '5000000',     // 5 Victory tokens for 3 months
      365: '10000000',   // 10 Victory tokens for 1 year
      1095: '25000000'   // 25 Victory tokens for 3 years
    }
  }

  static getDefaultConfig(): TokenLockerConfig {
    return {
      admin: '',
      vaultBalances: {
        lockedTokens: '0',
        victoryRewards: '0',
        suiRewards: '0'
      },
      vaultIds: {
        lockedTokenVaultId: CONSTANTS.VAULT_IDS.LOCKER_LOCKED_VAULT_ID,
        victoryRewardVaultId: CONSTANTS.VAULT_IDS.LOCKER_REWARD_VAULT_ID,
        suiRewardVaultId: CONSTANTS.VAULT_IDS.SUI_REWARD_VAULT_ID
      },
      allocations: {
        victory: {
          week: 200,      // 2%
          threeMonth: 800, // 8%
          year: 2500,     // 25%
          threeYear: 6500, // 65%
          total: 10000
        },
        sui: {
          week: 1000,     // 10%
          threeMonth: 2000, // 20%
          year: 3000,     // 30%
          threeYear: 4000, // 40%
          total: 10000
        }
      },
      poolStats: {
        weekLocked: '0',
        threeMonthLocked: '0',
        yearLocked: '0',
        threeYearLocked: '0',
        totalLocked: '0'
      },
      currentEpoch: {
        id: 0,
        weekStart: 0,
        weekEnd: 0,
        isClaimable: false,
        allocationsFinalized: false
      },
      balanceTracking: {
        totalLockedTokens: '0',
        totalRewardTokens: '0',
        lockCount: 0,
        unlockCount: 0
      }
    }
  }

  // NEW: Get vault health status
  static getVaultHealthStatus(config: TokenLockerConfig): SystemHealth {
    const issues: string[] = []
    const recommendations: string[] = []

    // Check vault balances
    const victoryBalance = parseFloat(config.vaultBalances.victoryRewards)
    const suiBalance = parseFloat(config.vaultBalances.suiRewards)

    if (victoryBalance === 0) {
      issues.push('Victory reward vault is empty')
      recommendations.push('Deposit Victory tokens for user rewards')
    }

    if (suiBalance === 0) {
      issues.push('SUI reward vault is empty')
      recommendations.push('Add weekly SUI revenue for distribution')
    }

    // Check allocations
    if (config.allocations.victory.total !== 10000) {
      issues.push('Victory allocations do not sum to 100%')
      recommendations.push('Update Victory allocations to total 100%')
    }

    if (config.allocations.sui.total !== 10000) {
      issues.push('SUI allocations do not sum to 100%')
      recommendations.push('Update SUI allocations to total 100%')
    }

    // Check epoch status
    if (config.currentEpoch.id > 0 && !config.currentEpoch.allocationsFinalized) {
      issues.push('Current epoch allocations not finalized')
      recommendations.push('Add SUI revenue to finalize current epoch')
    }

    const overall = issues.length === 0 ? 'healthy' :
                   issues.length <= 2 ? 'warning' : 'critical'

    return { overall, issues, recommendations }
  }

  // NEW: Get epoch timing info
  static getEpochTimingInfo(config: TokenLockerConfig): {
    current: {
      id: number
      progress: number
      timeRemaining: string
      status: string
    }
    next: {
      startsIn: string
      estimatedStart: Date
    }
  } {
    const now = Date.now() / 1000
    const weekDuration = 7 * 24 * 60 * 60

    let progress = 0
    let timeRemaining = 'Unknown'
    let status = 'Unknown'

    if (config.currentEpoch.weekStart > 0 && config.currentEpoch.weekEnd > 0) {
      const elapsed = now - config.currentEpoch.weekStart
      const total = config.currentEpoch.weekEnd - config.currentEpoch.weekStart
      progress = Math.min(100, (elapsed / total) * 100)

      const remaining = Math.max(0, config.currentEpoch.weekEnd - now)
      timeRemaining = this.formatDuration(remaining)

      status = config.currentEpoch.isClaimable ? 'Claimable' :
               config.currentEpoch.allocationsFinalized ? 'Finalized' : 'Active'
    }

    const nextEpochStart = config.currentEpoch.weekEnd > 0 ? 
                          new Date(config.currentEpoch.weekEnd * 1000) :
                          new Date(Date.now() + weekDuration * 1000)

    const startsIn = config.currentEpoch.weekEnd > 0 ?
                    this.formatDuration(Math.max(0, config.currentEpoch.weekEnd - now)) :
                    'Unknown'

    return {
      current: {
        id: config.currentEpoch.id,
        progress,
        timeRemaining,
        status
      },
      next: {
        startsIn,
        estimatedStart: nextEpochStart
      }
    }
  }

  static formatDuration(seconds: number): string {
    if (seconds <= 0) return '0s'

    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)

    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    if (minutes > 0) return `${minutes}m ${secs}s`
    return `${secs}s`
  }

  // NEW: Comprehensive admin dashboard data
  static async fetchAdminDashboardData(): Promise<{
    config: TokenLockerConfig
    stats: TokenLockerStats
    events: LockerAdminEvent[]
    health: SystemHealth
    timing: ReturnType<typeof TokenLockerService.getEpochTimingInfo>
  }> {
    try {
      const [config, stats, events] = await Promise.all([
        this.fetchTokenLockerConfig(),
        this.fetchTokenLockerStats(),
        this.fetchLockerAdminEvents()
      ])

      const health = this.getVaultHealthStatus(config)
      const timing = this.getEpochTimingInfo(config)

      return { config, stats, events, health, timing }
    } catch (error) {
      console.error('Error fetching admin dashboard data:', error)
      
      const defaultConfig = this.getDefaultConfig()
      return {
        config: defaultConfig,
        stats: {
          totalValueLocked: '0 VICTORY',
          activeLocks: 0,
          totalUsers: 0,
          suiRevenueThisWeek: '0 SUI',
          victoryRewardsDistributed: '0 VICTORY',
          currentEpochRevenue: '0 SUI'
        },
        events: [],
        health: this.getVaultHealthStatus(defaultConfig),
        timing: this.getEpochTimingInfo(defaultConfig)
      }
    }
  }

  // Check if user can perform admin operations
  static canPerformAdminOperation(
    userAddress: string,
    operation: 'allocations' | 'revenue' | 'vaults' | 'locks'
  ): boolean {
    return userAddress === CONSTANTS.ADMIN
  }
}