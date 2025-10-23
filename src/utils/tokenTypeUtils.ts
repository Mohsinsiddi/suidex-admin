// utils/tokenTypeUtils.ts

/**
 * Utility functions for handling Sui token types
 * Used for pair lookup and validation
 */

export interface TokenTypeInfo {
  fullType: string
  packageAddress: string
  moduleName: string
  typeName: string
}

export class TokenTypeUtils {
  
  /**
   * Parse a full token type into its components
   * Example: "0x2::sui::SUI" -> { packageAddress: "0x2", moduleName: "sui", typeName: "SUI" }
   */
  static parseTokenType(fullType: string): TokenTypeInfo | null {
    try {
      if (!fullType) return null
      
      const parts = fullType.split('::')
      if (parts.length < 3) return null
      
      return {
        fullType: fullType.trim(),
        packageAddress: parts[0],
        moduleName: parts[1],
        typeName: parts.slice(2).join('::') // Handle nested types
      }
    } catch (error) {
      console.error('Error parsing token type:', error)
      return null
    }
  }

  /**
   * Extract just the token name from full type
   * Example: "0x2::sui::SUI" -> "SUI"
   */
  static extractTokenName(fullType: string): string {
    try {
      if (!fullType) return 'Unknown'
      
      const parts = fullType.split('::')
      return parts[parts.length - 1] || 'Unknown'
    } catch (error) {
      console.error('Error extracting token name:', error)
      return 'Unknown'
    }
  }

  /**
   * Validate token type format
   * Must be: 0xHEX::module::Type
   */
  static validateTokenTypeFormat(tokenType: string): { isValid: boolean; error?: string } {
    if (!tokenType || !tokenType.trim()) {
      return { isValid: false, error: 'Token type is required' }
    }

    const trimmed = tokenType.trim()
    
    // Basic pattern: 0xHEX::word::word (may have generics <>)
    const typePattern = /^0x[a-fA-F0-9]+::\w+::\w+(<.*>)?$/
    
    if (!typePattern.test(trimmed)) {
      return { 
        isValid: false, 
        error: 'Invalid token type format. Expected: 0x...::module::Type' 
      }
    }

    return { isValid: true }
  }

  /**
   * Compare two token types lexicographically
   * Returns true if type1 < type2 (type1 should come first)
   * This mimics the contract's compare_type_names_robust function
   */
  static compareTokenTypes(type1: string, type2: string): number {
    try {
      const parsed1 = this.parseTokenType(type1)
      const parsed2 = this.parseTokenType(type2)
      
      if (!parsed1 || !parsed2) return 0
      
      // Compare package addresses first
      if (parsed1.packageAddress !== parsed2.packageAddress) {
        return parsed1.packageAddress.localeCompare(parsed2.packageAddress)
      }
      
      // Then compare module names
      if (parsed1.moduleName !== parsed2.moduleName) {
        return parsed1.moduleName.localeCompare(parsed2.moduleName)
      }
      
      // Finally compare full types
      return type1.localeCompare(type2)
    } catch (error) {
      console.error('Error comparing token types:', error)
      return 0
    }
  }

  /**
   * Check if token types need to be swapped for proper sorting
   * Returns true if they're in wrong order
   */
  static shouldSwapTokenTypes(token0: string, token1: string): boolean {
    return this.compareTokenTypes(token0, token1) > 0
  }

  /**
   * Sort two token types in the correct order
   * Returns [sortedToken0, sortedToken1]
   */
  static sortTokenTypes(token0: string, token1: string): [string, string] {
    if (this.shouldSwapTokenTypes(token0, token1)) {
      return [token1, token0]
    }
    return [token0, token1]
  }

  /**
   * Validate a pair of token types
   */
  static validateTokenPair(
    token0: string, 
    token1: string
  ): { isValid: boolean; error?: string; shouldSwap?: boolean } {
    // Validate individual formats
    const validation0 = this.validateTokenTypeFormat(token0)
    if (!validation0.isValid) {
      return { isValid: false, error: `Token0: ${validation0.error}` }
    }

    const validation1 = this.validateTokenTypeFormat(token1)
    if (!validation1.isValid) {
      return { isValid: false, error: `Token1: ${validation1.error}` }
    }

    // Check if identical
    if (token0.trim() === token1.trim()) {
      return { isValid: false, error: 'Token types cannot be identical' }
    }

    // Check if they need swapping
    const shouldSwap = this.shouldSwapTokenTypes(token0, token1)

    return { 
      isValid: true, 
      shouldSwap 
    }
  }

  /**
   * Format token type for display (shorten long addresses)
   */
  static formatTokenTypeForDisplay(fullType: string, maxLength: number = 50): string {
    if (!fullType || fullType.length <= maxLength) return fullType
    
    const parsed = this.parseTokenType(fullType)
    if (!parsed) return fullType
    
    // Shorten package address
    const shortAddr = `${parsed.packageAddress.slice(0, 6)}...${parsed.packageAddress.slice(-4)}`
    return `${shortAddr}::${parsed.moduleName}::${parsed.typeName}`
  }

  /**
   * Create display name for a token pair
   */
  static createPairDisplayName(token0: string, token1: string): string {
    const name0 = this.extractTokenName(token0)
    const name1 = this.extractTokenName(token1)
    return `${name0}/${name1}`
  }
}