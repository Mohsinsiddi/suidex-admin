// utils/poolUtils.ts
import type { Pool, CreatePoolForm, FarmData } from '../types/pool'
import { Transaction } from '@mysten/sui/transactions'
import { CONSTANTS } from '../constants'

// Parse type name to extract token information
export const parseTypeName = (typeName: string) => {
  // Add null/undefined check
  if (!typeName || typeof typeName !== 'string') {
    console.warn('Invalid typeName provided to parseTypeName:', typeName)
    return {
      type: 'Single' as const,
      singleToken: 'UNKNOWN',
      name: 'Unknown Token'
    }
  }

  // Check if it's an LP token
  if (typeName.includes('LPCoin<')) {
    const match = typeName.match(/LPCoin<(.+),(.+)>/)
    if (match) {
      const token0 = extractTokenName(match[1])
      const token1 = extractTokenName(match[2])
      return {
        type: 'LP' as const,
        token0,
        token1,
        name: `${token0}/${token1} LP`
      }
    }
  }
  
  // Single asset token
  const tokenName = extractTokenName(typeName)
  return {
    type: 'Single' as const,
    singleToken: tokenName,
    name: `${tokenName} Single Asset`
  }
}

// Extract readable token name from type string
export const extractTokenName = (typeString: string): string => {
  if (!typeString || typeof typeString !== 'string') {
    return 'UNKNOWN'
  }
  
  const parts = typeString.split('::')
  if (parts.length >= 3) {
    return parts[2] // Get the token name part
  }
  return typeString
}

// Check if pair involves SUI (native pair)
export const isNativePair = (typeName: string): boolean => {
  if (!typeName || typeof typeName !== 'string') {
    return false
  }
  return typeName.includes('0000000000000000000000000000000000000000000000000000000000000002::sui::SUI')
}

// Format token amount for display
export const formatTokenAmount = (amount: string): string => {
  if (!amount) return '0.00'
  
  try {
    const num = parseFloat(amount.toString()) / 1e9 // Assuming 9 decimals
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B'
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M'
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K'
    return num.toFixed(2)
  } catch (error) {
    console.warn('Error formatting token amount:', amount, error)
    return '0.00'
  }
}

// Calculate APY based on allocation points
export const calculateAPY = (allocationPoints: string | number, totalAllocationPoints: string | number): string => {
  try {
    const allocation = typeof allocationPoints === 'string' ? parseInt(allocationPoints) : allocationPoints
    const total = typeof totalAllocationPoints === 'string' ? parseInt(totalAllocationPoints) : totalAllocationPoints
    
    if (total === 0 || isNaN(allocation) || isNaN(total)) return '0%'
    
    // Simple APY calculation based on allocation percentage
    // This is a placeholder - replace with actual APY calculation logic
    const percentage = (allocation / total) * 100
    const estimatedAPY = percentage * 2 // Rough estimate
    return estimatedAPY.toFixed(1) + '%'
  } catch (error) {
    console.warn('Error calculating APY:', allocationPoints, totalAllocationPoints, error)
    return '0%'
  }
}

// Function to validate token type format
export const validateTokenType = (tokenType: string): boolean => {
  if (!tokenType) return false
  
  // Check for basic format: address::module::type
  const parts = tokenType.split('::')
  if (parts.length !== 3) return false
  
  // Check address format (starts with 0x and has hex characters)
  const address = parts[0]
  if (!address.startsWith('0x') || address.length < 3) return false
  
  // Check module and type names (should be valid identifiers)
  const module = parts[1]
  const type = parts[2]
  if (!module || !type) return false
  
  return true
}

// Function to calculate fee percentage from basis points
export const bpToPercentage = (bp: number): string => {
  return (bp / 100).toFixed(2) + '%'
}

// Function to validate fee ranges (max 10% = 1000 bp)
export const validateFee = (fee: number): boolean => {
  return fee >= 0 && fee <= 1000
}

// Pool status helper functions
export const getPoolStatusColor = (isActive: boolean): string => {
  return isActive 
    ? 'bg-green-500/20 text-green-400' 
    : 'bg-red-500/20 text-red-400'
}

export const getPoolTypeColor = (type: 'LP' | 'Single'): string => {
  return type === 'LP' 
    ? 'bg-blue-500/20 text-blue-400' 
    : 'bg-purple-500/20 text-purple-400'
}

// Extract the full type string from pool
export const getPoolTypeString = (pool: Pool): string => {
  // Return the original type name which contains the full type information
  return pool.typeName
}

