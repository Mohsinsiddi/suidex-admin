// services/tokenLockerService.ts - FULLY UPDATED VERSION using tokenUtils pattern
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
        'AdminPresaleLockCreated' | 'VaultDeposit' | 'FundingDeferred' | 'EpochCreated'
  eventName: string
  data: any
  timestamp: string
  txDigest: string
  admin: string
}

export class TokenLockerService {
  
  // 🔧 UTILITY METHODS - copied from tokenUtils.ts
  static mistToVictory(mist: string): string {
    const num = BigInt(mist)
    return (Number(num) / 1e6).toString()
  }

  static mistToSui(mist: string): string {
    const num = BigInt(mist)
    return (Number(num) / 1e9).toString()
  }

  // 🔧 COPIED: Same fetchVaultBalance method from tokenUtils.ts
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
        
        console.log('TokenLocker vault structure:', { 
          vaultId, 
          vaultType,
          fields
        })
        
        let balance = '0'
        
        // Determine balance field based on vault type
        if (vaultType?.includes('::farm::RewardVault')) {
          // Farm Vault: victory_balance field
          balance = fields.victory_balance || '0'
        } else if (vaultType?.includes('::victory_token_locker::VictoryRewardVault')) {
          // Locker Reward Vault: victory_balance field
          balance = fields.victory_balance || '0'
        } else if (vaultType?.includes('::victory_token_locker::LockedTokenVault')) {
          // Locker Locked Vault: locked_balance field
          balance = fields.locked_balance || '0'
        } else if (vaultType?.includes('::victory_token_locker::SUIRewardVault')) {
          // SUI Reward Vault: sui_balance field
          balance = fields.sui_balance || '0'
        } else {
          // Fallback: try common field names
          balance = fields.victory_balance || fields.locked_balance || fields.sui_balance || fields.balance || '0'
        }

        console.log('TokenLocker vault balance extracted:', { 
          vaultId, 
          vaultType,
          balance,
          balanceFormatted: isVictoryVault ? this.mistToVictory(balance) : this.mistToSui(balance)
        })
        
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
      // Get the main TokenLocker object
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

      // Get vault balances by calling view functions
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

