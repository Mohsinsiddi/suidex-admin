// Complete Fixed TVL Service based on working pattern
import { suiClient } from '../utils/suiClient'
import { CONSTANTS } from '../constants'
import { EventBasedPoolService } from './eventBasedPoolService'
import { TokenLockerService } from './tokenLockerService'
import { Transaction } from '@mysten/sui/transactions'
import { EmissionService } from './emissionService'
import { getCurrentEmissionRates } from '../utils/emissionUtils'
import { calculateTokenomicsSnapshot } from '../utils/tokenomicsCalculator'
// ================================
// TYPES & INTERFACES
// ================================

// Add these interfaces to your existing TVLAPRService:
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

// Victory Locker Lock Periods (from smart contract)
interface LockPeriodData {
  lockPeriod: number // days
  lockPeriodName: string
  victoryAllocationBP: number // basis points (out of 10000)
  suiAllocationBP: number // basis points (out of 10000)
}

// Lock period configuration from smart contract
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
  // Add this line:
  aprBreakdown?: APRBreakdown  // Optional detailed APR data
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
  // Add this line:
  aprBreakdown?: APRBreakdown  // Optional detailed APR data
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
// EXTERNAL UTILITY FUNCTIONS (WORKING PATTERN)
// ================================

/**
 * Parse blockchain value - EXTERNAL FUNCTION (not class method)
 * This matches your working parseBlockchainValue function
 */
