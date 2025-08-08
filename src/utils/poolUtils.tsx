// utils/poolUtils.ts
import type { Pool, CreatePoolForm, FarmData } from '../types/pool'
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

// Contract interaction helpers
export const buildCreatePoolTransaction = (
  poolType: 'LP' | 'Single',
  params: CreatePoolForm
) => {
  const { token0, token1, singleToken, allocationPoints, depositFee, withdrawalFee, isNativePair } = params

  if (poolType === 'LP') {
    return {
      target: `${CONSTANTS.PACKAGE_ID}::${CONSTANTS.MODULES.FARM}::create_lp_pool`,
      arguments: [
        CONSTANTS.FARM_ID,
        allocationPoints.toString(),
        depositFee.toString(),
        withdrawalFee.toString(),
        isNativePair,
        CONSTANTS.ADMIN_CAP_ID,
        CONSTANTS.CLOCK_ID
      ],
      typeArguments: [token0, token1]
    }
  } else {
    return {
      target: `${CONSTANTS.PACKAGE_ID}::${CONSTANTS.MODULES.FARM}::create_single_asset_pool`,
      arguments: [
        CONSTANTS.FARM_ID,
        allocationPoints.toString(),
        depositFee.toString(),
        withdrawalFee.toString(),
        isNativePair,
        CONSTANTS.ADMIN_CAP_ID,
        CONSTANTS.CLOCK_ID
      ],
      typeArguments: [singleToken]
    }
  }
}

export const buildUpdatePoolTransaction = (pool: Pool, newParams: any) => {
  return {
    target: `${CONSTANTS.PACKAGE_ID}::${CONSTANTS.MODULES.FARM}::update_pool_config`,
    arguments: [
      CONSTANTS.FARM_ID,
      newParams.allocationPoints.toString(),
      newParams.depositFee.toString(),
      newParams.withdrawalFee.toString(),
      newParams.isActive,
      CONSTANTS.ADMIN_CAP_ID,
      CONSTANTS.GLOBAL_EMISSION_CONTROLLER_ID,
      CONSTANTS.CLOCK_ID
    ],
    typeArguments: [pool.type === 'LP' ? [pool.token0, pool.token1] : [pool.singleToken]]
  }
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