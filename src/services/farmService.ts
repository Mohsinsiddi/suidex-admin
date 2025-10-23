// services/farmService.ts

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

/**
 * Service for farm management operations
 * Single farm with multiple pools architecture
 */
export class FarmService {
  
  // ==================== FARM INFO ====================

  /**
   * Get the main farm object address from constants
   */
  static getFarmAddress(): string {
    return CONSTANTS.FARM_ID
  }

  /**
   * Fetch farm-level configuration and stats
   */
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

  // ==================== POOL LOOKUP ====================

  /**
   * Fetch all pools in the farm
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
      const poolList: string[] = fields.pool_list || []
      
      // Parse pool table
      const pools: PoolInfo[] = []
      if (fields.pools && fields.pools.fields) {
        const poolsTable = fields.pools.fields
        
        for (const poolType of poolList) {
          try {
            // Query the specific pool from the table
            const pool = await this.fetchPoolByType(poolType)
            if (pool) {
              pools.push(pool)
            }
          } catch (error) {
            console.error(`Error fetching pool ${poolType}:`, error)
          }
        }
      }

      return pools
    } catch (error) {
      console.error('Error fetching all pools:', error)
      return []
    }
  }

  /**
   * Fetch a specific pool by its type
   */
  static async fetchPoolByType(poolType: string): Promise<PoolInfo | null> {
    try {
      const farmObject = await suiClient.getObject({
        id: CONSTANTS.FARM_ID,
        options: {
          showContent: true,
          showType: true
        }
      })

      if (!farmObject.data?.content || farmObject.data.content.dataType !== 'moveObject') {
        return null
      }

      const fields = (farmObject.data.content as any).fields
      
      // Access dynamic field for the specific pool
      const poolData = await suiClient.getDynamicFieldObject({
        parentId: fields.pools.fields.id.id,
        name: {
          type: '0x1::type_name::TypeName',
          value: { name: poolType }
        }
      })

      if (!poolData.data?.content || poolData.data.content.dataType !== 'moveObject') {
        return null
      }

      const poolFields = (poolData.data.content as any).fields.value.fields
      
      return this.parsePoolObject(poolType, poolFields)
    } catch (error) {
      console.error('Error fetching pool by type:', error)
      return null
    }
  }

  /**
   * Look up a pool by its staking token address or type
   */
  static async findPoolByToken(tokenAddress: string): Promise<PoolLookupResult> {
    try {
      const addressCheck = FarmUtils.validateAddress(tokenAddress)
      if (!addressCheck.isValid) {
        return {
          exists: false,
          error: addressCheck.error
        }
      }

      // Fetch all pools and search for matching token
      const pools = await this.fetchAllPools()
      const matchingPool = pools.find(pool => 
        pool.stakingToken.type.toLowerCase().includes(tokenAddress.toLowerCase()) ||
        pool.poolType.toLowerCase().includes(tokenAddress.toLowerCase())
      )

      if (!matchingPool) {
        return {
          exists: false,
          error: 'Pool not found for this token'
        }
      }

      return {
        exists: true,
        poolInfo: matchingPool
      }
    } catch (error: any) {
      console.error('Error finding pool:', error)
      return {
        exists: false,
        error: FarmUtils.getErrorMessage(error)
      }
    }
  }

  /**
   * Search pools with filters
   */
  static async searchPools(filters: PoolSearchFilters): Promise<PoolInfo[]> {
    try {
      let pools = await this.fetchAllPools()

      // Apply status filter
      if (filters.status && filters.status !== 'all') {
        pools = pools.filter(pool => {
          if (filters.status === 'active') return pool.active
          if (filters.status === 'paused') return !pool.active
          return true
        })
      }

      // Apply token type filter (LP vs Single)
      if (filters.tokenType) {
        pools = pools.filter(pool => {
          if (filters.tokenType === 'lp') return pool.isLPToken
          if (filters.tokenType === 'single') return !pool.isLPToken
          return true
        })
      }

      // Apply staking token filter
      if (filters.stakingToken) {
        pools = pools.filter(pool => 
          pool.stakingToken.type.toLowerCase().includes(filters.stakingToken!.toLowerCase())
        )
      }

      // Apply minimum APR filter
      if (filters.minAPR) {
        pools = pools.filter(pool => pool.apr >= filters.minAPR!)
      }

      // Apply minimum TVL filter
      if (filters.minTVL) {
        pools = pools.filter(pool => parseFloat(pool.tvl) >= parseFloat(filters.minTVL!))
      }

      return pools
    } catch (error) {
      console.error('Error searching pools:', error)
      return []
    }
  }

