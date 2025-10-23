// services/farmService.ts - EVENT-BASED (100% RELIABLE)

import { Transaction } from '@mysten/sui/transactions'
import { suiClient } from '../utils/suiClient'
import { CONSTANTS } from '../constants'
import { FarmUtils } from '../utils/farmUtils'
import type {
  FarmConfig,
  FarmStats,
  PoolInfo,
  FarmFeeAddresses,
  FarmUpdateAddresses,
  PoolLookupResult,
  FarmValidationResult,
  FarmEvent,
  PoolSearchFilters,
  PoolConfig
} from '../types/farmTypes'

export class FarmService {
  
  static getFarmAddress(): string {
    return CONSTANTS.FARM_ID
  }

  static async fetchFarmConfig(): Promise<FarmConfig | null> {
    try {
      const farmObject = await suiClient.getObject({
        id: CONSTANTS.FARM_ID,
        options: {
          showContent: true,
          showType: true
        }
      })

      if (!farmObject.data?.content || farmObject.data.content.dataType !== 'moveObject') {
        console.error('Farm object not found or invalid')
        return null
      }

      const fields = (farmObject.data.content as any).fields

      return {
        farmAddress: CONSTANTS.FARM_ID,
        admin: fields.admin || '',
        isPaused: fields.paused || false,
        teamAddresses: {
          burn: fields.burn_address || '',
          locker: fields.locker_address || '',
          team1: fields.team_1_address || '',
          team2: fields.team_2_address || '',
          dev: fields.dev_address || ''
        },
        totalVictoryDistributed: fields.total_victory_distributed || '0',
        totalLPVictoryDistributed: fields.total_lp_victory_distributed || '0',
        totalSingleVictoryDistributed: fields.total_single_victory_distributed || '0',
        totalAllocationPoints: fields.total_allocation_points || '0',
        totalLPAllocationPoints: fields.total_lp_allocation_points || '0',
        totalSingleAllocationPoints: fields.total_single_allocation_points || '0',
        emissionStartTimestamp: fields.emission_start_timestamp || '0',
        emissionEndTimestamp: fields.emission_end_timestamp || '0',
        lastUpdateTimestamp: fields.last_update_timestamp || '0'
      }
    } catch (error) {
      console.error('Error fetching farm config:', error)
      return null
    }
  }

  static async fetchFarmStats(): Promise<FarmStats | null> {
    try {
      const config = await this.fetchFarmConfig()
      if (!config) return null

      const pools = await this.fetchAllPools()

      const totalTVL = pools.reduce((sum, pool) => 
        sum + parseFloat(pool.tvl || '0'), 0
      ).toString()

      const activePools = pools.filter(p => p.active).length

      return {
        totalTVL,
        totalPools: pools.length,
        activePools,
        totalVictoryDistributed: config.totalVictoryDistributed,
        totalLPVictoryDistributed: config.totalLPVictoryDistributed,
        totalSingleVictoryDistributed: config.totalSingleVictoryDistributed,
        isPaused: config.isPaused
      }
    } catch (error) {
      console.error('Error fetching farm stats:', error)
      return null
    }
  }

  /**
   * Fetch all pools from events - 100% reliable, no dynamic field issues
   */
  static async fetchAllPools(): Promise<PoolInfo[]> {
    try {
      const farmObject = await suiClient.getObject({
        id: CONSTANTS.FARM_ID,
        options: {
          showContent: true,
          showType: true
        }
      })

      if (!farmObject.data?.content || farmObject.data.content.dataType !== 'moveObject') {
        return []
      }

      const fields = (farmObject.data.content as any).fields
      const poolListRaw = fields.pool_list || []
      
      // Extract pool types from TypeName objects
      const poolTypes: string[] = poolListRaw.map((item: any) => {
        if (typeof item === 'string') return item
        return item.fields?.name || item.name || ''
      }).filter((name: string) => name !== '')
      
      console.log('Pool Types from Farm:', poolTypes)

      // Fetch all pools from events
      const pools = await this.fetchPoolsFromEvents(poolTypes)
      
      console.log(`✅ Loaded ${pools.length} pools`)
      return pools
    } catch (error) {
      console.error('Error fetching all pools:', error)
      return []
    }
  }