// Contract interaction helpers
export const buildCreatePoolTransaction = (
  poolType: 'LP' | 'Single',
  params: CreatePoolForm
) => {
  const { token0, token1, singleToken, allocationPoints, depositFee, withdrawalFee, isNativePair } = params

  const tx = new Transaction()

  if (poolType === 'LP') {
    tx.moveCall({
      target: `${CONSTANTS.PACKAGE_ID}::${CONSTANTS.MODULES.FARM}::create_lp_pool`,
      arguments: [
        tx.object(CONSTANTS.FARM_ID),
        tx.pure.u256(allocationPoints),
        tx.pure.u256(depositFee),
        tx.pure.u256(withdrawalFee),
        tx.pure.bool(isNativePair),
        tx.object(CONSTANTS.ADMIN_CAP_ID),
        tx.object(CONSTANTS.CLOCK_ID)
      ],
      typeArguments: [token0!, token1!]
    })
  } else {
    tx.moveCall({
      target: `${CONSTANTS.PACKAGE_ID}::${CONSTANTS.MODULES.FARM}::create_single_asset_pool`,
      arguments: [
        tx.object(CONSTANTS.FARM_ID),
        tx.pure.u256(allocationPoints),
        tx.pure.u256(depositFee),
        tx.pure.u256(withdrawalFee),
        tx.pure.bool(isNativePair),
        tx.object(CONSTANTS.ADMIN_CAP_ID),
        tx.object(CONSTANTS.CLOCK_ID)
      ],
      typeArguments: [singleToken!]
    })
  }

  return tx
}

export const buildUpdatePoolTransaction = (pool: Pool, newParams: any) => {
  // For updates, we need to use the original type string from the pool
  const typeArgument = getPoolTypeString(pool)
  
  console.log('Building update transaction for pool:', pool.name)
  console.log('Pool type:', pool.type)
  console.log('Type argument:', typeArgument)
  console.log('New parameters:', newParams)

  const tx = new Transaction()

  tx.moveCall({
    target: `${CONSTANTS.PACKAGE_ID}::${CONSTANTS.MODULES.FARM}::update_pool_config`,
    arguments: [
      tx.object(CONSTANTS.FARM_ID),
      tx.pure.u256(newParams.allocationPoints),
      tx.pure.u256(newParams.depositFee),
      tx.pure.u256(newParams.withdrawalFee),
      tx.pure.bool(newParams.isActive),
      tx.object(CONSTANTS.ADMIN_CAP_ID),
      tx.object(CONSTANTS.GLOBAL_EMISSION_CONTROLLER_ID),
      tx.object(CONSTANTS.CLOCK_ID)
    ],
    typeArguments: [typeArgument] // Use the full type string as single type argument
  })

  return tx
}

// Helper function to extract type name from dynamic field response
export const extractTypeNameFromDynamicField = (dynamicField: any): string => {
  try {
    // Handle the actual structure from the API response
    if (dynamicField?.name?.value?.name) {
      return dynamicField.name.value.name
    }
    
    // Fallback to other possible structures
    if (dynamicField?.name?.name) {
      return dynamicField.name.name
    }
    
    if (typeof dynamicField?.name === 'string') {
      return dynamicField.name
    }
    
    console.warn('Could not extract type name from dynamic field:', dynamicField)
    return ''
  } catch (error) {
    console.error('Error extracting type name from dynamic field:', error)
    return ''
  }
}

// Enhanced pool update verification helpers
export const comparePoolStates = (original: Pool, updated: Pool): boolean => {
  return (
    original.allocationPoints === updated.allocationPoints &&
    original.depositFee === updated.depositFee &&
    original.withdrawalFee === updated.withdrawalFee &&
    original.isActive === updated.isActive
  )
}

export const getPoolUpdateDifferences = (original: Pool, updated: Pool) => {
  const differences: string[] = []
  
  if (original.allocationPoints !== updated.allocationPoints) {
    differences.push(`Allocation Points: ${original.allocationPoints} → ${updated.allocationPoints}`)
  }
  
  if (original.depositFee !== updated.depositFee) {
    differences.push(`Deposit Fee: ${original.depositFee}BP → ${updated.depositFee}BP`)
  }
  
  if (original.withdrawalFee !== updated.withdrawalFee) {
    differences.push(`Withdrawal Fee: ${original.withdrawalFee}BP → ${updated.withdrawalFee}BP`)
  }
  
  if (original.isActive !== updated.isActive) {
    differences.push(`Status: ${original.isActive ? 'Active' : 'Inactive'} → ${updated.isActive ? 'Active' : 'Inactive'}`)
  }
  
  return differences
}

