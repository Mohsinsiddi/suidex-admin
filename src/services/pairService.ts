// services/pairService.ts

import { Transaction } from '@mysten/sui/transactions'
import { suiClient } from '../utils/suiClient'
import { CONSTANTS } from '../constants'
import { TokenTypeUtils } from '../utils/tokenTypeUtils'
import type{
  PairLookupResult,
  PairFeeAddresses,
  CommonToken,
  PairUpdateAddresses,
  PairValidationResult
} from '../types/pairTypes'

/**
 * Service for pair-specific operations
 * Handles pair lookup, address updates, and validation
 */
export class PairService {
  
  // ==================== PAIR LOOKUP ====================

  /**
   * Look up a pair by its token types using factory's get_pair function
   * This is the main method to find pairs - works with any number of pairs
   */
  static async findPairByTokenTypes(
    token0Type: string,
    token1Type: string
  ): Promise<PairLookupResult> {
    try {
      // Validate token types first
      const validation = TokenTypeUtils.validateTokenPair(token0Type, token1Type)
      if (!validation.isValid) {
        return {
          exists: false,
          token0Type,
          token1Type,
          token0Name: TokenTypeUtils.extractTokenName(token0Type),
          token1Name: TokenTypeUtils.extractTokenName(token1Type),
          pairDisplayName: TokenTypeUtils.createPairDisplayName(token0Type, token1Type),
          error: validation.error
        }
      }

      // Build transaction to call get_pair
      const tx = new Transaction()
      tx.moveCall({
        target: `${CONSTANTS.PACKAGE_ID}::factory::get_pair`,
        typeArguments: [token0Type.trim(), token1Type.trim()],
        arguments: [tx.object(CONSTANTS.FACTORY_ID)]
      })

      // Inspect the transaction (doesn't execute on-chain)
      const result = await suiClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: CONSTANTS.ADMIN
      })

      // Parse the return value - Option<address>
      if (result.results?.[0]?.returnValues?.[0]) {
        const returnData = result.results[0].returnValues[0]
        const bytes = returnData[0]
        
        // Check if Option is Some (tag byte = 1) or None (tag byte = 0)
        if (bytes && bytes.length > 1 && bytes[0] === 1) {
        // Extract address (skip first byte which is the option tag)
        const addressBytes = bytes.slice(1, 33) // Address is 32 bytes
        const pairAddress = '0x' + Array.from(addressBytes).map(b => b.toString(16).padStart(2, '0')).join('')
        
        return {
            exists: true,
            pairAddress,
            token0Type: token0Type.trim(),
            token1Type: token1Type.trim(),
            token0Name: TokenTypeUtils.extractTokenName(token0Type),
            token1Name: TokenTypeUtils.extractTokenName(token1Type),
            pairDisplayName: TokenTypeUtils.createPairDisplayName(token0Type, token1Type)
        }
        }
      }

