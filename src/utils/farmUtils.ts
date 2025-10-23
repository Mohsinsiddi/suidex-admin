// utils/farmUtils.ts

import type { FarmUpdateAddresses, FarmValidationResult, FarmFeeAddresses } from '../types/farmTypes'

/**
 * Farm utility functions
 * Validation, formatting, calculations
 */
export class FarmUtils {
  
  // ==================== VALIDATION ====================

  /**
   * Validate address format
   */
  static validateAddress(address: string): { isValid: boolean; error?: string } {
    if (!address) {
      return { isValid: false, error: 'Address is required' }
    }
    
    if (!/^0x[a-fA-F0-9]+$/.test(address)) {
      return { isValid: false, error: 'Invalid address format' }
    }
    
    return { isValid: true }
  }

  /**
   * Validate fee addresses for farm update
   */
  static validateAddresses(addresses: FarmUpdateAddresses): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    const addressPattern = /^0x[a-fA-F0-9]{64}$/
    const zeroAddress = '0x0000000000000000000000000000000000000000000000000000000000000000'

    // Validate Burn
    if (!addresses.burn) {
      errors.push('Burn address is required')
    } else if (!addressPattern.test(addresses.burn)) {
      errors.push('Burn address format is invalid')
    } else if (addresses.burn === zeroAddress) {
      errors.push('Burn cannot be zero address')
    }

    // Validate Locker
    if (!addresses.locker) {
      errors.push('Locker address is required')
    } else if (!addressPattern.test(addresses.locker)) {
      errors.push('Locker address format is invalid')
    } else if (addresses.locker === zeroAddress) {
      errors.push('Locker cannot be zero address')
    }

    // Validate Team 1
    if (!addresses.team1) {
      errors.push('Team 1 address is required')
    } else if (!addressPattern.test(addresses.team1)) {
      errors.push('Team 1 address format is invalid')
    } else if (addresses.team1 === zeroAddress) {
      errors.push('Team 1 cannot be zero address')
    }

    // Validate Team 2
    if (!addresses.team2) {
      errors.push('Team 2 address is required')
    } else if (!addressPattern.test(addresses.team2)) {
      errors.push('Team 2 address format is invalid')
    } else if (addresses.team2 === zeroAddress) {
      errors.push('Team 2 cannot be zero address')
    }

    // Validate Dev
    if (!addresses.dev) {
      errors.push('Dev address is required')
    } else if (!addressPattern.test(addresses.dev)) {
      errors.push('Dev address format is invalid')
    } else if (addresses.dev === zeroAddress) {
      errors.push('Dev cannot be zero address')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Validate complete farm update
   */
  static validateFarmUpdate(
    farmAddress: string,
    addresses: FarmUpdateAddresses
  ): FarmValidationResult {
    const errors: string[] = []

    // Validate farm address
    const addressCheck = this.validateAddress(farmAddress)
    if (!addressCheck.isValid) {
      errors.push(addressCheck.error!)
    }

    // Validate fee addresses
    const feeAddressCheck = this.validateAddresses(addresses)
    if (!feeAddressCheck.isValid) {
      errors.push(...feeAddressCheck.errors)
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // ==================== COMPARISON ====================

  /**
   * Check if fee addresses have changed
   */
  static haveAddressesChanged(
    currentAddresses: FarmFeeAddresses | null,
    newAddresses: FarmUpdateAddresses
  ): boolean {
    if (!currentAddresses) return true
    
    return (
      currentAddresses.burn !== newAddresses.burn ||
      currentAddresses.locker !== newAddresses.locker ||
      currentAddresses.team1 !== newAddresses.team1 ||
      currentAddresses.team2 !== newAddresses.team2 ||
      currentAddresses.dev !== newAddresses.dev
    )
  }

  // ==================== FORMATTING ====================

  /**
   * Format address for display (shortened)
   */
  static formatAddress(address: string, startChars: number = 6, endChars: number = 4): string {
    if (!address || address.length < startChars + endChars) return address
    return `${address.slice(0, startChars + 2)}...${address.slice(-endChars)}`
  }

  /**
   * Format large numbers with commas and decimals
   */
  static formatNumber(value: string | number, decimals: number = 2): string {
    const num = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(num)) return '0'
    
    if (num >= 1e9) {
      return `${(num / 1e9).toFixed(decimals)}B`
    }
    if (num >= 1e6) {
      return `${(num / 1e6).toFixed(decimals)}M`
    }
    if (num >= 1e3) {
      return `${(num / 1e3).toFixed(decimals)}K`
    }
    
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })
  }

  /**
   * Format token amount with proper decimals
   */
  static formatTokenAmount(amount: string | number, decimals: number = 9): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount
    const divisor = Math.pow(10, decimals)
    const formatted = num / divisor
    