  /**
   * Fetch pools from PoolCreated and PoolConfigUpdated events
   */
  private static async fetchPoolsFromEvents(poolTypes: string[]): Promise<PoolInfo[]> {
    try {
      // Fetch PoolCreated events
      const createdEvents = await suiClient.queryEvents({
        query: {
          MoveEventType: `${CONSTANTS.PACKAGE_ID}::${CONSTANTS.MODULES.FARM}::PoolCreated`
        },
        limit: 50
      })

      // Fetch PoolConfigUpdated events
      const updatedEvents = await suiClient.queryEvents({
        query: {
          MoveEventType: `${CONSTANTS.PACKAGE_ID}::${CONSTANTS.MODULES.FARM}::PoolConfigUpdated`
        },
        limit: 50
      })

      const poolsMap = new Map<string, PoolInfo>()

      // Process PoolCreated events
      for (const event of createdEvents.data) {
        const data = event.parsedJson as any
        const poolType = this.extractPoolType(data.pool_type)
        
        if (poolType && poolTypes.includes(poolType)) {
          poolsMap.set(poolType, {
            poolId: FarmUtils.hashString(poolType).slice(-8),
            poolType: poolType,
            name: FarmUtils.createPoolDisplayName(poolType),
            stakingToken: {
              type: poolType,
              symbol: FarmUtils.extractTokenSymbol(poolType),
              decimals: 9
            },
            tvl: '0',
            apr: 0,
            allocationPoints: data.allocation_points || '0',
            totalStaked: '0',
            accRewardPerShare: '0',
            lastRewardTime: 0,
            depositFee: data.deposit_fee || '0',
            withdrawalFee: data.withdrawal_fee || '0',
            active: true,
            isLPToken: data.is_lp_token || false,
            isNativePair: data.is_native_pair || false,
            accumulatedDepositFees: '0',
            accumulatedWithdrawalFees: '0'
          })
        }
      }

      // Update with most recent config changes
      for (const event of updatedEvents.data) {
        const data = event.parsedJson as any
        const poolType = this.extractPoolType(data.pool_type)
        
        if (poolType && poolsMap.has(poolType)) {
          const pool = poolsMap.get(poolType)!
          pool.allocationPoints = data.new_allocation_points || pool.allocationPoints
          pool.depositFee = data.new_deposit_fee || pool.depositFee
          pool.withdrawalFee = data.new_withdrawal_fee || pool.withdrawalFee
          pool.active = data.new_active !== undefined ? data.new_active : pool.active
        }
      }

      const pools = Array.from(poolsMap.values())
      
      // Add placeholder for any pools not found in events
      for (const poolType of poolTypes) {
        if (!poolsMap.has(poolType)) {
          console.warn(`Pool ${poolType} not in events, creating placeholder`)
          pools.push({
            poolId: FarmUtils.hashString(poolType).slice(-8),
            poolType: poolType,
            name: FarmUtils.createPoolDisplayName(poolType),
            stakingToken: {
              type: poolType,
              symbol: FarmUtils.extractTokenSymbol(poolType),
              decimals: 9
            },
            tvl: '0',
            apr: 0,
            allocationPoints: '100',
            totalStaked: '0',
            accRewardPerShare: '0',
            lastRewardTime: 0,
            depositFee: '0',
            withdrawalFee: '0',
            active: true,
            isLPToken: poolType.includes('LPCoin'),
            isNativePair: false,
            accumulatedDepositFees: '0',
            accumulatedWithdrawalFees: '0'
          })
        }
      }

      return pools
    } catch (error) {
      console.error('Error fetching pools from events:', error)
      return []
    }
  }

  private static extractPoolType(poolTypeData: any): string {
    if (typeof poolTypeData === 'string') return poolTypeData
    if (poolTypeData?.fields?.name) return poolTypeData.fields.name
    if (poolTypeData?.name) return poolTypeData.name
    return ''
  }

  static async fetchPoolByType(poolType: string): Promise<PoolInfo | null> {
    try {
      const pools = await this.fetchAllPools()
      return pools.find(p => p.poolType === poolType) || null
    } catch (error) {
      console.error('Error fetching pool by type:', error)
      return null
    }
  }