      // Pair not found
      return {
        exists: false,
        token0Type: token0Type.trim(),
        token1Type: token1Type.trim(),
        token0Name: TokenTypeUtils.extractTokenName(token0Type),
        token1Name: TokenTypeUtils.extractTokenName(token1Type),
        pairDisplayName: TokenTypeUtils.createPairDisplayName(token0Type, token1Type),
        error: validation.shouldSwap 
          ? 'Pair not found. Token types may need to be swapped - try the swap button.'
          : 'Pair not found. Please check the token types are correct.'
      }
    } catch (error: any) {
      console.error('Error finding pair:', error)
      
      // Handle specific errors
      let errorMessage = 'Failed to look up pair'
      if (error?.message?.includes('ERROR_PAIR_NOT_SORTED')) {
        errorMessage = 'Token types are not in sorted order. Use the swap button to reorder them.'
      } else if (error?.message?.includes('type mismatch')) {
        errorMessage = 'Invalid token type format'
      }
      
      return {
        exists: false,
        token0Type: token0Type.trim(),
        token1Type: token1Type.trim(),
        token0Name: TokenTypeUtils.extractTokenName(token0Type),
        token1Name: TokenTypeUtils.extractTokenName(token1Type),
        pairDisplayName: TokenTypeUtils.createPairDisplayName(token0Type, token1Type),
        error: errorMessage
      }
    }
  }

  // ==================== PAIR FEE ADDRESSES ====================

  /**
   * Fetch current fee addresses for a specific pair
   */
  static async fetchPairFeeAddresses(pairAddress: string): Promise<PairFeeAddresses | null> {
    try {
      if (!pairAddress) {
        throw new Error('Pair address is required')
      }

      const pairObject = await suiClient.getObject({
        id: pairAddress,
        options: {
          showContent: true,
          showType: true
        }
      })

      if (!pairObject.data?.content || pairObject.data.content.dataType !== 'moveObject') {
        throw new Error('Invalid pair object or pair not found')
      }

      const fields = (pairObject.data.content as any).fields

      return {
        pairAddress,
        team1: fields.team_1_address || '',
        team2: fields.team_2_address || '',
        dev: fields.dev_address || '',
        locker: fields.locker_address || '',
        buyback: fields.buyback_address || ''
      }
    } catch (error) {
      console.error('Error fetching pair fee addresses:', error)
      return null
    }
  }

  // ==================== TRANSACTION BUILDERS ====================

  /**
   * Build transaction to update pair fee addresses
   * Only factory admin can execute this
   */
  static buildUpdatePairAddressesTransaction(
    pairAddress: string,
    token0Type: string,
    token1Type: string,
    addresses: PairUpdateAddresses
  ): Transaction {
    // Validate all inputs
    const validation = this.validatePairUpdate(pairAddress, token0Type, token1Type, addresses)
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
    }

    // Build the transaction
    const tx = new Transaction()
    
    tx.moveCall({
      target: `${CONSTANTS.PACKAGE_ID}::factory::update_pair_fee_addresses`,
      typeArguments: [token0Type.trim(), token1Type.trim()],
      arguments: [
        tx.object(CONSTANTS.FACTORY_ID),
        tx.object(pairAddress),
        tx.pure.address(addresses.team1),
        tx.pure.address(addresses.team2),
        tx.pure.address(addresses.dev),
        tx.pure.address(addresses.locker),
        tx.pure.address(addresses.buyback)
      ]
    })
    
    return tx
  }

  // ==================== VALIDATION ====================

  /**
   * Validate all inputs for pair address update
   */
  static validatePairUpdate(
    pairAddress: string,
    token0Type: string,
    token1Type: string,
    addresses: PairUpdateAddresses
  ): PairValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Validate pair address
    if (!pairAddress) {
      errors.push('Pair address is required')
    } else if (!/^0x[a-fA-F0-9]+$/.test(pairAddress)) {
      errors.push('Invalid pair address format')
    }

    // Validate token types
    const typeValidation = TokenTypeUtils.validateTokenPair(token0Type, token1Type)
    if (!typeValidation.isValid) {
      errors.push(typeValidation.error || 'Invalid token types')
    }
    if (typeValidation.shouldSwap) {
      warnings.push('Token types may need to be swapped')
    }

    // Validate addresses
    const addressValidation = this.validateAddresses(addresses)
    if (!addressValidation.isValid) {
      errors.push(...addressValidation.errors)
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Validate fee addresses
   */
  static validateAddresses(addresses: PairUpdateAddresses): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    const addressPattern = /^0x[a-fA-F0-9]{64}$/
    const zeroAddress = '0x0000000000000000000000000000000000000000000000000000000000000000'

    // Check each address
    if (!addresses.team1) {
      errors.push('Team 1 address is required')
    } else if (!addressPattern.test(addresses.team1)) {
      errors.push('Team 1 address format is invalid')
    } else if (addresses.team1 === zeroAddress) {
      errors.push('Team 1 cannot be zero address')
    }

    if (!addresses.team2) {
      errors.push('Team 2 address is required')
    } else if (!addressPattern.test(addresses.team2)) {
      errors.push('Team 2 address format is invalid')
    } else if (addresses.team2 === zeroAddress) {
      errors.push('Team 2 cannot be zero address')
    }

    if (!addresses.dev) {
      errors.push('Dev address is required')
    } else if (!addressPattern.test(addresses.dev)) {
      errors.push('Dev address format is invalid')
    } else if (addresses.dev === zeroAddress) {
      errors.push('Dev cannot be zero address')
    }

    if (!addresses.locker) {
      errors.push('Locker address is required')
    } else if (!addressPattern.test(addresses.locker)) {
      errors.push('Locker address format is invalid')
    } else if (addresses.locker === zeroAddress) {
      errors.push('Locker cannot be zero address')
    }

    if (!addresses.buyback) {
      errors.push('Buyback address is required')
    } else if (!addressPattern.test(addresses.buyback)) {
      errors.push('Buyback address format is invalid')
    } else if (addresses.buyback === zeroAddress) {
      errors.push('Buyback cannot be zero address')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // ==================== HELPERS ====================

  /**
   * Get list of common tokens for quick selection
   */
  /**
 * Get list of common tokens for quick selection
 */
    static getCommonTokens(): CommonToken[] {
    const tokens: CommonToken[] = []
    
    // Always add SUI
    if (CONSTANTS.SUI?.TYPE) {
        tokens.push({
        type: CONSTANTS.SUI.TYPE,
        name: 'Sui',
        symbol: 'SUI',
        decimals: CONSTANTS.SUI.DECIMALS || 9
        })
    }
    
    // Add Victory token if available
    if (CONSTANTS.VICTORY_TOKEN?.TYPE) {
        tokens.push({
        type: CONSTANTS.VICTORY_TOKEN.TYPE,
        name: 'Victory Token',
        symbol: 'VICTORY',
        decimals: 9
        })
    }
    
    // Return at least SUI or empty array
    return tokens
    }

  /**
   * Format address for display
   */
  static formatAddress(address: string, startChars: number = 6, endChars: number = 4): string {
    if (!address || address.length < startChars + endChars) return address
    return `${address.slice(0, startChars + 2)}...${address.slice(-endChars)}`
  }

  /**
   * Check if addresses have changed
   */
  static haveAddressesChanged(
    currentAddresses: PairFeeAddresses,
    newAddresses: PairUpdateAddresses
  ): boolean {
    return (
      currentAddresses.team1 !== newAddresses.team1 ||
      currentAddresses.team2 !== newAddresses.team2 ||
      currentAddresses.dev !== newAddresses.dev ||
      currentAddresses.locker !== newAddresses.locker ||
      currentAddresses.buyback !== newAddresses.buyback
    )
  }

  /**
   * Get error message from transaction error
   */
  static getErrorMessage(error: any): string {
    if (typeof error === 'string') return error
    
    const message = error?.message || ''
    
    if (message.includes('ERROR_NOT_ADMIN')) {
      return 'Only factory admin can update pair addresses'
    }
    if (message.includes('ERROR_ZERO_ADDRESS')) {
      return 'Cannot use zero address'
    }
    if (message.includes('ERROR_PROTOCOL_PAUSED')) {
      return 'Protocol is currently paused'
    }
    if (message.includes('rejected')) {
      return 'Transaction was rejected'
    }
    
    return message || 'An unknown error occurred'
  }
}