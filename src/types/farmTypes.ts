// types/farmTypes.ts

/**
 * Type definitions for farm management
 * Single farm with multiple pools architecture
 */

// ==================== CORE TYPES ====================

/**
 * Pool information for display
 */
export interface PoolInfo {
  poolId: string
  poolType: string // Full type name
  name: string
  stakingToken: TokenInfo
  tvl: string
  apr: number
  allocationPoints: string
  totalStaked: string
  accRewardPerShare: string
  lastRewardTime: number
  depositFee: string
  withdrawalFee: string
  active: boolean
  isLPToken: boolean
  isNativePair: boolean
  accumulatedDepositFees: string
  accumulatedWithdrawalFees: string
}

/**
 * Pool configuration details
 */
export interface PoolConfig {
  poolType: string
  allocationPoints: string
  depositFee: string
  withdrawalFee: string
  active: boolean
  isLPToken: boolean
  isNativePair: boolean
  totalStaked: string
  accRewardPerShare: string
  lastRewardTime: number
  accumulatedDepositFees: string
  accumulatedWithdrawalFees: string
}

/**
 * Farm-level configuration
 */
export interface FarmConfig {
  farmAddress: string
  admin: string
  isPaused: boolean
  teamAddresses: {
    burn: string
    locker: string
    team1: string
    team2: string
    dev: string
  }
  totalVictoryDistributed: string
  totalLPVictoryDistributed: string
  totalSingleVictoryDistributed: string
  totalAllocationPoints: string
  totalLPAllocationPoints: string
  totalSingleAllocationPoints: string
  emissionStartTimestamp: string
  emissionEndTimestamp: string
  lastUpdateTimestamp: string
}

/**
 * Token information
 */
export interface TokenInfo {
  type: string
  symbol: string
  decimals: number
}

/**
 * Farm-wide statistics
 */
export interface FarmStats {
  totalPools: number
  activePools: number
  pausedPools: number
  lpPools: number
  singlePools: number
  totalValueLocked: string
  totalVictoryDistributed: string
  totalLPVictoryDistributed: string
  totalSingleVictoryDistributed: string
  averageAPR: number
  farmPaused: boolean
}

// ==================== ADDRESS MANAGEMENT ====================

/**
 * Farm fee recipient addresses
 */
export interface FarmFeeAddresses {
  farmAddress: string
  burn: string
  locker: string
  team1: string
  team2: string
  dev: string
}

/**
 * Updated addresses for transaction
 */
export interface FarmUpdateAddresses {
  burn: string
  locker: string
  team1: string
  team2: string
  dev: string
}

// ==================== LOOKUP & SEARCH ====================

/**
 * Result of pool lookup operation
 */
export interface PoolLookupResult {
  exists: boolean
  poolInfo?: PoolInfo
  error?: string
}

/**
 * Filters for searching pools
 */
export interface PoolSearchFilters {
  status?: 'all' | 'active' | 'paused'
  tokenType?: 'all' | 'lp' | 'single'
  stakingToken?: string
  minAPR?: number
  minTVL?: string
}

// ==================== VALIDATION ====================

/**
 * Validation result
 */
export interface FarmValidationResult {
  isValid: boolean
  errors: string[]
}

/**
 * Address validation result
 */
export interface AddressValidationResult {
  isValid: boolean
  error?: string
}

// ==================== EVENTS ====================

/**
 * Farm admin events
 */
export interface FarmEvent {
  type: string
  timestamp: number
  data: any
}

/**
 * Pool created event
 */
export interface PoolCreatedEvent {
  pool_type: string
  allocation_points: string
  deposit_fee: string
  withdrawal_fee: string
  is_native_pair: boolean
  is_lp_token: boolean
}

/**
 * Pool config updated event
 */
export interface PoolConfigUpdatedEvent {
  pool_type: string
  old_allocation_points: string
  new_allocation_points: string
  old_deposit_fee: string
  new_deposit_fee: string
  old_withdrawal_fee: string
  new_withdrawal_fee: string
  old_active: boolean
  new_active: boolean
  timestamp: number
}

/**
 * Admin addresses updated event
 */
export interface AdminAddressesUpdatedEvent {
  old_burn_address: string
  new_burn_address: string
  old_locker_address: string
  new_locker_address: string
  old_team_1_address: string
  new_team_1_address: string
  old_team_2_address: string
  new_team_2_address: string
  old_dev_address: string
  new_dev_address: string
  timestamp: number
}

/**
 * Farm pause state changed event
 */
export interface FarmPauseStateChangedEvent {
  old_paused: boolean
  new_paused: boolean
  admin: string
  timestamp: number
}

// ==================== USER STAKING ====================

/**
 * User staking position
 */
export interface StakingPosition {
  id: string
  owner: string
  poolType: string
  amount: string
  initialStakeTimestamp: number
  vaultId: string
}

/**
 * User staker info in pool
 */
export interface StakerInfo {
  amount: string
  rewardDebt: string
  rewardsClaimed: string
  lastStakeTimestamp: number
  lastClaimTimestamp: number
}

// ==================== EMISSION INFO ====================

/**
 * Emission configuration info
 */
export interface EmissionInfo {
  isInitialized: boolean
  isActive: boolean
  isPaused: boolean
  currentWeek: number
  emissionStartTimestamp: number
  emissionEndTimestamp: number
  currentTimestamp: number
}

/**
 * Current emission allocations
 */
export interface EmissionAllocations {
  lpAllocation: string
  singleAllocation: string
  isActive: boolean
  currentWeek: number
}

// ==================== POOL CREATION ====================

/**
 * Parameters for creating a new pool
 */
export interface CreatePoolParams {
  poolType: string
  allocationPoints: string
  depositFee: string
  withdrawalFee: string
  isNativePair: boolean
  isLPToken: boolean
}

/**
 * Parameters for updating pool config
 */
export interface UpdatePoolConfigParams {
  poolType: string
  allocationPoints: string
  depositFee: string
  withdrawalFee: string
  active: boolean
}

// ==================== REWARD CALCULATION ====================

/**
 * Pending rewards for a user
 */
export interface PendingRewards {
  poolType: string
  amount: string
  formatted: string
}

/**
 * APR calculation data
 */
export interface APRData {
  poolType: string
  rewardPerSecond: string
  totalStaked: string
  victoryPrice: number
  stakingTokenPrice: number
  apr: number
}