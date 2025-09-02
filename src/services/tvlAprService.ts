// Complete Fixed TVL Service with Enhanced APR Calculations and Comprehensive Logging
import { suiClient } from '../utils/suiClient'
import { CONSTANTS } from '../constants'
import { EventBasedPoolService } from './eventBasedPoolService'
import { TokenLockerService } from './tokenLockerService'
import { Transaction } from '@mysten/sui/transactions'
import { EmissionService } from './emissionService'
import { getCurrentEmissionRates } from '../utils/emissionUtils'
import { calculateTokenomicsSnapshot } from '../utils/tokenomicsCalculator'

// ================================
// TYPES & INTERFACES (Same as before)
// ================================

interface APRBreakdown {
  baseAPR: number
  bonusAPR: number  
  totalAPR: number
  victoryRewardsPerSecond: number
  victoryRewardsPerDay: number
  victoryRewardsAnnual: number
  dailyRewardsUSD: number
  annualRewardsUSD: number
  rewardTokens: string[]
  emissionWeek: number
  poolShare: number
}

interface LockPeriodData {
  lockPeriod: number // days
  lockPeriodName: string
  victoryAllocationBP: number // basis points (out of 10000)
  suiAllocationBP: number // basis points (out of 10000)
}

const VICTORY_LOCK_PERIODS: LockPeriodData[] = [
  {
    lockPeriod: 7,
    lockPeriodName: 'Week Lock',
    victoryAllocationBP: 200,    // 2%
    suiAllocationBP: 1000        // 10%
  },
  {
    lockPeriod: 90,
    lockPeriodName: '3-Month Lock', 
    victoryAllocationBP: 800,    // 8%
    suiAllocationBP: 2000        // 20%
  },
  {
    lockPeriod: 365,
    lockPeriodName: 'Year Lock',
    victoryAllocationBP: 2500,   // 25%
    suiAllocationBP: 3000        // 30%
  },
  {
    lockPeriod: 1095,
    lockPeriodName: '3-Year Lock',
    victoryAllocationBP: 6500,   // 65%
    suiAllocationBP: 4000        // 40%
  }
]

interface TokenPrice {
  symbol: string
  tokenType: string
  usdPrice: number
  source: 'DEX' | 'COINGECKO' | 'HARDCODED'
  lastUpdated: number
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
}

interface LPTokenInfo {
  pairAddress: string
  token0: string
  token0Symbol: string
  token1: string
  token1Symbol: string
  reserve0: string
  reserve1: string
  totalSupply: string
  lpTokenPrice: number
  token0Price: number
  token1Price: number
  lastUpdated: number
}

export interface PoolTVLData {
  poolId: string
  poolName: string
  poolType: 'LP' | 'Single'
  tokenType: string
  totalStaked: string
  totalStakedFormatted: number
  tokenPrice: number
  tvlUSD: number
  apr: number
  allocationPoints: number
  isActive: boolean
  priceSource: string
  lastUpdated: number
  aprBreakdown?: APRBreakdown
}

export interface LockerTVLData {
  lockPeriod: number
  lockPeriodName: string
  totalLocked: string
  totalLockedFormatted: number
  victoryPrice: number
  tvlUSD: number
  estimatedAPR: number
  allocationPercentage: number
  aprBreakdown?: APRBreakdown
}

export interface SystemTVL {
  farmTVL: {
    lpPools: PoolTVLData[]
    singlePools: PoolTVLData[]
    totalLPTVL: number
    totalSingleTVL: number
    totalFarmTVL: number
  }
  lockerTVL: {
    pools: LockerTVLData[]
    totalLockerTVL: number
    suiRewardsPool: number
    victoryRewardsPool: number
  }
  systemTVL: {
    totalTVL: number
    farmPercentage: number
    lockerPercentage: number
  }
  metadata: {
    lastUpdated: number
    updateDuration: number
    pricesUpdated: number
    poolsProcessed: number
    errors: string[]
    warnings: string[]
  }
}

interface FarmPoolInfo {
  poolId: string
  poolName: string
  poolType: 'LP' | 'Single'
  tokenType: string
  totalStaked: string
  allocationPoints: number
  isActive: boolean
  pairId?: string
}

// ================================
// EXTERNAL UTILITY FUNCTIONS
// ================================

