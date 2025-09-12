// components/tokenlocker/services/tokenLockerService.ts - COMPLETE UPDATED VERSION
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
  // NEW: Protocol timing info
  protocolTiming: {
    protocolStart: number
    epochDuration: number
    initialized: boolean
    totalEpochs: number
  }
}

// NEW: Enhanced epoch info interface
export interface EpochInfo {
  epochId: number
  weekNumber: number
  weekStart: number
  weekEnd: number
  totalRevenue: string
  isClaimable: boolean
  allocationsFinalized: boolean
  poolDistribution: {
    weekPoolSui: string
    threeMonthPoolSui: string
    yearPoolSui: string
    threeYearPoolSui: string
  }
  timestamp: string
  txDigest?: string
  admin?: string
  status: 'pending' | 'created' | 'revenue_added' | 'claimable'
  isCurrentEpoch?: boolean
  progress?: number
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
        'TokensLocked' | 'TokensUnlocked' | 'VictoryRewardsClaimed' | 'PoolSUIClaimed' |
        'ProtocolTimingInitialized'
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

  // NEW: CRITICAL FIX - Convert lock period to numeric days with validation
  static convertLockPeriodToDays(lockPeriod: number | string): number {
    // Handle numeric input directly
    if (typeof lockPeriod === 'number') {
      // Validate it's a reasonable lock period
      if (lockPeriod === 7 || lockPeriod === 90 || lockPeriod === 365 || lockPeriod === 1095) {
        return lockPeriod
      }
      // If it's a reasonable small number, assume it's already in days
      if (lockPeriod > 0 && lockPeriod <= 1095) {
        return lockPeriod
      }
      // Default fallback
      return 90
    }
    
    // Handle string input
    const periodMap: Record<string, number> = {
      '1 Week': 7,
      '3 Months': 90,
      '1 Year': 365,
      '3 Years': 1095,
      'week': 7,
      'threeMonth': 90,
      'year': 365,
      'threeYear': 1095,
      '7': 7,
      '90': 90,
      '365': 365,
      '1095': 1095
    }
    
    const result = periodMap[lockPeriod] || parseInt(lockPeriod.toString()) || 90
    
    // Final validation - ensure result is a valid lock period
    const validPeriods = [7, 90, 365, 1095]
    if (!validPeriods.includes(result)) {
      console.warn(`Invalid lock period ${lockPeriod}, defaulting to 90 days`)
      return 90
    }
    
    return result
  }

  // NEW: Debug helper to check coin types in wallet
  static async debugAdminWallet(adminAddress: string): Promise<void> {
    try {
      console.log('=== DEBUGGING ADMIN WALLET ===')
      console.log('Admin address:', adminAddress)
      console.log('Expected Victory token type:', CONSTANTS.VICTORY_TOKEN.TYPE)
      
      const allCoins = await suiClient.getAllCoins({ owner: adminAddress })
      console.log('Total coins in wallet:', allCoins.data?.length || 0)
      
      if (allCoins.data && allCoins.data.length > 0) {
        const coinTypes = new Set(allCoins.data.map(coin => coin.coinType))
        coinTypes.forEach(type => {
          const coinsOfType = allCoins.data.filter(coin => coin.coinType === type)
          const totalBalance = coinsOfType.reduce((sum, coin) => sum + BigInt(coin.balance), BigInt(0))
          console.log(`  ${type}: ${coinsOfType.length} coins, balance: ${totalBalance}`)
        })
      }
      
      const victoryCoins = await suiClient.getCoins({
        owner: adminAddress,
        coinType: CONSTANTS.VICTORY_TOKEN.TYPE
      })
      
      console.log('Victory token coins found:', victoryCoins.data?.length || 0)
      console.log('=== END DEBUG ===')
    } catch (error) {
      console.error('Debug error:', error)
    }
  }

  // NEW: Helper - Check admin Victory token balance
  static async checkAdminVictoryBalance(adminAddress: string): Promise<{
    hasTokens: boolean,
    totalBalance: string,
    coinCount: number,
    formattedBalance: string
  }> {
    try {
      const coins = await suiClient.getCoins({
        owner: adminAddress,
        coinType: CONSTANTS.VICTORY_TOKEN.TYPE
      })

      const totalBalance = coins.data?.reduce((sum, coin) => 
        sum + BigInt(coin.balance), BigInt(0)
      ) || BigInt(0)

      return {
        hasTokens: totalBalance > 0,
        totalBalance: totalBalance.toString(),
        coinCount: coins.data?.length || 0,
        formattedBalance: this.mistToVictory(totalBalance.toString()) + ' VICTORY'
      }
    } catch (error) {
      console.error('Error checking admin balance:', error)
      return {
        hasTokens: false,
        totalBalance: '0',
        coinCount: 0,
        formattedBalance: '0 VICTORY'
      }
    }
  }

