// types/pairTypes.ts

/**
 * Type definitions for pair operations
 */

export interface PairLookupResult {
  exists: boolean
  pairAddress?: string
  token0Type: string
  token1Type: string
  token0Name: string
  token1Name: string
  pairDisplayName: string
  error?: string
}

export interface PairFeeAddresses {
  pairAddress: string
  team1: string
  team2: string
  dev: string
  locker: string
  buyback: string
}

export interface CommonToken {
  type: string
  name: string
  symbol: string
  decimals?: number
}

export interface PairUpdateAddresses {
  team1: string
  team2: string
  dev: string
  locker: string
  buyback: string
}

export interface PairValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}