// Validate update parameters
export const validateUpdateParams = (params: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []
  
  if (!params.allocationPoints || params.allocationPoints <= 0) {
    errors.push('Allocation points must be greater than 0')
  }
  
  if (params.depositFee < 0 || params.depositFee > 1000) {
    errors.push('Deposit fee must be between 0-1000 basis points (0-10%)')
  }
  
  if (params.withdrawalFee < 0 || params.withdrawalFee > 1000) {
    errors.push('Withdrawal fee must be between 0-1000 basis points (0-10%)')
  }
  
  if (typeof params.isActive !== 'boolean') {
    errors.push('Active status must be a boolean value')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Transaction status helpers
export const getTransactionExplorerUrl = (txDigest: string, network: string = 'testnet'): string => {
  // Adjust this URL based on your network (mainnet/testnet/devnet)
  const baseUrl = network === 'mainnet' ? 'https://suiexplorer.com' : `https://suiexplorer.com`
  return `${baseUrl}/txblock/${txDigest}?network=${network}`
}

export const formatUpdateSuccessMessage = (poolName: string, differences: string[]): string => {
  if (differences.length === 0) {
    return `Pool "${poolName}" updated successfully!`
  }
  
  return `Pool "${poolName}" updated successfully with ${differences.length} change${differences.length > 1 ? 's' : ''}:\n${differences.join('\n')}`
}

// Gas estimation helpers
export const getEstimatedGasCost = (): string => {
  // Rough estimate for pool operations
  return '~0.01 SUI'
}

// Pool management utilities
export const sortPoolsByAllocation = (pools: Pool[]): Pool[] => {
  return [...pools].sort((a, b) => b.allocationPoints - a.allocationPoints)
}

export const filterActivePoolsOnly = (pools: Pool[]): Pool[] => {
  return pools.filter(pool => pool.isActive)
}

export const groupPoolsByType = (pools: Pool[]): { lpPools: Pool[]; singlePools: Pool[] } => {
  return {
    lpPools: pools.filter(pool => pool.type === 'LP'),
    singlePools: pools.filter(pool => pool.type === 'Single')
  }
}

// Pool analytics helpers
export const calculateTotalStakedValue = (pools: Pool[]): string => {
  // This would need real token prices for accurate calculation
  // For now, just count total staked amounts
  const totalStaked = pools.reduce((sum, pool) => {
    const staked = parseFloat(pool.totalStaked) || 0
    return sum + staked
  }, 0)
  
  return formatTokenAmount(totalStaked.toString())
}

export const getPoolAllocationPercentage = (pool: Pool, totalAllocation: number): string => {
  if (totalAllocation === 0) return '0%'
  return ((pool.allocationPoints / totalAllocation) * 100).toFixed(2) + '%'
}

// Type guard functions
export const isLPPool = (pool: Pool): boolean => {
  return pool.type === 'LP'
}

export const isSinglePool = (pool: Pool): boolean => {
  return pool.type === 'Single'
}

// Pool search and filtering
export const searchPools = (pools: Pool[], searchTerm: string): Pool[] => {
  const term = searchTerm.toLowerCase()
  return pools.filter(pool => 
    pool.name.toLowerCase().includes(term) ||
    pool.typeName.toLowerCase().includes(term) ||
    (pool.token0 && pool.token0.toLowerCase().includes(term)) ||
    (pool.token1 && pool.token1.toLowerCase().includes(term)) ||
    (pool.singleToken && pool.singleToken.toLowerCase().includes(term))
  )
}

// Error handling helpers
export const getPoolOperationErrorMessage = (error: any): string => {
  if (typeof error === 'string') return error
  
  if (error?.message) {
    if (error.message.includes('Insufficient')) {
      return 'Insufficient funds for transaction fees'
    }
    if (error.message.includes('rejected')) {
      return 'Transaction was rejected by user'
    }
    if (error.message.includes('ERROR_NOT_ADMIN')) {
      return 'Only admin can perform this operation'
    }
    if (error.message.includes('ERROR_POOL_EXISTS')) {
      return 'Pool already exists for this token type'
    }
    if (error.message.includes('ERROR_INVALID_FEE')) {
      return 'Invalid fee amount (must be 0-1000 basis points)'
    }
    if (error.message.includes('ERROR_POOL_NOT_FOUND')) {
      return 'Pool not found'
    }
    
    return error.message
  }
  
  return 'An unknown error occurred'
}