  // NEW: Fetch Victory token coins from admin wallet
  // FIXED: Fetch Victory token coins from admin wallet
  static async fetchVictoryTokenCoins(adminAddress: string, requiredAmount: string): Promise<string[]> {
    try {
      const coins = await suiClient.getCoins({
        owner: adminAddress,
        coinType: CONSTANTS.VICTORY_TOKEN.TYPE
      })

      if (!coins.data || coins.data.length === 0) {
        throw new Error(`No Victory token coins found. Admin needs Victory tokens in wallet.`)
      }

      // FIX: Proper BigInt comparison for sorting
      const sortedCoins = coins.data.sort((a, b) => {
        const balanceA = BigInt(a.balance)
        const balanceB = BigInt(b.balance)
        
        // Convert BigInt comparison to number for sort
        if (balanceA > balanceB) return -1  // b should come first (descending)
        if (balanceA < balanceB) return 1   // a should come first
        return 0  // equal
      })

      const validCoinIds = sortedCoins
        .map(coin => coin.coinObjectId)
        .filter(id => id && id.startsWith('0x'))

      if (validCoinIds.length === 0) {
        throw new Error('No valid coin object IDs found')
      }

      const totalBalance = sortedCoins.reduce((sum, coin) => 
        sum + BigInt(coin.balance), BigInt(0)
      )

      if (totalBalance < BigInt(requiredAmount)) {
        throw new Error(
          `Insufficient Victory tokens. Required: ${this.mistToVictory(requiredAmount)} VICTORY, Available: ${this.mistToVictory(totalBalance.toString())} VICTORY`
        )
      }

      return validCoinIds
    } catch (error) {
      console.error('Error fetching Victory token coins:', error)
      throw error
    }
  }

  // NEW: Alternative - Use Treasury/Minting approach if admin has no Victory tokens
  static buildMintAndCreateUserLockTransaction(
    userAddress: string,
    amount: string,
    lockPeriod: number | string
  ): Transaction {
    const tx = new Transaction()
    
    const lockPeriodDays = this.convertLockPeriodToDays(lockPeriod)
    console.log('Mint approach - Lock period:', lockPeriod, '->', lockPeriodDays, 'days')
    
    const [mintedCoins] = tx.moveCall({
      target: `${CONSTANTS.PACKAGE_ID}::victory_token::mint`,
      arguments: [
        tx.object(CONSTANTS.VICTORY_TOKEN.MINTER_CAP_ID),
        tx.pure.u64(amount)
      ]
    })
    
    tx.moveCall({
      target: `${CONSTANTS.PACKAGE_ID}::victory_token_locker::admin_create_user_lock`,
      arguments: [
        tx.object(CONSTANTS.TOKEN_LOCKER_ID),
        tx.object(CONSTANTS.VAULT_IDS.LOCKER_LOCKED_VAULT_ID),
        mintedCoins,
        tx.pure.address(userAddress),
        tx.pure.u64(lockPeriodDays),
        tx.object(CONSTANTS.GLOBAL_EMISSION_CONTROLLER_ID),
        tx.object(CONSTANTS.TOKEN_LOCKER_ADMIN_CAP_ID),
        tx.object(CONSTANTS.CLOCK_ID)
      ]
    })
    
    return tx
  }