  // ==================== POOL CONFIGURATION ====================

  /**
   * Fetch specific pool configuration
   */
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

  /**
   * Fetch farm-wide statistics
   */
  static async fetchFarmStats(): Promise<FarmStats | null> {
    try {
      const pools = await this.fetchAllPools()
      const farmConfig = await this.fetchFarmConfig()
      
      if (!farmConfig) return null

      const activePools = pools.filter(p => p.active)
      const pausedPools = pools.filter(p => !p.active)

      // Calculate total TVL
      const totalTVL = pools.reduce((sum, pool) => {
        return sum + parseFloat(pool.tvl || '0')
      }, 0)

      // Calculate average APR
      const avgAPR = pools.length > 0
        ? pools.reduce((sum, pool) => sum + pool.apr, 0) / pools.length
        : 0

      // Count LP and Single staking pools
      const lpPools = pools.filter(p => p.isLPToken).length
      const singlePools = pools.filter(p => !p.isLPToken).length

      return {
        totalPools: pools.length,
        activePools: activePools.length,
        pausedPools: pausedPools.length,
        lpPools,
        singlePools,
        totalValueLocked: totalTVL.toString(),
        totalVictoryDistributed: farmConfig.totalVictoryDistributed,
        totalLPVictoryDistributed: farmConfig.totalLPVictoryDistributed,
        totalSingleVictoryDistributed: farmConfig.totalSingleVictoryDistributed,
        averageAPR: avgAPR,
        farmPaused: farmConfig.isPaused
      }
    } catch (error) {
      console.error('Error fetching farm stats:', error)
      return null
    }
  }

  // ==================== FEE ADDRESSES ====================

  /**
   * Fetch current fee addresses for the farm
   */
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

  /**
   * Build transaction to update farm admin addresses
   */
  static buildUpdateFarmAddressesTransaction(
    addresses: FarmUpdateAddresses
  ): Transaction {
    const validation = FarmUtils.validateFarmUpdate(CONSTANTS.FARM_ID, addresses)
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
    }

    const tx = new Transaction()
    
    tx.moveCall({
      target: `${CONSTANTS.PACKAGE_ID}::${CONSTANTS.MODULES.FARM}::update_admin_addresses`,
      arguments: [
        tx.object(CONSTANTS.FARM_ID),
        tx.object(CONSTANTS.FARM_ADMIN_CAP_ID), // Admin capability
        tx.pure.address(addresses.burn),
        tx.pure.address(addresses.locker),
        tx.pure.address(addresses.team1),
        tx.pure.address(addresses.team2),
        tx.pure.address(addresses.dev)
      ]
    })
    