  // 🔧 FIXED: Use direct object access pattern from tokenUtils.ts
  static async fetchVaultBalances(): Promise<TokenLockerConfig['vaultBalances']> {
    try {
      // Use the same fetchVaultBalance method from tokenUtils.ts
      const [lockedBalance, victoryBalance, suiBalance] = await Promise.all([
        this.fetchVaultBalance(CONSTANTS.VAULT_IDS.LOCKER_LOCKED_VAULT_ID, true),  // Victory vault
        this.fetchVaultBalance(CONSTANTS.VAULT_IDS.LOCKER_REWARD_VAULT_ID, true),  // Victory vault  
        this.fetchVaultBalance(CONSTANTS.VAULT_IDS.SUI_REWARD_VAULT_ID, false)     // SUI vault
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

  // Fetch Victory and SUI allocations
  static async fetchAllocations(): Promise<TokenLockerConfig['allocations']> {
    try {
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

      // Parse victory allocations (week, 3month, year, 3year, total)
      const victoryValues = victoryResult.results?.[0]?.returnValues || []
      const suiValues = suiResult.results?.[0]?.returnValues || []

      return {
        victory: {
          week: parseInt(victoryValues[0]?.[0] || '0'),
          threeMonth: parseInt(victoryValues[1]?.[0] || '0'),
          year: parseInt(victoryValues[2]?.[0] || '0'),
          threeYear: parseInt(victoryValues[3]?.[0] || '0'),
          total: parseInt(victoryValues[4]?.[0] || '0')
        },
        sui: {
          week: parseInt(suiValues[0]?.[0] || '0'),
          threeMonth: parseInt(suiValues[1]?.[0] || '0'),
          year: parseInt(suiValues[2]?.[0] || '0'),
          threeYear: parseInt(suiValues[3]?.[0] || '0'),
          total: parseInt(suiValues[4]?.[0] || '0')
        }
      }
    } catch (error) {
      console.error('Error fetching allocations:', error)
      return {
        victory: { week: 200, threeMonth: 800, year: 2500, threeYear: 6500, total: 10000 },
        sui: { week: 1000, threeMonth: 2000, year: 3000, threeYear: 4000, total: 10000 }
      }
    }
  }

  // Fetch pool statistics
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

  // Fetch current epoch information
  static async fetchCurrentEpochInfo(): Promise<TokenLockerConfig['currentEpoch']> {
    try {
      const tx = new Transaction()
      tx.moveCall({
        target: `${CONSTANTS.PACKAGE_ID}::victory_token_locker::get_current_epoch_info`,
        arguments: [tx.object(CONSTANTS.TOKEN_LOCKER_ID)]
      })

      const result = await suiClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: '0x0000000000000000000000000000000000000000000000000000000000000000'
      })

      const values = result.results?.[0]?.returnValues || []

      return {
        id: parseInt(values[0]?.[0] || '0'),
        weekStart: parseInt(values[1]?.[0] || '0'),
        weekEnd: parseInt(values[2]?.[0] || '0'),
        isClaimable: values[3]?.[0] === 1 || values[3]?.[0] === true,
        allocationsFinalized: values[4]?.[0] === 1 || values[4]?.[0] === true
      }
    } catch (error) {
      console.error('Error fetching current epoch info:', error)
      return {
        id: 0,
        weekStart: 0,
        weekEnd: 0,
        isClaimable: false,
        allocationsFinalized: false
      }
    }
  }

  // Fetch balance tracking information
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

      // Also get lock counts from locked vault
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

  // Fetch token locker statistics for dashboard
  static async fetchTokenLockerStats(): Promise<TokenLockerStats> {
    try {
      const config = await this.fetchTokenLockerConfig()
      
      // Calculate total value locked (simplified)
      const totalLocked = parseFloat(config.poolStats.totalLocked) / Math.pow(10, 6)
      const activeLocks = config.balanceTracking.lockCount
      
      return {
        totalValueLocked: totalLocked.toFixed(2) + ' VICTORY',
        activeLocks,
        totalUsers: Math.floor(activeLocks * 0.7), // Estimate
        suiRevenueThisWeek: this.formatSUIAmount(config.vaultBalances.suiRewards),
        victoryRewardsDistributed: this.formatVictoryAmount(config.vaultBalances.victoryRewards),
        currentEpochRevenue: '0 SUI' // Would need epoch-specific call
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

  // Fetch admin events using existing VaultEventService
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

  // Fetch locker-specific events (allocations, revenue, etc.)
  static async fetchLockerSpecificEvents(): Promise<LockerAdminEvent[]> {
    try {
      const eventTypes = [
        'VictoryAllocationsUpdated',
        'SUIAllocationsUpdated', 
        'WeeklyRevenueAdded',
        'AdminPresaleLockCreated',
        'EpochCreated',
        'FundingDeferred'
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
                admin: parsedEvent.admin || 'admin'
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
      'FundingDeferred': 'Revenue Funding Deferred'
    }
    return displayNames[eventType] || eventType
  }

  // TRANSACTION BUILDERS FOR ADMIN OPERATIONS

  // Deposit Victory tokens into reward vault
  static buildDepositVictoryTokensTransaction(amount: string): Transaction {
    const tx = new Transaction()
    
    // Split coins for the amount
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
    
    // Split SUI coins for the amount
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

  // Create user lock (presale)
  static buildCreateUserLockTransaction(
    userAddress: string,
    amount: string,
    lockPeriod: number
  ): Transaction {
    const tx = new Transaction()
    
    // Split coins for the lock amount
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

  // Create vault transactions
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

  // Check if user can perform admin operations
  static canPerformAdminOperation(
    userAddress: string,
    operation: 'allocations' | 'revenue' | 'vaults' | 'locks'
  ): boolean {
    // For now, only check if user is the admin address
    // In production, you might want more granular permissions
    return userAddress === CONSTANTS.ADMIN
  }

  // Get vault health status
  static getVaultHealthStatus(config: TokenLockerConfig): {
    overall: 'healthy' | 'warning' | 'error'
    issues: string[]
    recommendations: string[]
  } {
    const issues: string[] = []
    const recommendations: string[] = []

    // Check vault balances
    const lockedBalance = parseFloat(config.vaultBalances.lockedTokens)
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
                   issues.length <= 2 ? 'warning' : 'error'

    return { overall, issues, recommendations }
  }

  // Get allocation distribution info
  static getAllocationInfo(): {
    victory: { [key: string]: { percentage: number; description: string } }
    sui: { [key: string]: { percentage: number; description: string } }
  } {
    return {
      victory: {
        week: {
          percentage: 2,
          description: 'Short-term stakers (1 week locks)'
        },
        threeMonth: {
          percentage: 8,
          description: 'Medium-term stakers (3 month locks)'
        },
        year: {
          percentage: 25,
          description: 'Long-term stakers (1 year locks)'
        },
        threeYear: {
          percentage: 65,
          description: 'Ultra long-term stakers (3 year locks)'
        }
      },
      sui: {
        week: {
          percentage: 10,
          description: 'SUI revenue for 1 week lockers'
        },
        threeMonth: {
          percentage: 20,
          description: 'SUI revenue for 3 month lockers'
        },
        year: {
          percentage: 30,
          description: 'SUI revenue for 1 year lockers'
        },
        threeYear: {
          percentage: 40,
          description: 'SUI revenue for 3 year lockers'
        }
      }
    }
  }

  // Calculate APY estimates (simplified)
  static calculateEstimatedAPY(config: TokenLockerConfig, lockPeriod: number): string {
    try {
      const poolTotal = parseFloat(config.poolStats.totalLocked)
      if (poolTotal === 0) return '0%'

      // Get allocation percentages
      const victoryAlloc = lockPeriod === 7 ? config.allocations.victory.week :
                          lockPeriod === 90 ? config.allocations.victory.threeMonth :
                          lockPeriod === 365 ? config.allocations.victory.year :
                          config.allocations.victory.threeYear

      const suiAlloc = lockPeriod === 7 ? config.allocations.sui.week :
                      lockPeriod === 90 ? config.allocations.sui.threeMonth :
                      lockPeriod === 365 ? config.allocations.sui.year :
                      config.allocations.sui.threeYear

      // Simplified APY calculation (would need more complex logic in production)
      const estimatedAPY = (victoryAlloc + suiAlloc) / 100 // Very simplified
      
      return estimatedAPY.toFixed(1) + '%'
    } catch (error) {
      return 'N/A'
    }
  }

  // Get epoch timing info
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
    const weekDuration = 7 * 24 * 60 * 60 // 1 week in seconds

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

  // Format duration helper
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

  // Get comprehensive admin dashboard data
  static async fetchAdminDashboardData(): Promise<{
    config: TokenLockerConfig
    stats: TokenLockerStats
    events: LockerAdminEvent[]
    health: ReturnType<typeof TokenLockerService.getVaultHealthStatus>
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
}