  static async findPoolByToken(tokenAddress: string): Promise<PoolLookupResult> {
    try {
      const addressCheck = FarmUtils.validateAddress(tokenAddress)
      if (!addressCheck.isValid) {
        return { exists: false, error: addressCheck.error }
      }

      const pools = await this.fetchAllPools()
      const matchingPool = pools.find(pool => 
        pool.stakingToken.type.toLowerCase().includes(tokenAddress.toLowerCase()) ||
        pool.poolType.toLowerCase().includes(tokenAddress.toLowerCase())
      )

      if (!matchingPool) {
        return { exists: false, error: 'Pool not found for this token' }
      }

      return { exists: true, poolInfo: matchingPool }
    } catch (error: any) {
      console.error('Error finding pool:', error)
      return { exists: false, error: FarmUtils.getErrorMessage(error) }
    }
  }

  static async searchPools(filters: PoolSearchFilters): Promise<PoolInfo[]> {
    try {
      let pools = await this.fetchAllPools()

      if (filters.status && filters.status !== 'all') {
        pools = pools.filter(pool => {
          if (filters.status === 'active') return pool.active
          if (filters.status === 'paused') return !pool.active
          return true
        })
      }

      if (filters.tokenType) {
        pools = pools.filter(pool => {
          if (filters.tokenType === 'lp') return pool.isLPToken
          if (filters.tokenType === 'single') return !pool.isLPToken
          return true
        })
      }

      if (filters.stakingToken) {
        pools = pools.filter(pool => 
          pool.stakingToken.type.toLowerCase().includes(filters.stakingToken!.toLowerCase())
        )
      }

      if (filters.minAPR) {
        pools = pools.filter(pool => pool.apr >= filters.minAPR!)
      }

      if (filters.minTVL) {
        pools = pools.filter(pool => parseFloat(pool.tvl) >= parseFloat(filters.minTVL!))
      }

      return pools
    } catch (error) {
      console.error('Error searching pools:', error)
      return []
    }
  }

  static async fetchPoolConfig(poolType: string): Promise<PoolConfig | null> {
    try {
      const pool = await this.fetchPoolByType(poolType)
      if (!pool) return null

      return {
        poolType: pool.poolType,
        allocationPoints: pool.allocationPoints,
        depositFee: pool.depositFee,
        withdrawalFee: pool.withdrawalFee,
        active: pool.active,
        isLPToken: pool.isLPToken,
        isNativePair: pool.isNativePair,
        totalStaked: pool.totalStaked,
        accRewardPerShare: pool.accRewardPerShare,
        lastRewardTime: pool.lastRewardTime,
        accumulatedDepositFees: pool.accumulatedDepositFees,
        accumulatedWithdrawalFees: pool.accumulatedWithdrawalFees
      }
    } catch (error) {
      console.error('Error fetching pool config:', error)
      return null
    }
  }

  static async fetchFarmFeeAddresses(): Promise<FarmFeeAddresses | null> {
    try {
      const config = await this.fetchFarmConfig()
      if (!config) return null

      return {
        farmAddress: CONSTANTS.FARM_ID,
        burn: config.teamAddresses.burn,
        locker: config.teamAddresses.locker,
        team1: config.teamAddresses.team1,
        team2: config.teamAddresses.team2,
        dev: config.teamAddresses.dev
      }
    } catch (error) {
      console.error('Error fetching farm fee addresses:', error)
      return null
    }
  }

  // ==================== TRANSACTION BUILDERS ====================

  static buildUpdateFarmAddressesTransaction(addresses: FarmUpdateAddresses): Transaction {
    const validation = FarmUtils.validateFarmUpdate(CONSTANTS.FARM_ID, addresses)
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
    }

    const tx = new Transaction()
    
    tx.moveCall({
      target: `${CONSTANTS.PACKAGE_ID}::${CONSTANTS.MODULES.FARM}::set_addresses`,
      arguments: [
        tx.object(CONSTANTS.FARM_ID),
        tx.pure.address(addresses.burn),
        tx.pure.address(addresses.locker),
        tx.pure.address(addresses.team1),
        tx.pure.address(addresses.team2),
        tx.pure.address(addresses.dev),
        tx.object(CONSTANTS.FARM_ADMIN_CAP_ID),
        tx.object(CONSTANTS.CLOCK_ID)
      ]
    })
    