    return tx
  }

  /**
   * Build transaction to update pool configuration
   */
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
        tx.object(CONSTANTS.FARM_ADMIN_CAP_ID),
        tx.pure.u256(allocationPoints),
        tx.pure.u256(depositFee),
        tx.pure.u256(withdrawalFee),
        tx.pure.bool(active)
      ]
    })
    
    return tx
  }

  /**
   * Build transaction to pause farm (affects all pools)
   */
  static buildPauseFarmTransaction(): Transaction {
    const tx = new Transaction()
    
    tx.moveCall({
      target: `${CONSTANTS.PACKAGE_ID}::${CONSTANTS.MODULES.FARM}::pause_farm`,
      arguments: [
        tx.object(CONSTANTS.FARM_ID),
        tx.object(CONSTANTS.FARM_ADMIN_CAP_ID)
      ]
    })
    
    return tx
  }

  /**
   * Build transaction to unpause farm
   */
  static buildUnpauseFarmTransaction(): Transaction {
    const tx = new Transaction()
    
    tx.moveCall({
      target: `${CONSTANTS.PACKAGE_ID}::${CONSTANTS.MODULES.FARM}::unpause_farm`,
      arguments: [
        tx.object(CONSTANTS.FARM_ID),
        tx.object(CONSTANTS.FARM_ADMIN_CAP_ID)
      ]
    })
    
    return tx
  }

  /**
   * Build transaction to activate/deactivate a specific pool
   */
  static buildTogglePoolTransaction(poolType: string, active: boolean): Transaction {
    const tx = new Transaction()
    
    tx.moveCall({
      target: `${CONSTANTS.PACKAGE_ID}::${CONSTANTS.MODULES.FARM}::set_pool_active`,
      typeArguments: [poolType],
      arguments: [
        tx.object(CONSTANTS.FARM_ID),
        tx.object(CONSTANTS.FARM_ADMIN_CAP_ID),
        tx.pure.bool(active)
      ]
    })
    
    return tx
  }

  /**
   * Build transaction to create a new pool
   */
  static buildCreatePoolTransaction(
    poolType: string,
    allocationPoints: string,
    depositFee: string,
    withdrawalFee: string,
    isNativePair: boolean,
    isLPToken: boolean
  ): Transaction {
    const tx = new Transaction()
    
    tx.moveCall({
      target: `${CONSTANTS.PACKAGE_ID}::${CONSTANTS.MODULES.FARM}::create_pool`,
      typeArguments: [poolType],
      arguments: [
        tx.object(CONSTANTS.FARM_ID),
        tx.object(CONSTANTS.FARM_ADMIN_CAP_ID),
        tx.pure.u256(allocationPoints),
        tx.pure.u256(depositFee),
        tx.pure.u256(withdrawalFee),
        tx.pure.bool(isNativePair),
        tx.pure.bool(isLPToken)
      ]
    })
    
    return tx
  }

  // ==================== EVENTS ====================

  /**
   * Fetch farm admin events
   */
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

          // Parse and add events
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

      // Sort by timestamp descending
      return allEvents.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit)
    } catch (error) {
      console.error('Error fetching farm events:', error)
      return []
    }
  }

  // ==================== VALIDATION ====================

  /**
   * Check if user can perform admin operation
   */
  static canPerformAdminOperation(
    userAddress: string,
    farmConfig: FarmConfig | null,
    operation: 'pause' | 'addresses' | 'pool_config'
  ): boolean {
    if (!userAddress || !farmConfig) return false
    
    // Check if user is the farm admin
    return userAddress === farmConfig.admin
  }

  // ==================== HELPERS ====================

  /**
   * Parse pool object fields into PoolInfo
   */
  private static parsePoolObject(poolType: string, fields: any): PoolInfo {
    const stakingType = fields.pool_type?.fields?.name || poolType
    
    return {
      poolId: FarmUtils.hashString(poolType).slice(-8),
      poolType: stakingType,
      name: FarmUtils.createPoolDisplayName(stakingType),
      stakingToken: {
        type: stakingType,
        symbol: FarmUtils.extractTokenSymbol(stakingType),
        decimals: 9
      },
      tvl: fields.total_staked || '0',
      apr: 0, // TODO: Calculate APR with price data
      allocationPoints: fields.allocation_points || '0',
      totalStaked: fields.total_staked || '0',
      accRewardPerShare: fields.acc_reward_per_share || '0',
      lastRewardTime: parseInt(fields.last_reward_time || '0'),
      depositFee: fields.deposit_fee || '0',
      withdrawalFee: fields.withdrawal_fee || '0',
      active: fields.active || false,
      isLPToken: fields.is_lp_token || false,
      isNativePair: fields.is_native_pair || false,
      accumulatedDepositFees: fields.accumulated_deposit_fees || '0',
      accumulatedWithdrawalFees: fields.accumulated_withdrawal_fees || '0'
    }
  }

  /**
   * Format address (re-export from utils)
   */
  static formatAddress = FarmUtils.formatAddress

  /**
   * Format number (re-export from utils)
   */
  static formatNumber = FarmUtils.formatNumber

  /**
   * Format APR (re-export from utils)
   */
  static formatAPR = FarmUtils.formatAPR

  /**
   * Get error message (re-export from utils)
   */
  static getErrorMessage = FarmUtils.getErrorMessage

  /**
   * Check if addresses changed (re-export from utils)
   */
  static haveAddressesChanged = FarmUtils.haveAddressesChanged
}