  // NEW: Method 1 - Use existing Victory tokens from wallet
  static async buildCreateUserLockWithExistingTokens(
    adminAddress: string,
    userAddress: string,
    amount: string,
    lockPeriod: number | string
  ): Promise<Transaction> {
    const tx = new Transaction()
    
    const lockPeriodDays = this.convertLockPeriodToDays(lockPeriod)
    console.log('Existing tokens approach - Lock period:', lockPeriod, '->', lockPeriodDays, 'days')
    
    const coinIds = await this.fetchVictoryTokenCoins(adminAddress, amount)
    const primaryCoin = tx.object(coinIds[0])
    
    if (coinIds.length > 1) {
      const otherCoins = coinIds.slice(1).map(id => tx.object(id))
      tx.mergeCoins(primaryCoin, otherCoins)
    }
    
    const [splitCoin] = tx.splitCoins(primaryCoin, [tx.pure.u64(amount)])
    
    tx.moveCall({
      target: `${CONSTANTS.PACKAGE_ID}::victory_token_locker::admin_create_user_lock`,
      arguments: [
        tx.object(CONSTANTS.TOKEN_LOCKER_ID),
        tx.object(CONSTANTS.VAULT_IDS.LOCKER_LOCKED_VAULT_ID),
        splitCoin,
        tx.pure.address(userAddress),
        tx.pure.u64(lockPeriodDays),
        tx.object(CONSTANTS.GLOBAL_EMISSION_CONTROLLER_ID),
        tx.object(CONSTANTS.TOKEN_LOCKER_ADMIN_CAP_ID),
        tx.object(CONSTANTS.CLOCK_ID)
      ]
    })
    
    return tx
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

  // NEW: Protocol timing fetch (event-based)
  static async fetchProtocolTiming(): Promise<TokenLockerConfig['protocolTiming']> {
    try {
      // Query for ProtocolTimingInitialized event
      const protocolEvents = await suiClient.queryEvents({
        query: {
          MoveEventType: `${CONSTANTS.PACKAGE_ID}::victory_token_locker::ProtocolTimingInitialized`
        },
        limit: 1,
        order: 'descending'
      })

      if (protocolEvents.data && protocolEvents.data.length > 0) {
        const event = protocolEvents.data[0]
        const eventData = event.parsedJson as any

        const protocolStart = parseInt(eventData.protocol_start || '0')
        const epochDuration = parseInt(eventData.epoch_duration || '0')
        const currentTime = Date.now() / 1000
        
        // Calculate expected total epochs (156 weeks total)
        const totalEpochs = protocolStart > 0 ? 
          Math.min(156, Math.floor((currentTime - protocolStart) / epochDuration) + 1) : 0

        return {
          protocolStart,
          epochDuration,
          initialized: true,
          totalEpochs
        }
      }

      return {
        protocolStart: 0,
        epochDuration: 0,
        initialized: false,
        totalEpochs: 0
      }
    } catch (error) {
      console.error('Error fetching protocol timing:', error)
      return {
        protocolStart: 0,
        epochDuration: 0,
        initialized: false,
        totalEpochs: 0
      }
    }
  }

  // NEW: Enhanced epoch fetching (event-based with predictable scheduling)
  static async fetchAllEpochsInfo(): Promise<EpochInfo[]> {
    try {
      // Get protocol timing first
      const protocolTiming = await this.fetchProtocolTiming()
      const currentTime = Date.now() / 1000
      
      // Fetch EpochCreated events
      const epochCreatedEvents = await suiClient.queryEvents({
        query: {
          MoveEventType: `${CONSTANTS.PACKAGE_ID}::victory_token_locker::EpochCreated`
        },
        limit: 50,
        order: 'descending'
      })

      // Fetch WeeklyRevenueAdded events
      const revenueEvents = await suiClient.queryEvents({
        query: {
          MoveEventType: `${CONSTANTS.PACKAGE_ID}::victory_token_locker::WeeklyRevenueAdded`
        },
        limit: 100,
        order: 'descending'
      })

      const epochs: EpochInfo[] = []
      const createdEpochIds = new Set<number>()

      // Process created epochs
      if (epochCreatedEvents.data) {
        for (const event of epochCreatedEvents.data) {
          const eventData = event.parsedJson as any
          const epochId = parseInt(eventData.epoch_id || '0')
          createdEpochIds.add(epochId)

          // Find matching revenue event
          const revenueEvent = revenueEvents.data?.find(rev => {
            const revData = rev.parsedJson as any
            return parseInt(revData.epoch_id || '0') === epochId
          })

          const weekStart = parseInt(eventData.week_start || '0')
          const weekEnd = parseInt(eventData.week_end || '0')
          const isCurrentEpoch = currentTime >= weekStart && currentTime <= weekEnd
          const progress = isCurrentEpoch && weekEnd > weekStart ? 
            ((currentTime - weekStart) / (weekEnd - weekStart)) * 100 : 0

          const epochInfo: EpochInfo = {
            epochId,
            weekNumber: parseInt(eventData.week_number || epochId.toString()),
            weekStart,
            weekEnd,
            totalRevenue: revenueEvent ? 
              this.formatSUIAmount((revenueEvent.parsedJson as any).total_week_revenue || '0') : 
              '0 SUI',
            isClaimable: !!revenueEvent,
            allocationsFinalized: !!revenueEvent,
            poolDistribution: revenueEvent ? {
              weekPoolSui: this.formatSUIAmount((revenueEvent.parsedJson as any).week_pool_sui || '0'),
              threeMonthPoolSui: this.formatSUIAmount((revenueEvent.parsedJson as any).three_month_pool_sui || '0'),
              yearPoolSui: this.formatSUIAmount((revenueEvent.parsedJson as any).year_pool_sui || '0'),
              threeYearPoolSui: this.formatSUIAmount((revenueEvent.parsedJson as any).three_year_pool_sui || '0')
            } : {
              weekPoolSui: '0 SUI',
              threeMonthPoolSui: '0 SUI',
              yearPoolSui: '0 SUI',
              threeYearPoolSui: '0 SUI'
            },
            timestamp: this.formatTimestamp(event.timestamp || '0'),
            txDigest: event.id.txDigest,
            admin: (revenueEvent?.parsedJson as any)?.admin || 'system',
            status: revenueEvent ? 'claimable' : 'created',
            isCurrentEpoch,
            progress: Math.round(progress)
          }

          epochs.push(epochInfo)
        }
      }

      // If protocol is initialized, add expected epochs that haven't been created yet
      if (protocolTiming.initialized && protocolTiming.protocolStart > 0) {
        const expectedEpochs = Math.min(156, Math.floor(
          (currentTime - protocolTiming.protocolStart) / protocolTiming.epochDuration
        ) + 1)

        // Add placeholders for epochs that should exist but haven't been created
        for (let i = 1; i <= expectedEpochs; i++) {
          if (!createdEpochIds.has(i)) {
            const epochStart = protocolTiming.protocolStart + ((i - 1) * protocolTiming.epochDuration)
            const epochEnd = epochStart + protocolTiming.epochDuration
            const isCurrentEpoch = currentTime >= epochStart && currentTime <= epochEnd
            const shouldBeCreated = currentTime >= epochStart

            epochs.push({
              epochId: i,
              weekNumber: i,
              weekStart: epochStart,
              weekEnd: epochEnd,
              totalRevenue: '0 SUI',
              isClaimable: false,
              allocationsFinalized: false,
              poolDistribution: {
                weekPoolSui: '0 SUI',
                threeMonthPoolSui: '0 SUI',
                yearPoolSui: '0 SUI',
                threeYearPoolSui: '0 SUI'
              },
              timestamp: shouldBeCreated ? 'Needs Creation' : 'Scheduled',
              status: shouldBeCreated ? 'pending' : 'created',
              admin: 'pending',
              isCurrentEpoch,
              progress: isCurrentEpoch ? Math.round(((currentTime - epochStart) / (epochEnd - epochStart)) * 100) : 0
            })
          }
        }
      }

      // Sort by epoch ID descending (latest first)
      return epochs.sort((a, b) => b.epochId - a.epochId)

    } catch (error) {
      console.error('Error fetching epochs info:', error)
      return []
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

      const [vaultBalances, allocations, poolStats, epochInfo, balanceInfo, protocolTiming] = await Promise.all([
        this.fetchVaultBalances(),
        this.fetchAllocations(),
        this.fetchPoolStatistics(),
        this.fetchCurrentEpochInfo(),
        this.fetchBalanceTracking(),
        this.fetchProtocolTiming()
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
        balanceTracking: balanceInfo,
        protocolTiming
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

  // UPDATED: Enhanced current epoch info (event-based)
  static async fetchCurrentEpochInfo(): Promise<TokenLockerConfig['currentEpoch']> {
    try {
      const protocolTiming = await this.fetchProtocolTiming()
      
      if (!protocolTiming.initialized) {
        return {
          id: 0,
          weekStart: 0,
          weekEnd: 0,
          isClaimable: false,
          allocationsFinalized: false
        }
      }

      const currentTime = Date.now() / 1000
      
      // Calculate which epoch should be current based on time
      const expectedCurrentEpochId = Math.floor(
        (currentTime - protocolTiming.protocolStart) / protocolTiming.epochDuration
      ) + 1

      // Get latest epoch events
      const epochEvents = await suiClient.queryEvents({
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

      // Try to find the current epoch in created events
      let currentEpoch = {
        id: expectedCurrentEpochId,
        weekStart: protocolTiming.protocolStart + ((expectedCurrentEpochId - 1) * protocolTiming.epochDuration),
        weekEnd: protocolTiming.protocolStart + (expectedCurrentEpochId * protocolTiming.epochDuration),
        isClaimable: false,
        allocationsFinalized: false
      }

      if (epochEvents.data) {
        // Look for the current epoch or latest created epoch
        for (const event of epochEvents.data) {
          const eventData = event.parsedJson as any
          const epochId = parseInt(eventData.epoch_id || '0')
          
          if (epochId === expectedCurrentEpochId || 
              (epochId <= expectedCurrentEpochId && epochId > currentEpoch.id)) {
            
            currentEpoch = {
              id: epochId,
              weekStart: parseInt(eventData.week_start || '0'),
              weekEnd: parseInt(eventData.week_end || '0'),
              isClaimable: false,
              allocationsFinalized: false
            }

            // Check if this epoch has revenue
            const hasRevenue = revenueEvents.data?.some(rev => {
              const revData = rev.parsedJson as any
              return parseInt(revData.epoch_id || '0') === epochId
            })

            if (hasRevenue) {
              currentEpoch.isClaimable = true
              currentEpoch.allocationsFinalized = true
            }
            
            break
          }
        }
      }

      return currentEpoch

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
        'PoolSUIClaimed',
        'ProtocolTimingInitialized' // NEW EVENT TYPE
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
      'PoolSUIClaimed': 'Pool SUI Claimed',
      'ProtocolTimingInitialized': 'Protocol Timing Initialized'
    }
    return displayNames[eventType] || eventType
  }

  // System Health Monitoring
  static async fetchSystemHealth(): Promise<SystemHealth> {
    try {
      const config = await this.fetchTokenLockerConfig()
      const vaultBalances = config.vaultBalances

      const issues: string[] = []
      const recommendations: string[] = []

      // Check protocol initialization
      if (!config.protocolTiming.initialized) {
        issues.push('Protocol timing not initialized')
        recommendations.push('Initialize protocol timing to enable epoch management')
      }

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

  static buildInitializeProtocolTimingTransaction(): Transaction {
    const tx = new Transaction()
    
    tx.moveCall({
      target: `${CONSTANTS.PACKAGE_ID}::victory_token_locker::initialize_protocol_timing`,
      arguments: [
        tx.object(CONSTANTS.TOKEN_LOCKER_ID),
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

  // Add weekly SUI revenue (UNCHANGED)
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

  // NEW: Create next epoch in sequence
  static buildCreateNextEpochTransaction(): Transaction {
    const tx = new Transaction()
    tx.moveCall({
      target: `${CONSTANTS.PACKAGE_ID}::victory_token_locker::admin_create_next_epoch`,
      arguments: [
        tx.object(CONSTANTS.TOKEN_LOCKER_ID),
        tx.object(CONSTANTS.TOKEN_LOCKER_ADMIN_CAP_ID),
        tx.object(CONSTANTS.CLOCK_ID)
      ]
    })
    return tx
  }

  // UPDATED: Create single user lock (for presale/admin) - ENHANCED ERROR HANDLING
  static async buildCreateUserLockTransaction(
    adminAddress: string,
    userAddress: string,
    amount: string,
    lockPeriod: number | string
  ): Promise<Transaction> {
    try {
      console.log('=== BUILDING CREATE USER LOCK TRANSACTION ===')
      console.log('Inputs:', { adminAddress, userAddress, amount, lockPeriod })
      
      // Convert and validate lock period first
      const lockPeriodDays = this.convertLockPeriodToDays(lockPeriod)
      console.log('Converted lock period:', lockPeriod, '->', lockPeriodDays)
      
      // Validate inputs
      if (!adminAddress || !userAddress || !amount) {
        throw new Error('Missing required parameters: adminAddress, userAddress, or amount')
      }
      
      if (lockPeriodDays <= 0 || lockPeriodDays > 5000) {
        throw new Error(`Invalid lock period: ${lockPeriodDays} days`)
      }
      
      const balanceCheck = await this.checkAdminVictoryBalance(adminAddress)
      console.log('Balance check result:', balanceCheck)
      
      if (balanceCheck.hasTokens && BigInt(balanceCheck.totalBalance) >= BigInt(amount)) {
        console.log('✅ Using existing Victory tokens from wallet')
        console.log('Calling buildCreateUserLockWithExistingTokens...')
        
        try {
          const result = await this.buildCreateUserLockWithExistingTokens(adminAddress, userAddress, amount, lockPeriodDays)
          console.log('✅ Successfully built transaction with existing tokens')
          return result
        } catch (existingTokensError) {
          console.error('❌ Error using existing tokens:', existingTokensError)
          console.error('Falling back to mint approach...')
          
          // Fallback to mint approach
          console.log('🔄 Falling back to mint approach')
          const mintResult = this.buildMintAndCreateUserLockTransaction(userAddress, amount, lockPeriodDays)
          console.log('✅ Successfully built transaction with mint approach')
          return mintResult
        }
      } else {
        console.log('💰 Using mint approach (insufficient balance or no tokens)')
        const mintResult = this.buildMintAndCreateUserLockTransaction(userAddress, amount, lockPeriodDays)
        console.log('✅ Successfully built transaction with mint approach')
        return mintResult
      }
    } catch (error) {
      console.error('=== TRANSACTION BUILD FAILED ===')
      console.error('Error type:', typeof error)
      console.error('Error message:', error?.message)
      console.error('Error details:', error)
      console.error('Error stack:', error?.stack)
      
      // Re-throw with more context
      const contextualError = new Error(`Failed to build create user lock transaction: ${error?.message || 'Unknown error'}`)
      contextualError.stack = error?.stack
      throw contextualError
    }
  }

  // UPDATED: Batch user lock creation - FIXED VERSION
  static async buildBatchCreateUserLocksTransaction(
    adminAddress: string,
    operations: BatchLockOperation[]
  ): Promise<Transaction> {
    const tx = new Transaction()
    
    try {
      const totalAmount = operations.reduce((sum, op) => sum + BigInt(op.amount), BigInt(0))
      console.log('Building batch transaction for', operations.length, 'operations, total:', totalAmount.toString())
      
      // Convert all lock periods and prepare arrays
      const userAddresses = operations.map(op => op.userAddress)
      const amounts = operations.map(op => op.amount)
      const lockPeriods = operations.map(op => this.convertLockPeriodToDays(op.lockPeriod).toString())
      
      console.log('Converted lock periods:', lockPeriods)
      
      const balanceCheck = await this.checkAdminVictoryBalance(adminAddress)
      
      if (balanceCheck.hasTokens && BigInt(balanceCheck.totalBalance) >= totalAmount) {
        // Use existing tokens
        const coinIds = await this.fetchVictoryTokenCoins(adminAddress, totalAmount.toString())
        const primaryCoin = tx.object(coinIds[0])
        
        if (coinIds.length > 1) {
          const otherCoins = coinIds.slice(1).map(id => tx.object(id))
          tx.mergeCoins(primaryCoin, otherCoins)
        }
        
        const [totalCoin] = tx.splitCoins(primaryCoin, [tx.pure.u64(totalAmount.toString())])
        
        tx.moveCall({
          target: `${CONSTANTS.PACKAGE_ID}::victory_token_locker::admin_batch_create_user_locks`,
          arguments: [
            tx.object(CONSTANTS.TOKEN_LOCKER_ID),
            tx.object(CONSTANTS.VAULT_IDS.LOCKER_LOCKED_VAULT_ID),
            totalCoin,
            tx.pure.vector('address', userAddresses),
            tx.pure.vector('u64', amounts),
            tx.pure.vector('u64', lockPeriods),
            tx.object(CONSTANTS.GLOBAL_EMISSION_CONTROLLER_ID),
            tx.object(CONSTANTS.TOKEN_LOCKER_ADMIN_CAP_ID),
            tx.object(CONSTANTS.CLOCK_ID)
          ]
        })
      } else {
        // Use mint approach
        const [mintedCoins] = tx.moveCall({
          target: `${CONSTANTS.PACKAGE_ID}::victory_token::mint`,
          arguments: [
            tx.object(CONSTANTS.VICTORY_TOKEN.MINTER_CAP_ID),
            tx.pure.u64(totalAmount.toString())
          ]
        })
        
        tx.moveCall({
          target: `${CONSTANTS.PACKAGE_ID}::victory_token_locker::admin_batch_create_user_locks`,
          arguments: [
            tx.object(CONSTANTS.TOKEN_LOCKER_ID),
            tx.object(CONSTANTS.VAULT_IDS.LOCKER_LOCKED_VAULT_ID),
            mintedCoins,
            tx.pure.vector('address', userAddresses),
            tx.pure.vector('u64', amounts),
            tx.pure.vector('u64', lockPeriods),
            tx.object(CONSTANTS.GLOBAL_EMISSION_CONTROLLER_ID),
            tx.object(CONSTANTS.TOKEN_LOCKER_ADMIN_CAP_ID),
            tx.object(CONSTANTS.CLOCK_ID)
          ]
        })
      }
      
      return tx
    } catch (error) {
      console.error('Error building batch transaction:', error)
      throw error
    }
  }

  // Vault creation transactions
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

  // Batch operations validation
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

  // ERROR HANDLING - UPDATED

  static getTokenLockerOperationErrorMessage(error: any): string {
    if (typeof error === 'string') return error
    
    if (error?.message) {
      if (error.message.includes('Invalid u64 value')) {
        return 'Invalid lock period value. Please check the lock period configuration.'
      }
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
      if (error.message.includes('E_PROTOCOL_NOT_INITIALIZED')) {
        return 'Protocol timing not initialized'
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

  // Get lock period options for forms
  static getLockPeriodOptions(): Array<{ value: number; label: string; description: string }> {
    return [
      { value: 7, label: '1 Week', description: 'Short-term lock with 2% Victory allocation' },
      { value: 90, label: '3 Months', description: 'Medium-term lock with 8% Victory allocation' },
      { value: 365, label: '1 Year', description: 'Long-term lock with 25% Victory allocation' },
      { value: 1095, label: '3 Years', description: 'Ultra long-term lock with 65% Victory allocation' }
    ]
  }

  // Get minimum amounts for lock periods
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
      },
      protocolTiming: {
        protocolStart: 0,
        epochDuration: 0,
        initialized: false,
        totalEpochs: 0
      }
    }
  }

  // Get vault health status
  static getVaultHealthStatus(config: TokenLockerConfig): SystemHealth {
    const issues: string[] = []
    const recommendations: string[] = []

    // Check protocol initialization
    if (!config.protocolTiming.initialized) {
      issues.push('Protocol timing not initialized')
      recommendations.push('Initialize protocol timing to enable epoch management')
    }

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
    protocol: {
      initialized: boolean
      totalEpochs: number
      epochDuration: string
    }
  } {
    const now = Date.now() / 1000

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
                          new Date(Date.now() + config.protocolTiming.epochDuration * 1000)

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
      },
      protocol: {
        initialized: config.protocolTiming.initialized,
        totalEpochs: config.protocolTiming.totalEpochs,
        epochDuration: this.formatDuration(config.protocolTiming.epochDuration)
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

  // Comprehensive admin dashboard data
  static async fetchAdminDashboardData(): Promise<{
    config: TokenLockerConfig
    stats: TokenLockerStats
    events: LockerAdminEvent[]
    health: SystemHealth
    timing: ReturnType<typeof TokenLockerService.getEpochTimingInfo>
    epochs: EpochInfo[] // NEW: Include all epochs info
  }> {
    try {
      const [config, stats, events, epochs] = await Promise.all([
        this.fetchTokenLockerConfig(),
        this.fetchTokenLockerStats(),
        this.fetchLockerAdminEvents(),
        this.fetchAllEpochsInfo() // NEW: Fetch all epochs
      ])

      const health = this.getVaultHealthStatus(config)
      const timing = this.getEpochTimingInfo(config)

      return { config, stats, events, health, timing, epochs }
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
        timing: this.getEpochTimingInfo(defaultConfig),
        epochs: []
      }
    }
  }

  // Check if user can perform admin operations
  static canPerformAdminOperation(
    userAddress: string,
    operation: 'allocations' | 'revenue' | 'vaults' | 'locks' | 'epochs'
  ): boolean {
    return userAddress === CONSTANTS.ADMIN
  }

  // Helper function to determine if create next epoch button should be shown
  static shouldShowCreateNextEpoch(dashboardData: any): boolean {
    if (!dashboardData?.timing?.protocol?.initialized) return false
    if (!dashboardData?.epochs) return false
    
    const pendingEpochs = dashboardData.epochs.filter((e: any) => e.status === 'pending')
    return pendingEpochs.length > 0
  }
}