function parseBlockchainValue(value: any): any {
  try {
    if (Array.isArray(value) && value.length === 2 && typeof value[1] === 'string') {
      const [dataArray, typeStr] = value

      if (typeStr.startsWith('u') && Array.isArray(dataArray)) {
        return parseU256ByteArray(dataArray)
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

function parseU256ByteArray(byteArray: number[]): bigint {
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

// ================================
// COMPLETE TVL SERVICE CLASS
// ================================

export class TVLAPRService {
  private static priceCache = new Map<string, TokenPrice>()
  private static lpInfoCache = new Map<string, LPTokenInfo>()
  private static cacheExpiry = 5 * 60 * 1000 // 5 minutes
  private static currentAccount: { address: string } | null = null
  
  // Enhanced logging with pool staking details
  private static logger = {
    info: (msg: string, data?: any) => console.log(`[TVL-APR] ${msg}`, data || ''),
    error: (msg: string, error?: any) => console.error(`[TVL-APR ERROR] ${msg}`, error || ''),
    warn: (msg: string, data?: any) => console.warn(`[TVL-APR WARN] ${msg}`, data || ''),
    debug: (msg: string, data?: any) => {
      if (msg.includes('CRITICAL') || msg.includes('SUCCESS') || msg.includes('TVL') || msg.includes('STAKED') || msg.includes('APR')) {
        console.debug(`[TVL-APR DEBUG] ${msg}`, data || '')
      }
    },
    // New: Pool-specific logging
    pool: (poolName: string, msg: string, data?: any) => console.log(`[POOL-${poolName}] ${msg}`, data || ''),
    staking: (poolName: string, amount: string, formattedAmount: number, tvlUSD: number) => {
      console.log(`[STAKING-INFO] ${poolName}:`, {
        rawStaked: amount,
        formattedStaked: formattedAmount.toLocaleString(),
        tvlUSD: `$${tvlUSD.toLocaleString()}`,
        hasStake: formattedAmount > 0
      })
    }
  }

  // ================================
  // MAIN ENTRY POINTS - FIXED TO USE ENHANCED METHODS
  // ================================

  static async getSystemTVLWithAccount(account: { address: string }): Promise<SystemTVL> {
    this.currentAccount = account
    return await this.getSystemTVL()
  }

  /**
   * ✅ FIXED: Main system TVL calculation now uses enhanced methods
   */
  static async getSystemTVL(): Promise<SystemTVL> {
    const startTime = Date.now()
    this.logger.info('🚀 Starting ENHANCED system TVL calculation with real APR calculations')

    const errors: string[] = []
    const warnings: string[] = []
    let pricesUpdated = 0
    let poolsProcessed = 0

    try {
      // Step 1: Check emission system availability
      this.logger.info('🔍 Checking emission system availability...')
      const emissionCheck = await this.debugAPRCalculation()
      if (!emissionCheck.emissionDataAvailable) {
        warnings.push('Emission system not available - APRs may be inaccurate')
        this.logger.warn('⚠️ Emission system check failed:', emissionCheck.errors)
      } else {
        this.logger.info('✅ Emission system available:', {
          currentWeek: emissionCheck.currentWeek,
          victoryPrice: emissionCheck.victoryPrice,
          lpEmissionRate: emissionCheck.emissionRates?.lpPerSecond || 'N/A',
          singleEmissionRate: emissionCheck.emissionRates?.singlePerSecond || 'N/A'
        })
      }

      // Step 2: Discover farm pools
      this.logger.info('🔍 Discovering farm pools...')
      const farmPools = await this.discoverFarmPoolsFixed()
      this.logger.info(`📊 Discovered ${farmPools.length} farm pools`)

      if (farmPools.length === 0) {
        warnings.push('No active farm pools found')
      }

      // Step 3: Update prices
      this.logger.info('💰 Updating token prices...')
      pricesUpdated = await TVLAPRService.updatePricesForFarmPools(farmPools)
      this.logger.info(`✅ Updated ${pricesUpdated} token prices`)

      // Step 4: ✅ FIXED: Use enhanced farm TVL calculation
      this.logger.info('📈 Calculating farm TVL with ENHANCED APR calculations...')
      const farmTVL = await TVLAPRService.calculateFarmTVLFromPoolsEnhanced(farmPools)
      poolsProcessed = farmPools.length

      // Step 5: ✅ FIXED: Use enhanced locker TVL calculation  
      this.logger.info('🔒 Calculating locker TVL with ENHANCED multi-period APRs...')
      const lockerTVL = await TVLAPRService.calculateLockerTVLEnhanced()

      // Step 6: Calculate system totals
      const totalTVL = farmTVL.totalFarmTVL + lockerTVL.totalLockerTVL
      const farmPercentage = totalTVL > 0 ? (farmTVL.totalFarmTVL / totalTVL) * 100 : 0
      const lockerPercentage = totalTVL > 0 ? (lockerTVL.totalLockerTVL / totalTVL) * 100 : 0

      const result: SystemTVL = {
        farmTVL,
        lockerTVL,
        systemTVL: {
          totalTVL,
          farmPercentage,
          lockerPercentage
        },
        metadata: {
          lastUpdated: Date.now(),
          updateDuration: Date.now() - startTime,
          pricesUpdated,
          poolsProcessed,
          errors,
          warnings
        }
      }

      // ✅ Enhanced final logging with APR breakdown
      this.logger.info(`🎉 ENHANCED System TVL calculation completed in ${Date.now() - startTime}ms`)
      this.logger.info('📊 FINAL SYSTEM SUMMARY:', {
        totalTVL: `$${totalTVL.toLocaleString()}`,
        farmTVL: `$${farmTVL.totalFarmTVL.toLocaleString()} (${farmPercentage.toFixed(1)}%)`,
        lockerTVL: `$${lockerTVL.totalLockerTVL.toLocaleString()} (${lockerPercentage.toFixed(1)}%)`,
        poolsProcessed,
        avgFarmAPR: farmTVL.lpPools.length + farmTVL.singlePools.length > 0 
          ? `${([...farmTVL.lpPools, ...farmTVL.singlePools].reduce((sum, p) => sum + p.apr, 0) / 
              (farmTVL.lpPools.length + farmTVL.singlePools.length)).toFixed(1)}%`
          : '0%',
        errors: errors.length,
        warnings: warnings.length
      })

      return result

    } catch (error) {
      this.logger.error('💥 CRITICAL: Enhanced system TVL calculation failed', error)
      throw error
    }
  }

  // ================================
  // ✅ ENHANCED FARM POOL DISCOVERY WITH DETAILED STAKING LOGS
  // ================================

  static async discoverFarmPoolsFixed(): Promise<FarmPoolInfo[]> {
    try {
      this.logger.info('🔍 Using event-based pool discovery with enhanced staking logging')

      const { pools } = await EventBasedPoolService.getAllPools()
      this.logger.info(`📋 Found ${pools.length} pools from events`)
      
      const farmPools: FarmPoolInfo[] = []
      const poolErrors: Array<{pool: string, error: string}> = []
      
      const senderAddress = this.currentAccount?.address || 
        '0x0000000000000000000000000000000000000000000000000000000000000000'
      
      for (const [index, pool] of pools.entries()) {
        try {
          this.logger.pool(pool.name, `Processing pool ${index + 1}/${pools.length} (${pool.type})`)
          
          const poolInfo = await this.getFarmPoolInfoWorking(pool.typeName, senderAddress)
          
          if (poolInfo && poolInfo.totalStakedBigInt !== undefined) {
            const totalStaked = poolInfo.totalStakedBigInt.toString()
            const totalStakedFormatted = parseFloat(totalStaked) / Math.pow(10, 9)
            
            // ✅ Enhanced staking logging
            this.logger.staking(
              pool.name, 
              totalStaked, 
              totalStakedFormatted,
              0 // TVL calculated later
            )
            
            farmPools.push({
              poolId: pool.id,
              poolName: pool.name,
              poolType: pool.type as 'LP' | 'Single',
              tokenType: pool.typeName,
              totalStaked: totalStaked,
              allocationPoints: pool.allocationPoints,
              isActive: poolInfo.active !== false,
              pairId: pool.type === 'LP' ? await this.findPairIdWorking(pool.typeName, senderAddress) : undefined
            })
            
            this.logger.pool(pool.name, '✅ Successfully processed', {
              type: pool.type,
              totalStaked: `${totalStakedFormatted.toLocaleString()} tokens`,
              allocationPoints: pool.allocationPoints,
              active: poolInfo.active,
              hasStake: poolInfo.totalStakedBigInt > 0n
            })
          } else {
            this.logger.pool(pool.name, '❌ Failed to get pool info')
            poolErrors.push({pool: pool.name, error: 'Failed to get pool info'})
          }
        } catch (error) {
          this.logger.pool(pool.name, '💥 Error processing pool:', error)
          poolErrors.push({pool: pool.name, error: String(error)})
        }
      }

      // Enhanced summary with staking details
      const totalStakedPools = farmPools.filter(p => BigInt(p.totalStaked) > 0n)
      const lpPoolsWithStake = farmPools.filter(p => p.poolType === 'LP' && BigInt(p.totalStaked) > 0n)
      const singlePoolsWithStake = farmPools.filter(p => p.poolType === 'Single' && BigInt(p.totalStaked) > 0n)

      this.logger.info(`📊 ENHANCED Pool Discovery Summary:`, {
        totalFound: pools.length,
        successfullyProcessed: farmPools.length,
        errors: poolErrors.length,
        lpPools: farmPools.filter(p => p.poolType === 'LP').length,
        singlePools: farmPools.filter(p => p.poolType === 'Single').length,
        poolsWithStake: totalStakedPools.length,
        lpPoolsWithStake: lpPoolsWithStake.length,
        singlePoolsWithStake: singlePoolsWithStake.length,
        emptyPools: farmPools.length - totalStakedPools.length
      })

      if (poolErrors.length > 0) {
        this.logger.warn(`⚠️ Pool processing errors:`)
        poolErrors.forEach(({pool, error}) => {
          this.logger.warn(`  - ${pool}: ${error}`)
        })
      }

      return farmPools

    } catch (error) {
      this.logger.error('💥 CRITICAL: Farm pool discovery failed', error)
      return []
    }
  }

  // ================================
  // ✅ EMISSION-BASED APR CALCULATIONS 
  // ================================

  /**
   * Get current emission data for APR calculations
   */
  static async getCurrentEmissionData(): Promise<{
    currentWeek: number
    emissionRates: any
    victoryPriceUSD: number
  } | null> {
    try {
      // Get emission start time and current time
      const emissionConfig = await EmissionService.fetchEmissionConfig()
      const currentTimestamp = Math.floor(Date.now() / 1000)
      
      if (emissionConfig.emissionStartTimestamp === 0) {
        this.logger.warn('⚠️ Emissions not started yet')
        return null
      }

      // Calculate current week using tokenomics
      const tokenomicsSnapshot = calculateTokenomicsSnapshot(
        emissionConfig.emissionStartTimestamp, 
        currentTimestamp
      )
      
      const currentWeek = tokenomicsSnapshot.currentWeek
      if (currentWeek === 0) {
        this.logger.warn('⚠️ Current week is 0, emissions may not be active')
        return null
      }

      // Get emission rates for this week
      const emissionRates = getCurrentEmissionRates(currentWeek)
      
      // Get Victory price
      const victoryPrice = await this.getTokenPrice('VICTORY', CONSTANTS.VICTORY_TOKEN.TYPE)
      
      this.logger.debug('✅ Current emission data retrieved:', {
        currentWeek,
        emissionRates: {
          lpPerSecond: emissionRates.lpPerSecond,
          singlePerSecond: emissionRates.singlePerSecond,
          victoryStakingPerSecond: emissionRates.victoryStakingPerSecond
        },
        victoryPriceUSD: victoryPrice.usdPrice
      })

      return {
        currentWeek,
        emissionRates,
        victoryPriceUSD: victoryPrice.usdPrice
      }

    } catch (error) {
      this.logger.error('❌ Error getting current emission data:', error)
      return null
    }
  }

  /**
   * Get total allocation points for a pool type
   */
  static async getTotalAllocationPoints(poolType: 'LP' | 'Single'): Promise<number> {
    try {
      const { pools: allPools } = await EventBasedPoolService.getAllPools()
      const poolsOfType = allPools.filter(p => p.type === poolType && p.isActive)
      const totalAllocPoints = poolsOfType.reduce((sum, p) => sum + p.allocationPoints, 0)
      
      this.logger.debug(`📊 Total ${poolType} allocation points: ${totalAllocPoints}`)
      return totalAllocPoints
      
    } catch (error) {
      this.logger.error(`❌ Error getting total ${poolType} allocation points:`, error)
      return 1 // Fallback to prevent division by zero
    }
  }

  /**
   * ✅ CORE: Calculate accurate pool APR using emission data
   */
  static async calculatePoolAPRFromEmissions(
    poolInfo: FarmPoolInfo,
    tvlUSD: number
  ): Promise<APRBreakdown> {
    this.logger.debug(`🔢 Calculating APR for ${poolInfo.poolName}`, {
      poolType: poolInfo.poolType,
      allocationPoints: poolInfo.allocationPoints,
      tvlUSD: `$${tvlUSD.toLocaleString()}`,
      isActive: poolInfo.isActive
    })

    try {
      if (tvlUSD <= 0 || !poolInfo.isActive) {
        this.logger.warn(`⚠️ ${poolInfo.poolName}: Zero TVL or inactive - returning 0% APR`)
        return {
          baseAPR: 0, bonusAPR: 0, totalAPR: 0,
          victoryRewardsPerSecond: 0, victoryRewardsPerDay: 0, victoryRewardsAnnual: 0,
          dailyRewardsUSD: 0, annualRewardsUSD: 0,
          rewardTokens: ['VICTORY'], emissionWeek: 0, poolShare: 0
        }
      }

      // 1. Get current emission data
      const emissionData = await this.getCurrentEmissionData()
      if (!emissionData) {
        this.logger.warn(`⚠️ ${poolInfo.poolName}: No emission data available - using fallback APR calculation`)
        
        // Fallback to simple calculation when emissions not available
        const fallbackAPR = this.calculateFallbackAPR(poolInfo.allocationPoints, tvlUSD)
        return {
          baseAPR: fallbackAPR, bonusAPR: 0, totalAPR: fallbackAPR,
          victoryRewardsPerSecond: 0, victoryRewardsPerDay: 0, victoryRewardsAnnual: 0,
          dailyRewardsUSD: 0, annualRewardsUSD: 0,
          rewardTokens: ['VICTORY'], emissionWeek: 0, poolShare: 0
        }
      }

      const { currentWeek, emissionRates, victoryPriceUSD } = emissionData

      // 2. Get pool type emission rate and total allocation
      let poolTypeEmissionPerSecond: number
      let totalAllocPoints: number

      if (poolInfo.poolType === 'LP') {
        poolTypeEmissionPerSecond = parseFloat(emissionRates.lpPerSecond)
        totalAllocPoints = await this.getTotalAllocationPoints('LP')
      } else {
        poolTypeEmissionPerSecond = parseFloat(emissionRates.singlePerSecond)
        totalAllocPoints = await this.getTotalAllocationPoints('Single')
      }

      // 3. Calculate this pool's share
      const poolShare = totalAllocPoints > 0 ? poolInfo.allocationPoints / totalAllocPoints : 0
      const poolVictoryPerSecond = poolTypeEmissionPerSecond * poolShare

      // 4. Calculate time-based rewards
      const victoryRewardsPerDay = poolVictoryPerSecond * 86400 // seconds per day
      const victoryRewardsAnnual = victoryRewardsPerDay * 365

      const dailyRewardsUSD = victoryRewardsPerDay * victoryPriceUSD
      const annualRewardsUSD = victoryRewardsAnnual * victoryPriceUSD

      // 5. Calculate base APR
      const baseAPR = (annualRewardsUSD / tvlUSD) * 100

      // 6. Calculate bonus APR (early phase bonus)
      let bonusAPR = 0
      if (currentWeek <= 4) {
        bonusAPR = baseAPR * 0.15 // 15% bonus during bootstrap phase
      } else if (currentWeek <= 12) {
        bonusAPR = baseAPR * 0.05 // 5% bonus during early post-bootstrap
      }

      const totalAPR = baseAPR + bonusAPR

      const aprBreakdown: APRBreakdown = {
        baseAPR,
        bonusAPR,
        totalAPR,
        victoryRewardsPerSecond: poolVictoryPerSecond,
        victoryRewardsPerDay,
        victoryRewardsAnnual,
        dailyRewardsUSD,
        annualRewardsUSD,
        rewardTokens: ['VICTORY'],
        emissionWeek: currentWeek,
        poolShare
      }

      this.logger.info(`📈 APR calculated for ${poolInfo.poolName}:`, {
        poolType: poolInfo.poolType,
        allocationPoints: poolInfo.allocationPoints,
        totalAllocPoints,
        poolShare: `${(poolShare * 100).toFixed(2)}%`,
        victoryPerSecond: poolVictoryPerSecond.toFixed(6),
        dailyVictoryRewards: victoryRewardsPerDay.toFixed(2),
        victoryPrice: `$${victoryPriceUSD}`,
        tvlUSD: `$${tvlUSD.toLocaleString()}`,
        baseAPR: `${baseAPR.toFixed(2)}%`,
        bonusAPR: `+${bonusAPR.toFixed(2)}%`,
        totalAPR: `${totalAPR.toFixed(2)}%`,
        emissionWeek: currentWeek
      })

      return aprBreakdown

    } catch (error) {
      this.logger.error(`❌ Error calculating APR for ${poolInfo.poolName}:`, error)
      
      // Return fallback APR on error
      const fallbackAPR = this.calculateFallbackAPR(poolInfo.allocationPoints, tvlUSD)
      return {
        baseAPR: fallbackAPR, bonusAPR: 0, totalAPR: fallbackAPR,
        victoryRewardsPerSecond: 0, victoryRewardsPerDay: 0, victoryRewardsAnnual: 0,
        dailyRewardsUSD: 0, annualRewardsUSD: 0,
        rewardTokens: ['VICTORY'], emissionWeek: 0, poolShare: 0
      }
    }
  }

  /**
   * Fallback APR calculation when emissions not available
   */
  static calculateFallbackAPR(allocationPoints: number, tvlUSD: number): number {
    if (tvlUSD === 0) return 0
    
    // More reasonable fallback calculation
    const baseAPR = 25 // 25% base APR
    const allocationMultiplier = Math.max(allocationPoints / 1000, 0.1)
    const calculatedAPR = baseAPR * allocationMultiplier
    
    this.logger.warn(`⚠️ Using fallback APR calculation: ${calculatedAPR.toFixed(2)}% (allocation: ${allocationPoints}, multiplier: ${allocationMultiplier.toFixed(2)})`)
    
    return Math.min(calculatedAPR, 300) // Cap at 300%
  }

  // ================================
  // ✅ ENHANCED FARM TVL CALCULATIONS
  // ================================

  /**
   * ✅ Enhanced farm TVL calculation with real APRs and detailed logging
   */
  static async calculateFarmTVLFromPoolsEnhanced(farmPools: FarmPoolInfo[]): Promise<SystemTVL['farmTVL']> {
    this.logger.info('📈 Starting ENHANCED farm TVL calculation with emission-based APRs')
    
    const lpPools: PoolTVLData[] = []
    const singlePools: PoolTVLData[] = []

    for (const pool of farmPools) {
      try {
        if (pool.poolType === 'LP') {
          const lpTVL = await this.calculateLPPoolTVLEnhanced(pool)
          if (lpTVL) {
            lpPools.push(lpTVL)
            this.logger.info(`📊 Enhanced LP Pool: ${pool.poolName}`, {
              tvl: `$${lpTVL.tvlUSD.toLocaleString()}`,
              apr: `${lpTVL.apr.toFixed(2)}%`,
              staked: `${lpTVL.totalStakedFormatted.toLocaleString()} tokens`,
              baseAPR: lpTVL.aprBreakdown?.baseAPR.toFixed(2) + '%' || 'N/A',
              bonusAPR: lpTVL.aprBreakdown?.bonusAPR.toFixed(2) + '%' || 'N/A'
            })
          }
        } else {
          const singleTVL = await this.calculateSinglePoolTVLEnhanced(pool)
          if (singleTVL) {
            singlePools.push(singleTVL)
            this.logger.info(`📊 Enhanced Single Pool: ${pool.poolName}`, {
              tvl: `$${singleTVL.tvlUSD.toLocaleString()}`,
              apr: `${singleTVL.apr.toFixed(2)}%`,
              staked: `${singleTVL.totalStakedFormatted.toLocaleString()} tokens`,
              tokenPrice: `$${singleTVL.tokenPrice}`,
              baseAPR: singleTVL.aprBreakdown?.baseAPR.toFixed(2) + '%' || 'N/A',
              bonusAPR: singleTVL.aprBreakdown?.bonusAPR.toFixed(2) + '%' || 'N/A'
            })
          }
        }
      } catch (error) {
        this.logger.error(`❌ Error calculating enhanced TVL for pool ${pool.poolName}`, error)
      }
    }

    const totalLPTVL = lpPools.reduce((sum, pool) => sum + pool.tvlUSD, 0)
    const totalSingleTVL = singlePools.reduce((sum, pool) => sum + pool.tvlUSD, 0)
    const totalFarmTVL = totalLPTVL + totalSingleTVL

    // Calculate average APRs
    const avgLPAPR = lpPools.length > 0 ? lpPools.reduce((sum, p) => sum + p.apr, 0) / lpPools.length : 0
    const avgSingleAPR = singlePools.length > 0 ? singlePools.reduce((sum, p) => sum + p.apr, 0) / singlePools.length : 0

    this.logger.info('✅ Enhanced Farm TVL calculated with REAL emission-based APRs', {
      lpPools: lpPools.length,
      singlePools: singlePools.length,
      totalLPTVL: `$${totalLPTVL.toLocaleString()}`,
      totalSingleTVL: `$${totalSingleTVL.toLocaleString()}`,
      totalFarmTVL: `$${totalFarmTVL.toLocaleString()}`,
      avgLPAPR: `${avgLPAPR.toFixed(2)}%`,
      avgSingleAPR: `${avgSingleAPR.toFixed(2)}%`,
      poolsWithRealAPR: [...lpPools, ...singlePools].filter(p => p.aprBreakdown?.emissionWeek > 0).length
    })

    return {
      lpPools,
      singlePools,
      totalLPTVL,
      totalSingleTVL,
      totalFarmTVL
    }
  }

  /**
   * ✅ Enhanced LP pool TVL calculation with accurate APR and staking logs
   */
  static async calculateLPPoolTVLEnhanced(pool: FarmPoolInfo): Promise<PoolTVLData | null> {
    try {
      if (!pool.pairId) {
        this.logger.warn(`❌ No pair ID for LP pool ${pool.poolName}`)
        return null
      }

      // Get LP token info
      const lpInfo = await this.getLPTokenInfo(pool.pairId, pool.tokenType)
      if (!lpInfo) {
        this.logger.warn(`❌ Could not get LP token info for ${pool.poolName}`)
        return null
      }

      // Calculate TVL with enhanced logging
      const totalStakedFormatted = parseFloat(pool.totalStaked) / Math.pow(10, 9)
      const tvlUSD = totalStakedFormatted * lpInfo.lpTokenPrice

      // ✅ Enhanced staking logging with TVL
      this.logger.staking(pool.poolName, pool.totalStaked, totalStakedFormatted, tvlUSD)
      
      // Log LP composition
      this.logger.debug(`🔍 LP Token Composition for ${pool.poolName}:`, {
        token0: `${lpInfo.token0Symbol}: $${lpInfo.token0Price}`,
        token1: `${lpInfo.token1Symbol}: $${lpInfo.token1Price}`,
        lpTokenPrice: `$${lpInfo.lpTokenPrice}`,
        totalSupply: lpInfo.totalSupply
      })

      // ✅ Calculate accurate APR using emission data
      const aprBreakdown = await this.calculatePoolAPRFromEmissions(pool, tvlUSD)

      return {
        poolId: pool.poolId,
        poolName: pool.poolName,
        poolType: 'LP',
        tokenType: pool.tokenType,
        totalStaked: pool.totalStaked,
        totalStakedFormatted,
        tokenPrice: lpInfo.lpTokenPrice,
        tvlUSD,
        apr: aprBreakdown.totalAPR,
        allocationPoints: pool.allocationPoints,
        isActive: pool.isActive,
        priceSource: 'DEX',
        lastUpdated: Date.now(),
        aprBreakdown: aprBreakdown
      }

    } catch (error) {
      this.logger.error(`❌ Error calculating enhanced LP pool TVL for ${pool.poolName}`, error)
      return null
    }
  }

  /**
   * ✅ Enhanced single pool TVL calculation with accurate APR and staking logs
   */
  static async calculateSinglePoolTVLEnhanced(pool: FarmPoolInfo): Promise<PoolTVLData | null> {
    try {
      const symbol = this.extractTokenSymbol(pool.tokenType)
      const priceData = await this.getTokenPrice(symbol, pool.tokenType)

      // Calculate TVL with enhanced logging
      const totalStakedFormatted = parseFloat(pool.totalStaked) / Math.pow(10, 9)
      const tvlUSD = totalStakedFormatted * priceData.usdPrice

      // ✅ Enhanced staking logging with TVL
      this.logger.staking(pool.poolName, pool.totalStaked, totalStakedFormatted, tvlUSD)
      
      // Log token pricing details
      this.logger.debug(`💰 Token Pricing for ${pool.poolName}:`, {
        symbol,
        tokenPrice: `$${priceData.usdPrice}`,
        priceSource: priceData.source,
        confidence: priceData.confidence
      })

      // ✅ Calculate accurate APR using emission data
      const aprBreakdown = await this.calculatePoolAPRFromEmissions(pool, tvlUSD)

      return {
        poolId: pool.poolId,
        poolName: pool.poolName,
        poolType: 'Single',
        tokenType: pool.tokenType,
        totalStaked: pool.totalStaked,
        totalStakedFormatted,
        tokenPrice: priceData.usdPrice,
        tvlUSD,
        apr: aprBreakdown.totalAPR,
        allocationPoints: pool.allocationPoints,
        isActive: pool.isActive,
        priceSource: priceData.source,
        lastUpdated: Date.now(),
        aprBreakdown: aprBreakdown
      }

    } catch (error) {
      this.logger.error(`❌ Error calculating enhanced single pool TVL for ${pool.poolName}`, error)
      return null
    }
  }

  // ================================
  // ✅ DEBUG METHODS
  // ================================

  /**
   * Debug APR calculation system
   */
  static async debugAPRCalculation(): Promise<{
    emissionDataAvailable: boolean
    currentWeek: number
    emissionRates: any
    victoryPrice: number
    errors: string[]
  }> {
    const errors: string[] = []
    
    try {
      // Test emission data availability
      const emissionData = await this.getCurrentEmissionData()
      
      if (!emissionData) {
        errors.push('getCurrentEmissionData() returned null')
        return {
          emissionDataAvailable: false,
          currentWeek: 0,
          emissionRates: null,
          victoryPrice: 0,
          errors
        }
      }
      
      return {
        emissionDataAvailable: true,
        currentWeek: emissionData.currentWeek,
        emissionRates: emissionData.emissionRates,
        victoryPrice: emissionData.victoryPriceUSD,
        errors
      }
      
    } catch (error) {
      errors.push(`Error in emission data: ${String(error)}`)
      return {
        emissionDataAvailable: false,
        currentWeek: 0,
        emissionRates: null,
        victoryPrice: 0,
        errors
      }
    }
  }

  // ================================
  // REST OF THE METHODS (Same as before but with enhanced logging)
  // ================================

  static async getFarmPoolInfoWorking(typeString: string, senderAddress: string): Promise<{
    totalStakedBigInt?: bigint
    active?: boolean
  } | null> {
    try {
      const tx = new Transaction()
      tx.moveCall({
        target: `${CONSTANTS.PACKAGE_ID}::farm::get_pool_info`,
        arguments: [tx.object(CONSTANTS.FARM_ID)],
        typeArguments: [typeString]
      })
      
      const result = await suiClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: senderAddress
      })
      
      if (result?.results?.[0]?.returnValues) {
        const rawValues = result.results[0].returnValues
        const parsedValues = rawValues.map(parseBlockchainValue)
        
        const details: any = {}
        
        if (parsedValues.length > 0) {
          details.totalStakedBigInt = parsedValues[0]
          if (parsedValues.length > 3) {
            details.active = Boolean(parsedValues[3])
          }
        }
        
        return details
      }

      return null
    } catch (error) {
      this.logger.error(`CRITICAL: Error fetching pool info for ${typeString}`, error)
      return null
    }
  }

  static async findPairIdWorking(lpTokenType: string, senderAddress: string): Promise<string | undefined> {
    try {
      const lpMatch = lpTokenType.match(/LPCoin<([^,]+),\s*([^>]+)>/)
      if (!lpMatch) {
        this.logger.warn(`Could not parse LP token type: ${lpTokenType}`)
        return undefined
      }

      const [, token0Raw, token1Raw] = lpMatch
      const token0 = token0Raw.trim()
      const token1 = token1Raw.trim()

      const [sortedToken0, sortedToken1] = this.sortTokenTypes(token0, token1)

      const tx = new Transaction()
      tx.moveCall({
        target: `${CONSTANTS.PACKAGE_ID}::factory::get_pair`,
        arguments: [tx.object(CONSTANTS.FACTORY_ID)],
        typeArguments: [sortedToken0, sortedToken1]
      })

      const result = await suiClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: senderAddress
      })

      if (result?.results?.[0]?.returnValues?.[0]?.[0]) {
        const pairIdBytes = result.results[0].returnValues[0][0]
        if (Array.isArray(pairIdBytes) && pairIdBytes.length > 0) {
          const pairId = `0x${Array.from(pairIdBytes.slice(1))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('')}`
          
          this.logger.debug(`Found pair ID for ${token0}/${token1}: ${pairId}`)
          return pairId
        }
      }

      this.logger.warn(`No pair found for ${token0}/${token1}`)
      return undefined

    } catch (error) {
      this.logger.error(`Error finding pair ID for LP token ${lpTokenType}`, error)
      return undefined
    }
  }

  // ================================
  // PRICE DISCOVERY METHODS (Same as before)
  // ================================

  static async updatePricesForFarmPools(farmPools: FarmPoolInfo[]): Promise<number> {
    let pricesUpdated = 0
    const uniqueTokens = new Set<string>()

    for (const pool of farmPools) {
      if (pool.poolType === 'Single') {
        uniqueTokens.add(pool.tokenType)
      } else if (pool.poolType === 'LP' && pool.pairId) {
        const tokens = this.extractTokensFromLPType(pool.tokenType)
        if (tokens) {
          uniqueTokens.add(tokens.token0)
          uniqueTokens.add(tokens.token1)
        }
      }
    }

    this.logger.info(`Need to price ${uniqueTokens.size} unique tokens from farm pools`)

    const tokensArray = Array.from(uniqueTokens)
    
    const suiTokens = tokensArray.filter(token => this.isSUIToken(token))
    for (const suiToken of suiTokens) {
      try {
        const price = await this.getTokenPrice('SUI', suiToken)
        if (price.usdPrice > 0) pricesUpdated++
      } catch (error) {
        this.logger.error(`Error pricing SUI token ${suiToken}`, error)
      }
    }

    const victoryTokens = tokensArray.filter(token => this.isVictoryToken(token))
    for (const victoryToken of victoryTokens) {
      try {
        const price = await this.getTokenPrice('VICTORY', victoryToken)
        if (price.usdPrice > 0) pricesUpdated++
      } catch (error) {
        this.logger.error(`Error pricing VICTORY token ${victoryToken}`, error)
      }
    }

    const otherTokens = tokensArray.filter(token => 
      !this.isSUIToken(token) && !this.isVictoryToken(token)
    )
    
    for (const token of otherTokens) {
      try {
        const symbol = this.extractTokenSymbol(token)
        const price = await this.getTokenPrice(symbol, token)
        if (price.usdPrice > 0) pricesUpdated++
      } catch (error) {
        this.logger.error(`Error pricing token ${token}`, error)
      }
    }

    this.logger.info(`Successfully updated ${pricesUpdated} token prices`)
    return pricesUpdated
  }

  static async getTokenPrice(symbol: string, tokenType?: string): Promise<TokenPrice> {
    const cacheKey = tokenType || symbol.toUpperCase()
    const cached = this.priceCache.get(cacheKey)
    
    if (cached && Date.now() - cached.lastUpdated < this.cacheExpiry) {
      return cached
    }

    try {
      const dexPrice = await this.getPriceFromDEX(symbol, tokenType)
      if (dexPrice > 0) {
        const priceData: TokenPrice = {
          symbol,
          tokenType: tokenType || 'unknown',
          usdPrice: dexPrice,
          source: 'DEX',
          lastUpdated: Date.now(),
          confidence: 'HIGH'
        }
        this.priceCache.set(cacheKey, priceData)
        return priceData
      }

      const cgPrice = await this.getPriceFromCoinGecko(symbol)
      if (cgPrice > 0) {
        const priceData: TokenPrice = {
          symbol,
          tokenType: tokenType || 'unknown',
          usdPrice: cgPrice,
          source: 'COINGECKO',
          lastUpdated: Date.now(),
          confidence: 'MEDIUM'
        }
        this.priceCache.set(cacheKey, priceData)
        return priceData
      }

      const hardcodedPrice = this.getHardcodedPrice(symbol)
      const priceData: TokenPrice = {
        symbol,
        tokenType: tokenType || 'unknown',
        usdPrice: hardcodedPrice,
        source: 'HARDCODED',
        lastUpdated: Date.now(),
        confidence: 'LOW'
      }
      this.priceCache.set(cacheKey, priceData)
      return priceData

    } catch (error) {
      this.logger.error(`Error fetching price for ${symbol}`, error)
      
      if (cached) return cached
      
      return {
        symbol,
        tokenType: tokenType || 'unknown',
        usdPrice: this.getHardcodedPrice(symbol),
        source: 'HARDCODED',
        lastUpdated: Date.now(),
        confidence: 'LOW'
      }
    }
  }

  static async getPriceFromDEX(symbol: string, tokenType?: string): Promise<number> {
    try {
      const senderAddress = this.currentAccount?.address || 
        '0x0000000000000000000000000000000000000000000000000000000000000000'

      if (symbol === 'VICTORY' || this.isVictoryToken(tokenType || '')) {
        const suiPrice = await this.getPriceFromCoinGecko('SUI')
        if (suiPrice === 0) return 0

        const victoryInSui = await this.getVictoryToSuiPriceWorking(senderAddress)
        return victoryInSui * suiPrice
      }

      if (symbol === 'SUI' || this.isSUIToken(tokenType || '')) {
        return await this.getSuiPriceFromUSDCPairWorking(senderAddress)
      }

      return 0
    } catch (error) {
      this.logger.error(`Error getting DEX price for ${symbol}`, error)
      return 0
    }
  }

  static async getVictoryToSuiPriceWorking(senderAddress: string): Promise<number> {
    try {
      const victoryType = CONSTANTS.VICTORY_TOKEN.TYPE
      const suiType = '0x2::sui::SUI'
      
      const [sortedToken0, sortedToken1] = this.sortTokenTypes(victoryType, suiType)
      
      const tx = new Transaction()
      tx.moveCall({
        target: `${CONSTANTS.PACKAGE_ID}::factory::get_pair`,
        arguments: [tx.object(CONSTANTS.FACTORY_ID)],
        typeArguments: [sortedToken0, sortedToken1]
      })

      const result = await suiClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: senderAddress
      })

      if (result?.results?.[0]?.returnValues?.[0]?.[0]) {
        const pairIdBytes = result.results[0].returnValues[0][0]
        if (Array.isArray(pairIdBytes) && pairIdBytes.length > 0) {
          const pairId = `0x${Array.from(pairIdBytes.slice(1))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('')}`
          
          const pairObject = await suiClient.getObject({
            id: pairId,
            options: { showContent: true }
          })

          if (pairObject.data?.content && 'fields' in pairObject.data.content) {
            const fields = pairObject.data.content.fields as any
            const reserve0 = BigInt(fields.reserve0 || '0')
            const reserve1 = BigInt(fields.reserve1 || '0')

            if (reserve0 > 0n && reserve1 > 0n) {
              const isVictoryToken0 = sortedToken0 === victoryType
              
              let victoryReserve: bigint
              let suiReserve: bigint
              
              if (isVictoryToken0) {
                victoryReserve = reserve0
                suiReserve = reserve1
              } else {
                victoryReserve = reserve1
                suiReserve = reserve0
              }

              const victoryInSui = (Number(suiReserve) / Math.pow(10, 9)) / 
                                  (Number(victoryReserve) / Math.pow(10, 6))
              
              this.logger.info(`VICTORY/SUI price from DEX: 1 VICTORY = ${victoryInSui} SUI`)
              return victoryInSui
            }
          }
        }
      }

      this.logger.warn('VICTORY/SUI pair not found or has no liquidity')
      return 0

    } catch (error) {
      this.logger.error('Error getting VICTORY/SUI price from DEX', error)
      return 0
    }
  }

  static async getSuiPriceFromUSDCPairWorking(senderAddress: string): Promise<number> {
    try {
      const suiType = '0x2::sui::SUI'
      const usdcTypes = [
        '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN',
        '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC'
      ]

      for (const usdcType of usdcTypes) {
        try {
          const [sortedToken0, sortedToken1] = this.sortTokenTypes(suiType, usdcType)
          
          const tx = new Transaction()
          tx.moveCall({
            target: `${CONSTANTS.PACKAGE_ID}::factory::get_pair`,
            arguments: [tx.object(CONSTANTS.FACTORY_ID)],
            typeArguments: [sortedToken0, sortedToken1]
          })

          const result = await suiClient.devInspectTransactionBlock({
            transactionBlock: tx,
            sender: senderAddress
          })

          if (result?.results?.[0]?.returnValues?.[0]?.[0]) {
            const pairIdBytes = result.results[0].returnValues[0][0]
            if (Array.isArray(pairIdBytes) && pairIdBytes.length > 0) {
              const pairId = `0x${Array.from(pairIdBytes.slice(1))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('')}`
              
              const pairObject = await suiClient.getObject({
                id: pairId,
                options: { showContent: true }
              })

              if (pairObject.data?.content && 'fields' in pairObject.data.content) {
                const fields = pairObject.data.content.fields as any
                const reserve0 = BigInt(fields.reserve0 || '0')
                const reserve1 = BigInt(fields.reserve1 || '0')

                if (reserve0 > 0n && reserve1 > 0n) {
                  const isSuiToken0 = sortedToken0 === suiType
                  
                  let suiReserve: bigint
                  let usdcReserve: bigint
                  
                  if (isSuiToken0) {
                    suiReserve = reserve0
                    usdcReserve = reserve1
                  } else {
                    suiReserve = reserve1
                    usdcReserve = reserve0
                  }

                  const suiPriceUSD = (Number(usdcReserve) / Math.pow(10, 6)) / 
                                     (Number(suiReserve) / Math.pow(10, 9))
                  
                  this.logger.info(`SUI/USDC price from DEX: 1 SUI = ${suiPriceUSD}`)
                  return suiPriceUSD
                }
              }
            }
          }
        } catch (error) {
          this.logger.debug(`Failed to get SUI price from ${usdcType}`, error)
          continue
        }
      }

      this.logger.warn('SUI/USDC pair not found or has no liquidity')
      return 0

    } catch (error) {
      this.logger.error('Error getting SUI/USDC price from DEX', error)
      return 0
    }
  }

  static async getPriceFromCoinGecko(symbol: string): Promise<number> {
    try {
      const coinGeckoMap: Record<string, string> = {
        'SUI': 'sui',
        'USDC': 'usd-coin',
        'USDT': 'tether',
        'WBTC': 'wrapped-bitcoin',
        'WETH': 'weth'
      }

      const coinId = coinGeckoMap[symbol.toUpperCase()]
      if (!coinId) return 0

      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`,
        {
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(10000)
        }
      )

      if (!response.ok) return 0

      const data = await response.json()
      const price = data[coinId]?.usd || 0
      
      return price
    } catch (error) {
      this.logger.error(`CoinGecko API error for ${symbol}`, error)
      return 0
    }
  }

  static getHardcodedPrice(symbol: string): number {
    const prices: Record<string, number> = {
      'SUI': 3.81,
      'VICTORY': 0.05,
      'USDC': 1.00,
      'USDT': 1.00,
      'WBTC': 45000,
      'WETH': 2500
    }
    return prices[symbol.toUpperCase()] || 0
  }

  static async getLPTokenInfo(pairId: string, lpTokenType: string): Promise<LPTokenInfo | null> {
    const cacheKey = `${pairId}_${lpTokenType}`
    const cached = this.lpInfoCache.get(cacheKey)
    
    if (cached && Date.now() - cached.lastUpdated < this.cacheExpiry) {
      return cached
    }

    try {
      const tokens = this.extractTokensFromLPType(lpTokenType)
      if (!tokens) return null

      const pairObject = await suiClient.getObject({
        id: pairId,
        options: { showContent: true }
      })

      if (!pairObject.data?.content || pairObject.data.content.dataType !== 'moveObject') {
        return null
      }

      const fields = (pairObject.data.content as any).fields
      const reserve0 = fields.reserve0 || '0'
      const reserve1 = fields.reserve1 || '0'
      const totalSupply = fields.total_supply || '0'

      if (reserve0 === '0' || reserve1 === '0' || totalSupply === '0') {
        return null
      }

      const token0Symbol = this.extractTokenSymbol(tokens.token0)
      const token1Symbol = this.extractTokenSymbol(tokens.token1)
      
      const [token0Price, token1Price] = await Promise.all([
        this.getTokenPrice(token0Symbol, tokens.token0),
        this.getTokenPrice(token1Symbol, tokens.token1)
      ])

      const reserve0Value = (parseFloat(reserve0) / Math.pow(10, 9)) * token0Price.usdPrice
      const reserve1Value = (parseFloat(reserve1) / Math.pow(10, 9)) * token1Price.usdPrice
      const totalLiquidity = reserve0Value + reserve1Value
      const lpTokenPrice = totalLiquidity / (parseFloat(totalSupply) / Math.pow(10, 9))

      const lpInfo: LPTokenInfo = {
        pairAddress: pairId,
        token0: tokens.token0,
        token0Symbol,
        token1: tokens.token1,
        token1Symbol,
        reserve0,
        reserve1,
        totalSupply,
        lpTokenPrice,
        token0Price: token0Price.usdPrice,
        token1Price: token1Price.usdPrice,
        lastUpdated: Date.now()
      }

      this.lpInfoCache.set(cacheKey, lpInfo)

      return lpInfo

    } catch (error) {
      this.logger.error(`Error calculating LP token info for ${pairId}`, error)
      return null
    }
  }

  static async calculateLockerTVLEnhanced(): Promise<SystemTVL['lockerTVL']> {
    try {
      this.logger.info('🔒 Calculating enhanced locker TVL with multi-period APRs...')

      const lockerConfig = await TokenLockerService.fetchTokenLockerConfig()
      
      const victoryPrice = await this.getTokenPrice('VICTORY', CONSTANTS.VICTORY_TOKEN.TYPE)
      const suiPrice = await this.getTokenPrice('SUI', '0x2::sui::SUI')

      const vaultBalances = lockerConfig.vaultBalances || {}
      const suiRewardsRaw = vaultBalances.suiRewards || '0'
      const victoryRewardsRaw = vaultBalances.victoryRewards || '0'
      const lockedTokensRaw = vaultBalances.lockedTokens || '0'
      
      const suiRewardsFormatted = parseFloat(suiRewardsRaw) / 1e9
      const victoryRewardsFormatted = parseFloat(victoryRewardsRaw) / 1e6
      const lockedTokensFormatted = parseFloat(lockedTokensRaw) / 1e6
      
      const suiRewardsPool = suiRewardsFormatted * suiPrice.usdPrice
      const victoryRewardsPool = victoryRewardsFormatted * victoryPrice.usdPrice
      const totalLockedTokensTVL = lockedTokensFormatted * victoryPrice.usdPrice

      const poolStats = lockerConfig.poolStats || {}
      const weekLockedRaw = poolStats.weekLocked || '0'
      const threeMonthLockedRaw = poolStats.threeMonthLocked || '0' 
      const yearLockedRaw = poolStats.yearLocked || '0'
      const threeYearLockedRaw = poolStats.threeYearLocked || '0'

      const weekLocked = parseFloat(weekLockedRaw) / 1e6
      const threeMonthLocked = parseFloat(threeMonthLockedRaw) / 1e6
      const yearLocked = parseFloat(yearLockedRaw) / 1e6
      const threeYearLocked = parseFloat(threeYearLockedRaw) / 1e6

      const weekLockedTVL = weekLocked * victoryPrice.usdPrice
      const threeMonthLockedTVL = threeMonthLocked * victoryPrice.usdPrice
      const yearLockedTVL = yearLocked * victoryPrice.usdPrice
      const threeYearLockedTVL = threeYearLocked * victoryPrice.usdPrice

      const enhancedPools: LockerTVLData[] = []

      for (const lockPeriodData of VICTORY_LOCK_PERIODS) {
        let lockedAmount: number
        let lockedAmountUSD: number
        let totalLocked: string

        switch (lockPeriodData.lockPeriod) {
          case 7:
            lockedAmount = weekLocked
            lockedAmountUSD = weekLockedTVL
            totalLocked = weekLockedRaw
            break
          case 90:
            lockedAmount = threeMonthLocked
            lockedAmountUSD = threeMonthLockedTVL
            totalLocked = threeMonthLockedRaw
            break
          case 365:
            lockedAmount = yearLocked
            lockedAmountUSD = yearLockedTVL
            totalLocked = yearLockedRaw
            break
          case 1095:
            lockedAmount = threeYearLocked
            lockedAmountUSD = threeYearLockedTVL
            totalLocked = threeYearLockedRaw
            break
          default:
            continue
        }

        const aprBreakdown = await this.calculateVictoryStakingAPRForLockPeriod(
          lockPeriodData,
          lockedAmountUSD,
          totalLockedTokensTVL
        )

        enhancedPools.push({
          lockPeriod: lockPeriodData.lockPeriod,
          lockPeriodName: lockPeriodData.lockPeriodName,
          totalLocked,
          totalLockedFormatted: lockedAmount,
          victoryPrice: victoryPrice.usdPrice,
          tvlUSD: lockedAmountUSD,
          estimatedAPR: aprBreakdown.totalAPR,
          allocationPercentage: lockPeriodData.victoryAllocationBP / 100,
          aprBreakdown: aprBreakdown
        })
      }

      const totalLockerTVL = enhancedPools.reduce((sum, pool) => sum + pool.tvlUSD, 0)

      this.logger.info('Enhanced Locker TVL with multi-period APRs:', {
        totalLockerTVL: totalLockerTVL.toLocaleString(),
        lockPeriods: enhancedPools.length,
        avgAPR: enhancedPools.length > 0 
          ? (enhancedPools.reduce((sum, pool) => sum + pool.estimatedAPR, 0) / enhancedPools.length).toFixed(2) + '%'
          : '0%',
        highestAPR: enhancedPools.length > 0 
          ? Math.max(...enhancedPools.map(p => p.estimatedAPR)).toFixed(2) + '%'
          : '0%'
      })

      return {
        pools: enhancedPools,
        totalLockerTVL,
        suiRewardsPool,
        victoryRewardsPool
      }

    } catch (error) {
      this.logger.error('💥 Error calculating enhanced locker TVL:', error)
      
      return {
        pools: [],
        totalLockerTVL: 0,
        suiRewardsPool: 0,
        victoryRewardsPool: 0
      }
    }
  }

  static async calculateVictoryStakingAPRForLockPeriod(
    lockPeriodData: LockPeriodData,
    lockedAmountUSD: number,
    totalVictoryStakingTVL: number
  ): Promise<APRBreakdown> {
    try {
      if (lockedAmountUSD <= 0) {
        return {
          baseAPR: 0, bonusAPR: 0, totalAPR: 0,
          victoryRewardsPerSecond: 0, victoryRewardsPerDay: 0, victoryRewardsAnnual: 0,
          dailyRewardsUSD: 0, annualRewardsUSD: 0,
          rewardTokens: ['VICTORY'], emissionWeek: 0, poolShare: 0
        }
      }

      const emissionData = await this.getCurrentEmissionData()
      if (!emissionData) {
        return {
          baseAPR: 0, bonusAPR: 0, totalAPR: 0,
          victoryRewardsPerSecond: 0, victoryRewardsPerDay: 0, victoryRewardsAnnual: 0,
          dailyRewardsUSD: 0, annualRewardsUSD: 0,
          rewardTokens: ['VICTORY'], emissionWeek: 0, poolShare: 0
        }
      }

      const { currentWeek, emissionRates, victoryPriceUSD } = emissionData

      const totalVictoryStakingPerSecond = parseFloat(emissionRates.victoryStakingPerSecond)
      const lockPeriodAllocationPercent = lockPeriodData.victoryAllocationBP / 10000
      const lockPeriodVictoryPerSecond = totalVictoryStakingPerSecond * lockPeriodAllocationPercent
      const userVictoryPerSecond = lockPeriodVictoryPerSecond

      const victoryRewardsPerDay = userVictoryPerSecond * 86400
      const victoryRewardsAnnual = victoryRewardsPerDay * 365

      const dailyRewardsUSD = victoryRewardsPerDay * victoryPriceUSD
      const annualRewardsUSD = victoryRewardsAnnual * victoryPriceUSD

      const baseAPR = (annualRewardsUSD / lockedAmountUSD) * 100

      let bonusAPR = 0
      if (currentWeek <= 4) {
        bonusAPR = baseAPR * 0.10
      }

      const lockDurationMultiplier = this.getLockDurationBonus(lockPeriodData.lockPeriod)
      bonusAPR += baseAPR * lockDurationMultiplier

      const totalAPR = baseAPR + bonusAPR

      return {
        baseAPR,
        bonusAPR,
        totalAPR,
        victoryRewardsPerSecond: userVictoryPerSecond,
        victoryRewardsPerDay,
        victoryRewardsAnnual,
        dailyRewardsUSD,
        annualRewardsUSD,
        rewardTokens: ['VICTORY'],
        emissionWeek: currentWeek,
        poolShare: lockPeriodAllocationPercent
      }

    } catch (error) {
      this.logger.error(`Error calculating Victory staking APR for ${lockPeriodData.lockPeriodName}`, error)
      return {
        baseAPR: 0, bonusAPR: 0, totalAPR: 0,
        victoryRewardsPerSecond: 0, victoryRewardsPerDay: 0, victoryRewardsAnnual: 0,
        dailyRewardsUSD: 0, annualRewardsUSD: 0,
        rewardTokens: ['VICTORY'], emissionWeek: 0, poolShare: 0
      }
    }
  }

  static getLockDurationBonus(lockPeriodDays: number): number {
    if (lockPeriodDays >= 1095) return 0.30
    if (lockPeriodDays >= 365) return 0.20
    if (lockPeriodDays >= 90) return 0.10
    return 0
  }

  // ================================
  // UTILITY METHODS (Same as before)
  // ================================

  static sortTokenTypes(token0: string, token1: string): [string, string] {
    if (token0 === token1) {
      throw new Error('Identical tokens')
    }
    return token0 < token1 ? [token0, token1] : [token1, token0]
  }

  static extractTokensFromLPType(lpTokenType: string): { token0: string; token1: string } | null {
    const lpMatch = lpTokenType.match(/LPCoin<([^,]+),\s*([^>]+)>/)
    if (!lpMatch) return null

    const [, token0Raw, token1Raw] = lpMatch
    const token0 = token0Raw.trim()
    const token1 = token1Raw.trim()

    const [sortedToken0, sortedToken1] = this.sortTokenTypes(token0, token1)
    return { token0: sortedToken0, token1: sortedToken1 }
  }

  static extractTokenSymbol(tokenType: string): string {
    if (tokenType.includes('::sui::SUI')) return 'SUI'
    if (tokenType.includes('::victory_token::VICTORY_TOKEN')) return 'VICTORY'
    
    const parts = tokenType.split('::')
    if (parts.length >= 2) {
      return parts[parts.length - 1].toUpperCase()
    }
    
    return 'UNKNOWN'
  }

  static isSUIToken(tokenType: string): boolean {
    return tokenType.includes('::sui::SUI') || tokenType === '0x2::sui::SUI'
  }

  static isVictoryToken(tokenType: string): boolean {
    return tokenType.includes('::victory_token::VICTORY_TOKEN') || 
           tokenType === CONSTANTS.VICTORY_TOKEN.TYPE
  }

  static clearCache(): void {
    this.priceCache.clear()
    this.lpInfoCache.clear()
    this.logger.info('All caches cleared')
  }

  static getCacheStats(): {
    priceCache: number
    lpInfoCache: number
    cacheExpiry: number
  } {
    return {
      priceCache: this.priceCache.size,
      lpInfoCache: this.lpInfoCache.size,
      cacheExpiry: this.cacheExpiry
    }
  }

  static setCacheExpiry(milliseconds: number): void {
    this.cacheExpiry = milliseconds
    this.logger.info(`Cache expiry set to ${milliseconds}ms`)
  }
}