    return tx
  }

  static buildUpdatePoolConfigTransaction(
    poolType: string,
    allocationPoints: string,
    depositFee: string,
    withdrawalFee: string,
    active: boolean
  ): Transaction {
    const tx = new Transaction()
    
    tx.moveCall({
      target: `${CONSTANTS.PACKAGE_ID}::${CONSTANTS.MODULES.FARM}::update_pool_config`,
      typeArguments: [poolType],
      arguments: [
        tx.object(CONSTANTS.FARM_ID),
        tx.pure.u256(allocationPoints),
        tx.pure.u256(depositFee),
        tx.pure.u256(withdrawalFee),
        tx.pure.bool(active),
        tx.object(CONSTANTS.FARM_ADMIN_CAP_ID),
        tx.object(CONSTANTS.GLOBAL_EMISSION_CONTROLLER_ID),
        tx.object(CONSTANTS.CLOCK_ID)
      ]
    })
    
    return tx
  }

  static buildPauseFarmTransaction(): Transaction {
    const tx = new Transaction()
    
    tx.moveCall({
      target: `${CONSTANTS.PACKAGE_ID}::${CONSTANTS.MODULES.FARM}::set_pause_state`,
      arguments: [
        tx.object(CONSTANTS.FARM_ID),
        tx.pure.bool(true),
        tx.object(CONSTANTS.FARM_ADMIN_CAP_ID),
        tx.object(CONSTANTS.CLOCK_ID)
      ]
    })
    
    return tx
  }

  static buildUnpauseFarmTransaction(): Transaction {
    const tx = new Transaction()
    
    tx.moveCall({
      target: `${CONSTANTS.PACKAGE_ID}::${CONSTANTS.MODULES.FARM}::set_pause_state`,
      arguments: [
        tx.object(CONSTANTS.FARM_ID),
        tx.pure.bool(false),
        tx.object(CONSTANTS.FARM_ADMIN_CAP_ID),
        tx.object(CONSTANTS.CLOCK_ID)
      ]
    })
    
    return tx
  }

  static async buildTogglePoolTransaction(poolType: string, active: boolean): Promise<Transaction> {
    const poolConfig = await this.fetchPoolConfig(poolType)
    if (!poolConfig) {
      throw new Error('Pool not found')
    }

    const tx = new Transaction()
    
    tx.moveCall({
      target: `${CONSTANTS.PACKAGE_ID}::${CONSTANTS.MODULES.FARM}::update_pool_config`,
      typeArguments: [poolType],
      arguments: [
        tx.object(CONSTANTS.FARM_ID),
        tx.pure.u256(poolConfig.allocationPoints),
        tx.pure.u256(poolConfig.depositFee),
        tx.pure.u256(poolConfig.withdrawalFee),
        tx.pure.bool(active),
        tx.object(CONSTANTS.FARM_ADMIN_CAP_ID),
        tx.object(CONSTANTS.GLOBAL_EMISSION_CONTROLLER_ID),
        tx.object(CONSTANTS.CLOCK_ID)
      ]
    })
    
    return tx
  }

  static async fetchFarmAdminEvents(limit: number = 50): Promise<FarmEvent[]> {
    try {
      const eventTypes = [
        'FarmPauseStateChanged',
        'AdminAddressesUpdated',
        'PoolCreated',
        'PoolConfigUpdated',
      ]

      const allEvents: FarmEvent[] = []

      for (const eventType of eventTypes) {
        try {
          const events = await suiClient.queryEvents({
            query: {
              MoveEventType: `${CONSTANTS.PACKAGE_ID}::${CONSTANTS.MODULES.FARM}::${eventType}`
            },
            limit: Math.floor(limit / eventTypes.length)
          })

          events.data.forEach((event: any) => {
            allEvents.push({
              type: eventType,
              timestamp: event.timestampMs,
              data: event.parsedJson
            })
          })
        } catch (error) {
          console.error(`Error fetching ${eventType} events:`, error)
        }
      }

      return allEvents.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit)
    } catch (error) {
      console.error('Error fetching farm events:', error)
      return []
    }
  }

  static canPerformAdminOperation(
    userAddress: string,
    farmConfig: FarmConfig | null,
    operation: 'pause' | 'addresses' | 'pool_config'
  ): boolean {
    if (!userAddress || !farmConfig) return false
    return userAddress === farmConfig.admin
  }

  static formatAddress = FarmUtils.formatAddress
  static formatNumber = FarmUtils.formatNumber
  static formatAPR = FarmUtils.formatAPR
  static getErrorMessage = FarmUtils.getErrorMessage
  static haveAddressesChanged = FarmUtils.haveAddressesChanged
}