function parseBlockchainValue(value: any): any {
  try {
    if (Array.isArray(value) && value.length === 2 && typeof value[1] === 'string') {
      const [dataArray, typeStr] = value

      if (typeStr.startsWith('u') && Array.isArray(dataArray)) {
        return parseU256ByteArray(dataArray)  // ✅ EXTERNAL function call
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

/**
 * Parse U256 byte array - EXTERNAL FUNCTION (not class method)
 */
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
  
  // Reduced logging - only show important messages
  private static logger = {
    info: (msg: string, data?: any) => console.log(`[TVL-APR] ${msg}`, data || ''),
    error: (msg: string, error?: any) => console.error(`[TVL-APR ERROR] ${msg}`, error || ''),
    warn: (msg: string, data?: any) => console.warn(`[TVL-APR WARN] ${msg}`, data || ''),
    debug: (msg: string, data?: any) => {
      // Only show critical debug messages
      if (msg.includes('CRITICAL') || msg.includes('SUCCESS') || msg.includes('TVL')) {
        console.debug(`[TVL-APR DEBUG] ${msg}`, data || '')
      }
    }
  }

  // ================================
  // MAIN ENTRY POINTS
  // ================================

  /**
   * Method to be called from React component with account
   */
  static async getSystemTVLWithAccount(account: { address: string }): Promise<SystemTVL> {
    // Store account globally for use in other methods
    this.currentAccount = account
    return await this.getSystemTVL()
  }

  /**
   * Main system TVL calculation
   */
  static async getSystemTVL(): Promise<SystemTVL> {
    const startTime = Date.now()
    this.logger.info('Starting system TVL calculation')

    const errors: string[] = []
    const warnings: string[] = []
    let pricesUpdated = 0
    let poolsProcessed = 0

    try {
      // Step 1: Discover farm pools using working pattern
      this.logger.info('Discovering farm pools...')
      const farmPools = await this.discoverFarmPoolsFixed()
      this.logger.info(`Discovered ${farmPools.length} farm pools`)

      if (farmPools.length === 0) {
        warnings.push('No active farm pools found')
      }

      // Step 2: Update prices
      this.logger.info('Updating token prices...')
      pricesUpdated = await TVLAPRService.updatePricesForFarmPools(farmPools)
      this.logger.info(`Updated ${pricesUpdated} token prices`)

      // Step 3: Calculate farm TVL
      this.logger.info('Calculating farm TVL...')
      const farmTVL = await TVLAPRService.calculateFarmTVLFromPools(farmPools)
      poolsProcessed = farmPools.length

      // Step 4: Calculate locker TVL
      this.logger.info('Calculating locker TVL...')
      const lockerTVL = await TVLAPRService.calculateLockerTVL()

      // Step 5: Calculate system totals
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

      this.logger.info(`System TVL calculation completed in ${Date.now() - startTime}ms`, {
        totalTVL: `$${totalTVL.toLocaleString()}`,
        farmTVL: `$${farmTVL.totalFarmTVL.toLocaleString()}`,
        lockerTVL: `$${lockerTVL.totalLockerTVL.toLocaleString()}`,
        poolsProcessed
      })

      return result

    } catch (error) {
      this.logger.error('Failed to calculate system TVL', error)
      throw error
    }
  }

  // ================================
  // FARM POOL DISCOVERY (USING YOUR WORKING PATTERN)
  // ================================

  static async discoverFarmPoolsFixed(): Promise<FarmPoolInfo[]> {
    try {
      this.logger.info('Using event-based pool discovery')

      const { pools } = await EventBasedPoolService.getAllPools()
      this.logger.info(`Found ${pools.length} pools from events`)
      
      const farmPools: FarmPoolInfo[] = []
      const poolErrors: Array<{pool: string, error: string}> = []
      
      // Use current account or fallback to dummy address
      const senderAddress = this.currentAccount?.address || 
        '0x0000000000000000000000000000000000000000000000000000000000000000'
      
      for (const [index, pool] of pools.entries()) {
        try {
          this.logger.info(`🔍 Processing pool ${index + 1}/${pools.length}: ${pool.name} (${pool.type})`)
          
          // ✅ FIXED: Get pool info with better error handling
          const poolInfo = await this.getFarmPoolInfoWorking(pool.typeName, senderAddress)
          
          if (poolInfo && poolInfo.totalStakedBigInt !== undefined) {
            // Accept pools even with 0 stake for debugging
            const totalStaked = poolInfo.totalStakedBigInt.toString()
            
            farmPools.push({
              poolId: pool.id,
              poolName: pool.name,
              poolType: pool.type as 'LP' | 'Single',
              tokenType: pool.typeName,
              totalStaked: totalStaked,
              allocationPoints: pool.allocationPoints,
              isActive: poolInfo.active !== false, // Default to true if undefined
              pairId: pool.type === 'LP' ? await this.findPairIdWorking(pool.typeName, senderAddress) : undefined
            })
            
            this.logger.info(`✅ Successfully processed pool: ${pool.name}`, {
              type: pool.type,
              totalStaked: totalStaked,
              active: poolInfo.active,
              hasStake: poolInfo.totalStakedBigInt > 0n
            })
          } else {
            this.logger.warn(`❌ Failed to get pool info for ${pool.name}`)
            poolErrors.push({pool: pool.name, error: 'Failed to get pool info'})
          }
        } catch (error) {
          this.logger.error(`❌ Error processing pool ${pool.name}:`, error)
          poolErrors.push({pool: pool.name, error: String(error)})
        }
      }

      // ✅ IMPROVED: Show detailed summary
      this.logger.info(`📊 Pool Discovery Summary:`, {
        totalFound: pools.length,
        successfullyProcessed: farmPools.length,
        errors: poolErrors.length,
        lpPools: farmPools.filter(p => p.poolType === 'LP').length,
        singlePools: farmPools.filter(p => p.poolType === 'Single').length,
        poolsWithStake: farmPools.filter(p => BigInt(p.totalStaked) > 0n).length
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
  // POOL INFO USING YOUR WORKING PATTERN
  // ================================

  static async getFarmPoolInfoWorking(typeString: string, senderAddress: string): Promise<{
    totalStakedBigInt?: bigint
    active?: boolean
  } | null> {
    try {
      // ✅ EXACT COPY of your working pattern
      const tx = new Transaction()
      tx.moveCall({
        target: `${CONSTANTS.PACKAGE_ID}::farm::get_pool_info`,
        arguments: [tx.object(CONSTANTS.FARM_ID)],  // ✅ arguments first
        typeArguments: [typeString]  // ✅ typeArguments second
      })
      
      const result = await suiClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: senderAddress  // ✅ real sender address
      })
      
      if (result?.results?.[0]?.returnValues) {
        const rawValues = result.results[0].returnValues
        const parsedValues = rawValues.map(parseBlockchainValue)  // ✅ external function
        
        const details: any = {}
        
        // Extract total staked amount which is typically the first value
        if (parsedValues.length > 0) {
          details.totalStakedBigInt = parsedValues[0]
          // Extract active status if available (typically the 4th value)
          if (parsedValues.length > 3) {
            details.active = Boolean(parsedValues[3])
          }
        }
        
        this.logger.debug('CRITICAL: Combined pool details', {
          typeString: typeString.substring(0, 50) + '...',
          totalStakedBigInt: typeof details.totalStakedBigInt === 'bigint' 
            ? details.totalStakedBigInt.toString() 
            : details.totalStakedBigInt,
          active: details.active
        })
        
        return details
      }

      return null
    } catch (error) {
      this.logger.error(`CRITICAL: Error fetching pool info for ${typeString}`, error)
      return null
    }
  }

  // ================================
  // PAIR ID DISCOVERY USING WORKING PATTERN
  // ================================

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

      // ✅ Use your working pattern
      const tx = new Transaction()
      tx.moveCall({
        target: `${CONSTANTS.PACKAGE_ID}::factory::get_pair`,
        arguments: [tx.object(CONSTANTS.FACTORY_ID)],  // ✅ arguments first
        typeArguments: [sortedToken0, sortedToken1]  // ✅ typeArguments second
      })

      const result = await suiClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: senderAddress  // ✅ real sender
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
  // PRICE DISCOVERY METHODS
  // ================================

  static async updatePricesForFarmPools(farmPools: FarmPoolInfo[]): Promise<number> {
    let pricesUpdated = 0
    const uniqueTokens = new Set<string>()

    // Collect all unique tokens from farm pools
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

    // Price discovery strategy for farm pool tokens
    const tokensArray = Array.from(uniqueTokens)
    
    // 1. First priority: Get SUI price (base currency)
    const suiTokens = tokensArray.filter(token => this.isSUIToken(token))
    for (const suiToken of suiTokens) {
      try {
        const price = await this.getTokenPrice('SUI', suiToken)
        if (price.usdPrice > 0) pricesUpdated++
      } catch (error) {
        this.logger.error(`Error pricing SUI token ${suiToken}`, error)
      }
    }

    // 2. Second priority: Get VICTORY price from DEX pairs
    const victoryTokens = tokensArray.filter(token => this.isVictoryToken(token))
    for (const victoryToken of victoryTokens) {
      try {
        const price = await this.getTokenPrice('VICTORY', victoryToken)
        if (price.usdPrice > 0) pricesUpdated++
      } catch (error) {
        this.logger.error(`Error pricing VICTORY token ${victoryToken}`, error)
      }
    }

    // 3. Third priority: Get other tokens
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

    this.logger.debug(`Fetching price for ${symbol}`, { tokenType })

    try {
      // 1. Try DEX first (from farm pool pairs)
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
        this.logger.debug(`Got DEX price for ${symbol}: $${dexPrice}`)
        return priceData
      }

      // 2. Fallback to CoinGecko for major tokens
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
        this.logger.debug(`Got CoinGecko price for ${symbol}: $${cgPrice}`)
        return priceData
      }

      // 3. Hardcoded fallback
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
      this.logger.warn(`Using hardcoded price for ${symbol}: $${hardcodedPrice}`)
      return priceData

    } catch (error) {
      this.logger.error(`Error fetching price for ${symbol}`, error)
      
      // Return cached price if available, otherwise hardcoded
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

      // For VICTORY token, look for VICTORY/SUI pair in farm pools
      if (symbol === 'VICTORY' || this.isVictoryToken(tokenType || '')) {
        const suiPrice = await this.getPriceFromCoinGecko('SUI')
        if (suiPrice === 0) return 0

        const victoryInSui = await this.getVictoryToSuiPriceWorking(senderAddress)
        return victoryInSui * suiPrice
      }

      // For SUI, check if we have SUI/USDC pair in farm pools
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
      
      // ✅ Use working pattern
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
          
          // Get pair reserves
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

              // Calculate VICTORY price in SUI
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
          
          // ✅ Use working pattern
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
              
              // Get pair reserves
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

                  // Calculate SUI price in USD
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
      
      this.logger.debug(`CoinGecko price for ${symbol}: $${price}`)
      return price
    } catch (error) {
      this.logger.error(`CoinGecko API error for ${symbol}`, error)
      return 0
    }
  }

  static getHardcodedPrice(symbol: string): number {
    const prices: Record<string, number> = {
      'SUI': 3.81,  // Use current market price
      'VICTORY': 0.05,
      'USDC': 1.00,
      'USDT': 1.00,
      'WBTC': 45000,
      'WETH': 2500
    }
    return prices[symbol.toUpperCase()] || 0
  }

  // ================================
  // TVL CALCULATION METHODS
  // ================================

  static async calculateFarmTVLFromPools(farmPools: FarmPoolInfo[]): Promise<SystemTVL['farmTVL']> {
    const lpPools: PoolTVLData[] = []
    const singlePools: PoolTVLData[] = []

    for (const pool of farmPools) {
      try {
        if (pool.poolType === 'LP') {
          const lpTVL = await this.calculateLPPoolTVL(pool)
          if (lpTVL) {
            lpPools.push(lpTVL)
            this.logger.debug(`LP Pool TVL: ${pool.poolName} = ${lpTVL.tvlUSD.toLocaleString()}`)
          }
        } else {
          const singleTVL = await this.calculateSinglePoolTVL(pool)
          if (singleTVL) {
            singlePools.push(singleTVL)
            this.logger.debug(`Single Pool TVL: ${pool.poolName} = ${singleTVL.tvlUSD.toLocaleString()}`)
          }
        }
      } catch (error) {
        this.logger.error(`Error calculating TVL for pool ${pool.poolName}`, error)
      }
    }

    const totalLPTVL = lpPools.reduce((sum, pool) => sum + pool.tvlUSD, 0)
    const totalSingleTVL = singlePools.reduce((sum, pool) => sum + pool.tvlUSD, 0)
    const totalFarmTVL = totalLPTVL + totalSingleTVL

    this.logger.info('Farm TVL calculated', {
      lpPools: lpPools.length,
      singlePools: singlePools.length,
      totalLPTVL: `${totalLPTVL.toLocaleString()}`,
      totalSingleTVL: `${totalSingleTVL.toLocaleString()}`,
      totalFarmTVL: `${totalFarmTVL.toLocaleString()}`
    })

    return {
      lpPools,
      singlePools,
      totalLPTVL,
      totalSingleTVL,
      totalFarmTVL
    }
  }

  static async calculateLPPoolTVL(pool: FarmPoolInfo): Promise<PoolTVLData | null> {
    try {
      if (!pool.pairId) {
        this.logger.warn(`No pair ID for LP pool ${pool.poolName}`)
        return null
      }

      // Get LP token info
      const lpInfo = await this.getLPTokenInfo(pool.pairId, pool.tokenType)
      if (!lpInfo) return null

      // Calculate TVL
      const totalStakedFormatted = parseFloat(pool.totalStaked) / Math.pow(10, 9) // Assuming 9 decimals
      const tvlUSD = totalStakedFormatted * lpInfo.lpTokenPrice

      // Calculate APR (simplified)
      const apr = this.calculatePoolAPR(pool.allocationPoints, tvlUSD)

      return {
        poolId: pool.poolId,
        poolName: pool.poolName,
        poolType: 'LP',
        tokenType: pool.tokenType,
        totalStaked: pool.totalStaked,
        totalStakedFormatted,
        tokenPrice: lpInfo.lpTokenPrice,
        tvlUSD,
        apr,
        allocationPoints: pool.allocationPoints,
        isActive: pool.isActive,
        priceSource: 'DEX',
        lastUpdated: Date.now()
      }

    } catch (error) {
      this.logger.error(`Error calculating LP pool TVL for ${pool.poolName}`, error)
      return null
    }
  }

  static async calculateSinglePoolTVL(pool: FarmPoolInfo): Promise<PoolTVLData | null> {
    try {
      const symbol = this.extractTokenSymbol(pool.tokenType)
      const priceData = await this.getTokenPrice(symbol, pool.tokenType)

      const totalStakedFormatted = parseFloat(pool.totalStaked) / Math.pow(10, 9) // Assuming 9 decimals
      const tvlUSD = totalStakedFormatted * priceData.usdPrice

      // Calculate APR (simplified)
      const apr = this.calculatePoolAPR(pool.allocationPoints, tvlUSD)

      return {
        poolId: pool.poolId,
        poolName: pool.poolName,
        poolType: 'Single',
        tokenType: pool.tokenType,
        totalStaked: pool.totalStaked,
        totalStakedFormatted,
        tokenPrice: priceData.usdPrice,
        tvlUSD,
        apr,
        allocationPoints: pool.allocationPoints,
        isActive: pool.isActive,
        priceSource: priceData.source,
        lastUpdated: Date.now()
      }

    } catch (error) {
      this.logger.error(`Error calculating single pool TVL for ${pool.poolName}`, error)
      return null
    }
  }

  static async getLPTokenInfo(pairId: string, lpTokenType: string): Promise<LPTokenInfo | null> {
    const cacheKey = `${pairId}_${lpTokenType}`
    const cached = this.lpInfoCache.get(cacheKey)
    
    if (cached && Date.now() - cached.lastUpdated < this.cacheExpiry) {
      return cached
    }

    try {
      // Extract token types from LP token type
      const tokens = this.extractTokensFromLPType(lpTokenType)
      if (!tokens) return null

      // Get pair reserves
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

      // Get token prices
      const token0Symbol = this.extractTokenSymbol(tokens.token0)
      const token1Symbol = this.extractTokenSymbol(tokens.token1)
      
      const [token0Price, token1Price] = await Promise.all([
        this.getTokenPrice(token0Symbol, tokens.token0),
        this.getTokenPrice(token1Symbol, tokens.token1)
      ])

      // Calculate LP token price
      // LP Price = (reserve0 * price0 + reserve1 * price1) / totalSupply
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
      this.logger.debug(`Calculated LP token price for ${token0Symbol}/${token1Symbol}: ${lpTokenPrice}`)

      return lpInfo

    } catch (error) {
      this.logger.error(`Error calculating LP token info for ${pairId}`, error)
      return null
    }
  }

  static async calculateLockerTVL(): Promise<SystemTVL['lockerTVL']> {
    try {
      this.logger.info('🔒 Calculating locker TVL...')

      // Get locker config from TokenLockerService
      const lockerConfig = await TokenLockerService.fetchTokenLockerConfig()
      this.logger.info('✅ Locker config received')
      
      // Get VICTORY price - simplified to just USD price
      this.logger.info('💰 Fetching VICTORY price...')
      const victoryPrice = await this.getTokenPrice('VICTORY', CONSTANTS.VICTORY_TOKEN.TYPE)
      this.logger.info(`💰 VICTORY price: ${victoryPrice.usdPrice} (source: ${victoryPrice.source})`)

      // Get SUI price for rewards pool
      const suiPrice = await this.getTokenPrice('SUI', '0x2::sui::SUI')
      this.logger.info(`💰 SUI price: ${suiPrice.usdPrice} (source: ${suiPrice.source})`)

      // ✅ SIMPLIFIED: Direct calculation from vault balances
      const vaultBalances = lockerConfig.vaultBalances || {}
      
      // SUI rewards pool (1 SUI = 1,000,000,000 in raw)
      const suiRewardsRaw = vaultBalances.suiRewards || '0'
      const suiRewardsFormatted = parseFloat(suiRewardsRaw) / 1e9  // 9 decimals
      const suiRewardsPool = suiRewardsFormatted * suiPrice.usdPrice
      
      this.logger.info(`🔷 SUI Rewards: ${suiRewardsRaw} raw = ${suiRewardsFormatted} SUI = ${suiRewardsPool}`)

      // Victory rewards pool (1,086,678,795,198 = 1,086,678.795198 VICTORY)
      const victoryRewardsRaw = vaultBalances.victoryRewards || '0'
      const victoryRewardsFormatted = parseFloat(victoryRewardsRaw) / 1e6  // 6 decimals  
      const victoryRewardsPool = victoryRewardsFormatted * victoryPrice.usdPrice
      
      this.logger.info(`🏆 Victory Rewards: ${victoryRewardsRaw} raw = ${victoryRewardsFormatted} VICTORY = ${victoryRewardsPool}`)

      // Locked tokens vault (18,600,590,903 = 18,600.590903 VICTORY)
      const lockedTokensRaw = vaultBalances.lockedTokens || '0'
      const lockedTokensFormatted = parseFloat(lockedTokensRaw) / 1e6  // 6 decimals
      const lockedTokensTVL = lockedTokensFormatted * victoryPrice.usdPrice
      
      this.logger.info(`🔒 Locked Tokens: ${lockedTokensRaw} raw = ${lockedTokensFormatted} VICTORY = ${lockedTokensTVL}`)

      // ✅ TOTAL CALCULATION
      const totalLockerTVL = lockedTokensTVL + victoryRewardsPool  // Only count actual locked tokens
      const totalRewardsPool = suiRewardsPool + victoryRewardsPool  // Separate rewards

      this.logger.info(`📊 LOCKER TVL SUMMARY:`)
      this.logger.info(`   • Locked Tokens TVL: ${lockedTokensTVL}`)
      this.logger.info(`   • Victory Rewards Pool: ${victoryRewardsPool}`)
      this.logger.info(`   • SUI Rewards Pool: ${suiRewardsPool}`)
      this.logger.info(`   • TOTAL LOCKER TVL: ${totalLockerTVL}`)

      // Create simplified pools array for now
      const pools: LockerTVLData[] = [{
        lockPeriod: 0,
        lockPeriodName: 'All Locks Combined',
        totalLocked: lockedTokensRaw,
        totalLockedFormatted: lockedTokensFormatted,
        victoryPrice: victoryPrice.usdPrice,
        tvlUSD: lockedTokensTVL,
        estimatedAPR: 0,
        allocationPercentage: 0
      }]

      return {
        pools,
        totalLockerTVL,
        suiRewardsPool,
        victoryRewardsPool
      }

    } catch (error) {
      this.logger.error('💥 CRITICAL: Error calculating locker TVL:', error)
      
      return {
        pools: [],
        totalLockerTVL: 0,
        suiRewardsPool: 0,
        victoryRewardsPool: 0
      }
    }
  }

  // ================================
  // CALCULATION HELPER METHODS
  // ================================


  static calculateLockerAPR(allocationBasisPoints: number, lockPeriodDays: number): number {
    // Longer locks get higher APR
    const periodMultiplier = lockPeriodDays / 365 // Annualized
    const allocationPercentage = allocationBasisPoints / 100 // Convert basis points to percentage
    
    // Base APR scales with allocation and lock period
    return Math.min(allocationPercentage * periodMultiplier * 10, 200) // Cap at 200%
  }

  // ================================
  // UTILITY METHODS
  // ================================

  static sortTokenTypes(token0: string, token1: string): [string, string] {
    if (token0 === token1) {
      throw new Error('Identical tokens')
    }
    
    // Use lexicographic comparison for consistent sorting
    return token0 < token1 ? [token0, token1] : [token1, token0]
  }

  static extractTokensFromLPType(lpTokenType: string): { token0: string; token1: string } | null {
    const lpMatch = lpTokenType.match(/LPCoin<([^,]+),\s*([^>]+)>/)
    if (!lpMatch) return null

    const [, token0Raw, token1Raw] = lpMatch
    const token0 = token0Raw.trim()
    const token1 = token1Raw.trim()

    // Return sorted tokens
    const [sortedToken0, sortedToken1] = this.sortTokenTypes(token0, token1)
    return { token0: sortedToken0, token1: sortedToken1 }
  }

  static extractTokenSymbol(tokenType: string): string {
    // Handle special cases
    if (tokenType.includes('::sui::SUI')) return 'SUI'
    if (tokenType.includes('::victory_token::VICTORY_TOKEN')) return 'VICTORY'
    
    // Extract from type string
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

  // ================================
  // CACHE MANAGEMENT
  // ================================

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

  // ================================
  // DEBUG AND TESTING METHODS
  // ================================

  /**
   * Test connection and basic functionality
   */
  static async testConnection(): Promise<{
    status: string
    suiClient: boolean
    eventService: boolean
    tokenLocker: boolean
    priceData: any
  }> {
    try {
      // Test Sui client
      const suiClientTest = await suiClient.getLatestSuiSystemState()
      
      // Test EventBasedPoolService
      const { pools } = await EventBasedPoolService.getAllPools()
      
      // Test TokenLockerService
      const lockerConfig = await TokenLockerService.fetchTokenLockerConfig()
      
      // Test price fetching
      const suiPrice = await this.getPriceFromCoinGecko('SUI')
      
      return {
        status: 'SUCCESS',
        suiClient: !!suiClientTest,
        eventService: pools.length > 0,
        tokenLocker: !!lockerConfig,
        priceData: {
          suiPrice,
          cacheSize: this.priceCache.size
        }
      }
    } catch (error) {
      this.logger.error('Connection test failed', error)
      return {
        status: 'FAILED',
        suiClient: false,
        eventService: false,
        tokenLocker: false,
        priceData: null
      }
    }
  }

  /**
   * Get detailed debug information
   */
  static getDebugInfo(): {
    cacheStats: any
    constants: any
    currentAccount: any
  } {
    return {
      cacheStats: this.getCacheStats(),
      constants: {
        packageId: CONSTANTS.PACKAGE_ID,
        farmId: CONSTANTS.FARM_ID,
        factoryId: CONSTANTS.FACTORY_ID,
        victoryTokenType: CONSTANTS.VICTORY_TOKEN.TYPE
      },
      currentAccount: this.currentAccount
    }
  }

  /**
   * Manual price update for specific token
   */
  static async updateTokenPrice(symbol: string, tokenType?: string): Promise<TokenPrice> {
    const cacheKey = tokenType || symbol.toUpperCase()
    this.priceCache.delete(cacheKey) // Clear cache first
    return await this.getTokenPrice(symbol, tokenType)
  }

  /**
   * Debug locker TVL calculation specifically
   */
  static async debugLockerTVL(): Promise<{
    lockerConfig: any
    victoryPrice: TokenPrice
    suiPrice: TokenPrice
    calculations: any[]
    totalTVL: number
    errors: string[]
  }> {
    const errors: string[] = []
    
    try {
      console.log('🔒 DEBUGGING: Starting locker TVL debug...')
      
      // Step 1: Get locker config
      const lockerConfig = await TokenLockerService.fetchTokenLockerConfig()
      console.log('📋 DEBUGGING: Raw locker config:', lockerConfig)
      
      // Step 2: Get prices
      const victoryPrice = await this.getTokenPrice('VICTORY', CONSTANTS.VICTORY_TOKEN.TYPE)
      const suiPrice = await this.getTokenPrice('SUI', '0x2::sui::SUI')
      
      console.log('💰 DEBUGGING: Prices:', {
        victory: victoryPrice,
        sui: suiPrice
      })
      
      // Step 3: Calculate each component
      const calculations: any[] = []
      
      // Check vault balances
      if (lockerConfig.vaultBalances) {
        const suiRewards = parseFloat(lockerConfig.vaultBalances.suiRewards || '0') / Math.pow(10, 9)
        const victoryRewards = parseFloat(lockerConfig.vaultBalances.victoryRewards || '0') / Math.pow(10, 6)
        const lockedTokens = parseFloat(lockerConfig.vaultBalances.lockedTokens || '0') / Math.pow(10, 6)
        
        calculations.push({
          type: 'SUI Rewards',
          rawBalance: lockerConfig.vaultBalances.suiRewards,
          formattedBalance: suiRewards,
          price: suiPrice.usdPrice,
          tvl: suiRewards * suiPrice.usdPrice
        })
        
        calculations.push({
          type: 'Victory Rewards',
          rawBalance: lockerConfig.vaultBalances.victoryRewards,
          formattedBalance: victoryRewards,
          price: victoryPrice.usdPrice,
          tvl: victoryRewards * victoryPrice.usdPrice
        })
        
        calculations.push({
          type: 'Locked Tokens',
          rawBalance: lockerConfig.vaultBalances.lockedTokens,
          formattedBalance: lockedTokens,
          price: victoryPrice.usdPrice,
          tvl: lockedTokens * victoryPrice.usdPrice
        })
      }
      
      // Check pool stats if available
      if (lockerConfig.poolStats) {
        const poolTypes = ['weekLocked', 'threeMonthLocked', 'yearLocked', 'threeYearLocked']
        
        for (const poolType of poolTypes) {
          const rawAmount = lockerConfig.poolStats[poolType] || '0'
          const formattedAmount = parseFloat(rawAmount) / Math.pow(10, 6)
          
          calculations.push({
            type: `Pool ${poolType}`,
            rawBalance: rawAmount,
            formattedBalance: formattedAmount,
            price: victoryPrice.usdPrice,
            tvl: formattedAmount * victoryPrice.usdPrice
          })
        }
      }
      
      const totalTVL = calculations.reduce((sum, calc) => sum + calc.tvl, 0)
      
      console.log('📊 DEBUGGING: All calculations:', calculations)
      console.log('💎 DEBUGGING: Total TVL:', totalTVL)
      
      return {
        lockerConfig,
        victoryPrice,
        suiPrice,
        calculations,
        totalTVL,
        errors
      }
      
    } catch (error) {
      console.error('💥 DEBUGGING: Locker TVL debug failed:', error)
      errors.push(String(error))
      
      return {
        lockerConfig: null,
        victoryPrice: { symbol: 'VICTORY', tokenType: '', usdPrice: 0, source: 'HARDCODED', lastUpdated: 0, confidence: 'LOW' },
        suiPrice: { symbol: 'SUI', tokenType: '', usdPrice: 0, source: 'HARDCODED', lastUpdated: 0, confidence: 'LOW' },
        calculations: [],
        totalTVL: 0,
        errors
      }
    }
  }
  static async debugPoolDiscovery(): Promise<{
    eventPools: any[]
    processedPools: FarmPoolInfo[]
    poolBreakdown: any
    errors: any[]
  }> {
    try {
      const { pools } = await EventBasedPoolService.getAllPools()
      const senderAddress = this.currentAccount?.address || 
        '0x0000000000000000000000000000000000000000000000000000000000000000'
      
      const processedPools: FarmPoolInfo[] = []
      const errors: any[] = []
      
      console.log('🔍 DEBUGGING: All pools from events:', pools.map(p => ({
        id: p.id,
        name: p.name,
        type: p.type,
        allocationPoints: p.allocationPoints,
        isActive: p.isActive
      })))
      
      for (const pool of pools) {
        try {
          const poolInfo = await this.getFarmPoolInfoWorking(pool.typeName, senderAddress)
          
          if (poolInfo && poolInfo.totalStakedBigInt !== undefined) {
            processedPools.push({
              poolId: pool.id,
              poolName: pool.name,
              poolType: pool.type as 'LP' | 'Single',
              tokenType: pool.typeName,
              totalStaked: poolInfo.totalStakedBigInt.toString(),
              allocationPoints: pool.allocationPoints,
              isActive: poolInfo.active !== false,
              pairId: pool.type === 'LP' ? await this.findPairIdWorking(pool.typeName, senderAddress) : undefined
            })
          } else {
            errors.push({
              pool: pool.name,
              error: 'No pool info returned',
              poolInfo
            })
          }
        } catch (error) {
          errors.push({
            pool: pool.name,
            error: String(error)
          })
        }
      }
      
      const poolBreakdown = {
        totalFromEvents: pools.length,
        totalProcessed: processedPools.length,
        lpPools: processedPools.filter(p => p.poolType === 'LP').length,
        singlePools: processedPools.filter(p => p.poolType === 'Single').length,
        poolsWithStake: processedPools.filter(p => BigInt(p.totalStaked) > 0n).length,
        errors: errors.length
      }
      
      console.log('📊 DEBUGGING: Pool breakdown:', poolBreakdown)
      console.log('❌ DEBUGGING: Errors:', errors)
      
      return {
        eventPools: pools,
        processedPools,
        poolBreakdown,
        errors
      }
    } catch (error) {
      console.error('💥 Debug pool discovery failed:', error)
      return {
        eventPools: [],
        processedPools: [],
        poolBreakdown: {},
        errors: [{ error: String(error) }]
      }
    }
  }
  static async debugPriceDiscovery(symbol: string, tokenType?: string): Promise<{
    symbol: string
    tokenType: string
    dexPrice: number
    coinGeckoPrice: number
    hardcodedPrice: number
    finalPrice: TokenPrice
    errors: string[]
  }> {
    const errors: string[] = []
    let dexPrice = 0
    let coinGeckoPrice = 0
    let hardcodedPrice = 0

    try {
      dexPrice = await this.getPriceFromDEX(symbol, tokenType)
    } catch (error) {
      errors.push(`DEX: ${String(error)}`)
    }

    try {
      coinGeckoPrice = await this.getPriceFromCoinGecko(symbol)
    } catch (error) {
      errors.push(`CoinGecko: ${String(error)}`)
    }

    hardcodedPrice = this.getHardcodedPrice(symbol)

    const finalPrice = await this.getTokenPrice(symbol, tokenType)

    return {
      symbol,
      tokenType: tokenType || 'unknown',
      dexPrice,
      coinGeckoPrice,
      hardcodedPrice,
      finalPrice,
      errors
    }
  }

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
      this.logger.warn('Emissions not started yet')
      return null
    }

    // Calculate current week using tokenomics
    const tokenomicsSnapshot = calculateTokenomicsSnapshot(
      emissionConfig.emissionStartTimestamp, 
      currentTimestamp
    )
    
    const currentWeek = tokenomicsSnapshot.currentWeek
    if (currentWeek === 0) {
      this.logger.warn('Current week is 0, emissions may not be active')
      return null
    }

    // Get emission rates for this week
    const emissionRates = getCurrentEmissionRates(currentWeek)
    
    // Get Victory price
    const victoryPrice = await this.getTokenPrice('VICTORY', CONSTANTS.VICTORY_TOKEN.TYPE)
    
    this.logger.debug('Current emission data:', {
      currentWeek,
      emissionRates,
      victoryPriceUSD: victoryPrice.usdPrice
    })

    return {
      currentWeek,
      emissionRates,
      victoryPriceUSD: victoryPrice.usdPrice
    }

  } catch (error) {
    this.logger.error('Error getting current emission data:', error)
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
    
    this.logger.debug(`Total ${poolType} allocation points: ${totalAllocPoints}`)
    return totalAllocPoints
    
  } catch (error) {
    this.logger.error(`Error getting total ${poolType} allocation points:`, error)
    return 1 // Fallback to prevent division by zero
  }
}

/**
 * Calculate accurate pool APR using emission data
 */
static async calculatePoolAPRFromEmissions(
  poolInfo: FarmPoolInfo,
  tvlUSD: number
): Promise<APRBreakdown> {
  try {
    if (tvlUSD <= 0 || !poolInfo.isActive) {
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
      this.logger.warn(`No emission data available for ${poolInfo.poolName}`)
      return {
        baseAPR: 0, bonusAPR: 0, totalAPR: 0,
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

    this.logger.debug(`APR calculated for ${poolInfo.poolName}:`, {
      poolType: poolInfo.poolType,
      allocationPoints: poolInfo.allocationPoints,
      totalAllocPoints,
      poolShare: (poolShare * 100).toFixed(2) + '%',
      victoryPerSecond: poolVictoryPerSecond.toFixed(6),
      dailyVictoryRewards: victoryRewardsPerDay.toFixed(2),
      victoryPrice: victoryPriceUSD,
      tvlUSD: tvlUSD.toLocaleString(),
      baseAPR: baseAPR.toFixed(2) + '%',
      bonusAPR: bonusAPR.toFixed(2) + '%',
      totalAPR: totalAPR.toFixed(2) + '%'
    })

    return aprBreakdown

  } catch (error) {
    this.logger.error(`Error calculating APR for ${poolInfo.poolName}:`, error)
    return {
      baseAPR: 0, bonusAPR: 0, totalAPR: 0,
      victoryRewardsPerSecond: 0, victoryRewardsPerDay: 0, victoryRewardsAnnual: 0,
      dailyRewardsUSD: 0, annualRewardsUSD: 0,
      rewardTokens: ['VICTORY'], emissionWeek: 0, poolShare: 0
    }
  }
}

/**
 * Calculate Victory Staking APR for specific lock period with accurate allocation
 */
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

    // Get current emission data
    const emissionData = await this.getCurrentEmissionData()
    if (!emissionData) {
      this.logger.warn('No emission data available for Victory staking')
      return {
        baseAPR: 0, bonusAPR: 0, totalAPR: 0,
        victoryRewardsPerSecond: 0, victoryRewardsPerDay: 0, victoryRewardsAnnual: 0,
        dailyRewardsUSD: 0, annualRewardsUSD: 0,
        rewardTokens: ['VICTORY'], emissionWeek: 0, poolShare: 0
      }
    }

    const { currentWeek, emissionRates, victoryPriceUSD } = emissionData

    // Total Victory staking allocation per second (from emission system)
    const totalVictoryStakingPerSecond = parseFloat(emissionRates.victoryStakingPerSecond)

    // This lock period gets its share based on allocation basis points
    const lockPeriodAllocationPercent = lockPeriodData.victoryAllocationBP / 10000
    const lockPeriodVictoryPerSecond = totalVictoryStakingPerSecond * lockPeriodAllocationPercent

    // User's share within this lock period (assuming they're the only one for max APR)
    // In reality, this would be divided by the total locked in this specific period
    const userVictoryPerSecond = lockPeriodVictoryPerSecond // Simplified for max potential

    // Calculate rewards
    const victoryRewardsPerDay = userVictoryPerSecond * 86400
    const victoryRewardsAnnual = victoryRewardsPerDay * 365

    const dailyRewardsUSD = victoryRewardsPerDay * victoryPriceUSD
    const annualRewardsUSD = victoryRewardsAnnual * victoryPriceUSD

    // Calculate base APR
    const baseAPR = (annualRewardsUSD / lockedAmountUSD) * 100

    // Bonus APR for early phase
    let bonusAPR = 0
    if (currentWeek <= 4) {
      bonusAPR = baseAPR * 0.10 // 10% bonus during bootstrap
    }

    // Additional bonus for longer locks
    const lockDurationMultiplier = this.getLockDurationBonus(lockPeriodData.lockPeriod)
    bonusAPR += baseAPR * lockDurationMultiplier

    const totalAPR = baseAPR + bonusAPR

    this.logger.info(`Victory Staking APR calculated for ${lockPeriodData.lockPeriodName}:`, {
      currentWeek,
      lockPeriod: lockPeriodData.lockPeriod,
      allocationPercent: lockPeriodAllocationPercent * 100 + '%',
      victoryStakingPerSecond: userVictoryPerSecond.toFixed(6),
      victoryRewardsPerDay: victoryRewardsPerDay.toFixed(2),
      victoryPriceUSD,
      lockedAmountUSD: lockedAmountUSD.toLocaleString(),
      baseAPR: baseAPR.toFixed(2) + '%',
      bonusAPR: bonusAPR.toFixed(2) + '%',
      totalAPR: totalAPR.toFixed(2) + '%'
    })

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

/**
 * Calculate lock duration bonus multiplier
 */
static getLockDurationBonus(lockPeriodDays: number): number {
  // Bonus increases with lock duration
  if (lockPeriodDays >= 1095) return 0.30      // 3-year lock: +30% bonus
  if (lockPeriodDays >= 365) return 0.20       // 1-year lock: +20% bonus  
  if (lockPeriodDays >= 90) return 0.10        // 3-month lock: +10% bonus
  return 0                                      // 1-week lock: no bonus
}

/**
 * Enhanced locker TVL calculation with accurate multi-period APRs
 */
static async calculateLockerTVLEnhanced(): Promise<SystemTVL['lockerTVL']> {
  try {
    this.logger.info('🔒 Calculating enhanced locker TVL with multi-period APRs...')

    // Get locker config (existing logic)
    const lockerConfig = await TokenLockerService.fetchTokenLockerConfig()
    
    // Get Victory price (existing logic)
    const victoryPrice = await this.getTokenPrice('VICTORY', CONSTANTS.VICTORY_TOKEN.TYPE)
    const suiPrice = await this.getTokenPrice('SUI', '0x2::sui::SUI')

    // Calculate TVL from vault balances
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

    // Get pool statistics if available (from lockerConfig.poolStats)
    const poolStats = lockerConfig.poolStats || {}
    const weekLockedRaw = poolStats.weekLocked || '0'
    const threeMonthLockedRaw = poolStats.threeMonthLocked || '0' 
    const yearLockedRaw = poolStats.yearLocked || '0'
    const threeYearLockedRaw = poolStats.threeYearLocked || '0'

    // Format individual lock period amounts
    const weekLocked = parseFloat(weekLockedRaw) / 1e6
    const threeMonthLocked = parseFloat(threeMonthLockedRaw) / 1e6
    const yearLocked = parseFloat(yearLockedRaw) / 1e6
    const threeYearLocked = parseFloat(threeYearLockedRaw) / 1e6

    // Calculate TVL for each lock period
    const weekLockedTVL = weekLocked * victoryPrice.usdPrice
    const threeMonthLockedTVL = threeMonthLocked * victoryPrice.usdPrice
    const yearLockedTVL = yearLocked * victoryPrice.usdPrice
    const threeYearLockedTVL = threeYearLocked * victoryPrice.usdPrice

    // Calculate APR for each lock period
    const enhancedPools: LockerTVLData[] = []

    for (const lockPeriodData of VICTORY_LOCK_PERIODS) {
      let lockedAmount: number
      let lockedAmountUSD: number
      let totalLocked: string

      // Map lock period to actual locked amounts
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

      // Calculate accurate APR for this lock period
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
        allocationPercentage: lockPeriodData.victoryAllocationBP / 100, // Convert to percentage
        // Store additional APR data
        aprBreakdown: aprBreakdown
      })
    }

    // Calculate total locker TVL
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

// ✅ Replace your existing calculatePoolAPR method with this:
static calculatePoolAPR(allocationPoints: number, tvlUSD: number): number {
  // This method is now deprecated - use calculatePoolAPRFromEmissions instead
  // Keep it for backward compatibility but use real calculation
  if (tvlUSD === 0) return 0
  
  // Simplified fallback calculation
  const baseAPR = 50 // 50% base APR
  const allocationMultiplier = allocationPoints / 1000
  return Math.min(baseAPR * allocationMultiplier, 500) // Cap at 500%
}

// ✅ REPLACE your existing calculateFarmTVLFromPools method with this:
static async calculateFarmTVLFromPoolsEnhanced(farmPools: FarmPoolInfo[]): Promise<SystemTVL['farmTVL']> {
  const lpPools: PoolTVLData[] = []
  const singlePools: PoolTVLData[] = []

  for (const pool of farmPools) {
    try {
      if (pool.poolType === 'LP') {
        const lpTVL = await this.calculateLPPoolTVLEnhanced(pool)
        if (lpTVL) {
          lpPools.push(lpTVL)
          this.logger.debug(`Enhanced LP Pool: ${pool.poolName} = $${lpTVL.tvlUSD.toLocaleString()} @ ${lpTVL.apr.toFixed(2)}% APR`)
        }
      } else {
        const singleTVL = await this.calculateSinglePoolTVLEnhanced(pool)
        if (singleTVL) {
          singlePools.push(singleTVL)
          this.logger.debug(`Enhanced Single Pool: ${pool.poolName} = $${singleTVL.tvlUSD.toLocaleString()} @ ${singleTVL.apr.toFixed(2)}% APR`)
        }
      }
    } catch (error) {
      this.logger.error(`Error calculating enhanced TVL for pool ${pool.poolName}`, error)
    }
  }

  const totalLPTVL = lpPools.reduce((sum, pool) => sum + pool.tvlUSD, 0)
  const totalSingleTVL = singlePools.reduce((sum, pool) => sum + pool.tvlUSD, 0)
  const totalFarmTVL = totalLPTVL + totalSingleTVL

  this.logger.info('Enhanced Farm TVL calculated with real APRs', {
    lpPools: lpPools.length,
    singlePools: singlePools.length,
    totalLPTVL: `$${totalLPTVL.toLocaleString()}`,
    totalSingleTVL: `$${totalSingleTVL.toLocaleString()}`,
    totalFarmTVL: `$${totalFarmTVL.toLocaleString()}`
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
 * Enhanced LP pool TVL calculation with accurate APR
 */
static async calculateLPPoolTVLEnhanced(pool: FarmPoolInfo): Promise<PoolTVLData | null> {
  try {
    if (!pool.pairId) {
      this.logger.warn(`No pair ID for LP pool ${pool.poolName}`)
      return null
    }

    // Get LP token info (existing logic)
    const lpInfo = await this.getLPTokenInfo(pool.pairId, pool.tokenType)
    if (!lpInfo) return null

    // Calculate TVL (existing logic)
    const totalStakedFormatted = parseFloat(pool.totalStaked) / Math.pow(10, 9)
    const tvlUSD = totalStakedFormatted * lpInfo.lpTokenPrice

    // ✅ NEW: Calculate accurate APR using emission data
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
    this.logger.error(`Error calculating enhanced LP pool TVL for ${pool.poolName}`, error)
    return null
  }
}

/**
 * Enhanced single pool TVL calculation with accurate APR
 */
static async calculateSinglePoolTVLEnhanced(pool: FarmPoolInfo): Promise<PoolTVLData | null> {
  try {
    const symbol = this.extractTokenSymbol(pool.tokenType)
    const priceData = await this.getTokenPrice(symbol, pool.tokenType)

    const totalStakedFormatted = parseFloat(pool.totalStaked) / Math.pow(10, 9)
    const tvlUSD = totalStakedFormatted * priceData.usdPrice

    // ✅ NEW: Calculate accurate APR using emission data
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
    this.logger.error(`Error calculating enhanced single pool TVL for ${pool.poolName}`, error)
    return null
  }
}
}