    return this.formatNumber(formatted, 2)
  }

  /**
   * Format APR as percentage
   */
  static formatAPR(apr: number): string {
    if (isNaN(apr) || apr === 0) return '0%'
    if (apr < 0.01) return '<0.01%'
    return `${apr.toFixed(2)}%`
  }

  /**
   * Format timestamp to readable date
   */
  static formatDate(timestamp: number | string): string {
    const ts = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp
    const date = new Date(ts * 1000)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  /**
   * Format time remaining
   */
  static formatTimeRemaining(endTime: number): string {
    const now = Date.now() / 1000
    const remaining = endTime - now
    
    if (remaining <= 0) return 'Ended'
    
    const days = Math.floor(remaining / 86400)
    const hours = Math.floor((remaining % 86400) / 3600)
    const minutes = Math.floor((remaining % 3600) / 60)
    
    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  // ==================== CALCULATIONS ====================

  /**
   * Calculate APR for a pool
   */
  static calculateAPR(
    rewardPerSecond: string,
    totalStaked: string,
    rewardTokenPrice: number,
    stakingTokenPrice: number,
    rewardDecimals: number = 9,
    stakingDecimals: number = 9
  ): number {
    try {
      const rewardPerSec = parseFloat(rewardPerSecond) / Math.pow(10, rewardDecimals)
      const staked = parseFloat(totalStaked) / Math.pow(10, stakingDecimals)
      
      if (staked === 0) return 0
      
      const secondsPerYear = 31536000
      const rewardPerYear = rewardPerSec * secondsPerYear
      
      const tvlUSD = staked * stakingTokenPrice
      
      const apr = ((rewardPerYear * rewardTokenPrice) / tvlUSD) * 100
      
      return Math.round(apr * 100) / 100
    } catch (error) {
      console.error('Error calculating APR:', error)
      return 0
    }
  }

  /**
   * Calculate daily rewards
   */
  static calculateDailyRewards(
    rewardPerSecond: string,
    decimals: number = 9
  ): number {
    try {
      const rewardPerSec = parseFloat(rewardPerSecond) / Math.pow(10, decimals)
      const secondsPerDay = 86400
      return rewardPerSec * secondsPerDay
    } catch {
      return 0
    }
  }

  /**
   * Calculate total rewards for period
   */
  static calculateTotalRewards(
    rewardPerSecond: string,
    startTime: number,
    endTime: number,
    decimals: number = 9
  ): number {
    try {
      const rewardPerSec = parseFloat(rewardPerSecond) / Math.pow(10, decimals)
      const duration = endTime - startTime
      return rewardPerSec * duration
    } catch {
      return 0
    }
  }

  // ==================== STATUS CHECKS ====================

  /**
   * Check if pool is active
   */
  static isPoolActive(
    poolActive: boolean,
    farmPaused: boolean
  ): boolean {
    return poolActive && !farmPaused
  }

  /**
   * Check if farm is active
   */
  static isFarmActive(
    isPaused: boolean,
    startTime: number,
    endTime: number
  ): boolean {
    const now = Date.now() / 1000
    return !isPaused && now >= startTime && now <= endTime
  }

  /**
   * Check if farm has started
   */
  static hasFarmStarted(startTime: number): boolean {
    const now = Date.now() / 1000
    return now >= startTime
  }

  /**
   * Check if farm has ended
   */
  static hasFarmEnded(endTime: number): boolean {
    const now = Date.now() / 1000
    return now > endTime
  }

  /**
   * Get farm status string
   */
  static getFarmStatus(
    isPaused: boolean,
    startTime: number,
    endTime: number
  ): 'active' | 'paused' | 'ended' | 'upcoming' {
    if (isPaused) return 'paused'
    if (this.hasFarmEnded(endTime)) return 'ended'
    if (!this.hasFarmStarted(startTime)) return 'upcoming'
    return 'active'
  }

  // ==================== TOKEN EXTRACTION ====================

  /**
   * Extract token symbol from type string
   */
  static extractTokenSymbol(tokenType: string): string {
    if (!tokenType) return 'UNKNOWN'
    
    if (tokenType.includes('LPCoin')) {
      const match = tokenType.match(/LPCoin<([^,]+),\s*([^>]+)>/)
      if (match) {
        const token1 = this.extractTokenSymbol(match[1])
        const token2 = this.extractTokenSymbol(match[2])
        return `${token1}-${token2}`
      }
    }
    
    const parts = tokenType.split('::')
    const lastPart = parts[parts.length - 1]
    return lastPart?.toUpperCase() || 'UNKNOWN'
  }

  /**
   * Extract token name from type string
   */
  static extractTokenName(tokenType: string): string {
    if (!tokenType) return 'Unknown Token'
    const symbol = this.extractTokenSymbol(tokenType)
    
    const tokenNames: Record<string, string> = {
      'SUI': 'Sui',
      'VICTORY': 'Victory Token',
      'USDC': 'USD Coin',
      'USDT': 'Tether',
      'WETH': 'Wrapped Ether'
    }
    
    return tokenNames[symbol] || symbol
  }

  /**
   * Create display name for pool
   */
  static createPoolDisplayName(poolType: string): string {
    const symbol = this.extractTokenSymbol(poolType)
    
    if (poolType.includes('LPCoin')) {
      return `${symbol} LP`
    }
    
    return symbol
  }

  /**
   * Create display name for farm (legacy)
   */
  static createFarmDisplayName(stakingToken: string, rewardToken: string): string {
    const stakingSymbol = this.extractTokenSymbol(stakingToken)
    const rewardSymbol = this.extractTokenSymbol(rewardToken)
    return `${stakingSymbol} → ${rewardSymbol}`
  }

  // ==================== ERROR HANDLING ====================

  /**
   * Get user-friendly error message from blockchain error
   */
  static getErrorMessage(error: any): string {
    if (typeof error === 'string') return error
    
    const message = error?.message || ''
    
    if (message.includes('ERROR_NOT_ADMIN')) {
      return 'Only farm admin can perform this operation'
    }
    if (message.includes('ERROR_ZERO_ADDRESS')) {
      return 'Cannot use zero address'
    }
    if (message.includes('ERROR_POOL_NOT_FOUND')) {
      return 'Pool not found'
    }
    if (message.includes('ERROR_POOL_EXISTS')) {
      return 'Pool already exists'
    }
    if (message.includes('ERROR_INACTIVE_POOL')) {
      return 'Pool is not active'
    }
    if (message.includes('ERROR_INVALID_FEE')) {
      return 'Invalid fee amount'
    }
    if (message.includes('ERROR_FARM_PAUSED')) {
      return 'Farm is currently paused'
    }
    if (message.includes('ERROR_EMISSIONS_NOT_INITIALIZED')) {
      return 'Emissions not initialized'
    }
    if (message.includes('ERROR_EMISSIONS_PAUSED')) {
      return 'Emissions are paused'
    }
    if (message.includes('ERROR_EMISSIONS_ENDED')) {
      return 'Emissions have ended'
    }
    if (message.includes('ERROR_INSUFFICIENT_BALANCE')) {
      return 'Insufficient balance'
    }
    if (message.includes('ERROR_NO_REWARDS')) {
      return 'No rewards available'
    }
    if (message.includes('ERROR_MIN_STAKE_DURATION')) {
      return 'Minimum stake duration not met'
    }
    if (message.includes('ERROR_CLAIM_TOO_FREQUENT')) {
      return 'Please wait before claiming again'
    }
    
    if (message.includes('rejected')) {
      return 'Transaction was rejected by user'
    }
    if (message.includes('insufficient funds')) {
      return 'Insufficient funds for transaction'
    }
    
    return message || 'An unknown error occurred'
  }

  // ==================== SORTING & FILTERING ====================

  /**
   * Sort pools by TVL
   */
  static sortByTVL(pools: any[], descending: boolean = true): any[] {
    return [...pools].sort((a, b) => {
      const tvlA = parseFloat(a.tvl || '0')
      const tvlB = parseFloat(b.tvl || '0')
      return descending ? tvlB - tvlA : tvlA - tvlB
    })
  }

  /**
   * Sort pools by APR
   */
  static sortByAPR(pools: any[], descending: boolean = true): any[] {
    return [...pools].sort((a, b) => {
      return descending ? b.apr - a.apr : a.apr - b.apr
    })
  }

  /**
   * Filter active pools only
   */
  static filterActivePools(pools: any[]): any[] {
    return pools.filter(pool => pool.active)
  }

  /**
   * Filter LP pools only
   */
  static filterLPPools(pools: any[]): any[] {
    return pools.filter(pool => pool.isLPToken)
  }

  /**
   * Filter single token pools only
   */
  static filterSinglePools(pools: any[]): any[] {
    return pools.filter(pool => !pool.isLPToken)
  }

  // ==================== UTILITIES ====================

  /**
   * Hash string to consistent short ID
   */
  static hashString(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash).toString(16).padStart(8, '0')
  }

  /**
   * Parse token type from full path
   */
  static parseTokenType(fullType: string): { package: string; module: string; struct: string } {
    const parts = fullType.split('::')
    if (parts.length >= 3) {
      return {
        package: parts[0],
        module: parts[1],
        struct: parts.slice(2).join('::')
      }
    }
    return { package: '', module: '', struct: fullType }
  }
}