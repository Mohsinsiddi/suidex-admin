// utils/tokenUtils.ts
import { Transaction } from '@mysten/sui/transactions'
import { suiClient } from './suiClient'
import { CONSTANTS } from '../constants'

export interface VaultInfo {
  id: string
  name: string
  balance: string
  description: string
  canDeposit: boolean
  canSweep: boolean
  icon: string
  color: string
  objectId?: string
}

export interface TokenStats {
  totalSupply: string
  circulatingSupply: string
  farmVaultBalance: string
  lockerRewardVaultBalance: string
  lockerLockedVaultBalance: string
  suiRewardVaultBalance: string
  treasuryBalance: string
}

export interface VaultObjectIds {
  farmRewardVaultId?: string
  lockerRewardVaultId?: string
  lockerLockedVaultId?: string
  suiRewardVaultId?: string
}

// Convert Victory amount to mist (6 decimals)
export const victoryToMist = (amount: string): string => {
  const num = parseFloat(amount)
  return (BigInt(Math.floor(num * 1e6))).toString()
}

// Convert mist to Victory amount (6 decimals)  
export const mistToVictory = (mist: string): string => {
  const num = BigInt(mist)
  return (Number(num) / 1e6).toString()
}

// Convert SUI amount from mist (9 decimals)
export const mistToSui = (mist: string): string => {
  const num = BigInt(mist)
  return (Number(num) / 1e9).toString()
}

// Format token amounts for display
export const formatTokenAmount = (amount: string | number): string => {
  if (!amount) return '0.00'
  
  try {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B'
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M'
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K'
    return num.toFixed(2)
  } catch (error) {
    console.warn('Error formatting token amount:', amount, error)
    return '0.00'
  }
}

// Calculate percentage distribution
export const calculatePercentage = (part: string | number, total: string | number): string => {
  try {
    const partNum = typeof part === 'string' ? parseFloat(part) : part
    const totalNum = typeof total === 'string' ? parseFloat(total) : total
    
    if (totalNum === 0 || isNaN(partNum) || isNaN(totalNum)) return '0.0'
    
    return ((partNum / totalNum) * 100).toFixed(1)
  } catch (error) {
    console.warn('Error calculating percentage:', part, total, error)
    return '0.0'
  }
}

// Validate Victory token amount (6 decimals)
export const validateVictoryAmount = (amount: string): { isValid: boolean; error?: string } => {
  if (!amount || amount.trim() === '') {
    return { isValid: false, error: 'Amount is required' }
  }
  
  const num = parseFloat(amount)
  if (isNaN(num)) {
    return { isValid: false, error: 'Invalid number format' }
  }
  
  if (num <= 0) {
    return { isValid: false, error: 'Amount must be greater than 0' }
  }
  
  if (num > 1e9) {
    return { isValid: false, error: 'Amount too large' }
  }
  
  // Check decimal places (max 6 for Victory token)
  const decimalPlaces = (amount.split('.')[1] || '').length
  if (decimalPlaces > 6) {
    return { isValid: false, error: 'Maximum 6 decimal places allowed' }
  }
  
  return { isValid: true }
}

// Validate Sui address format
export const validateSuiAddress = (address: string): { isValid: boolean; error?: string } => {
  if (!address || address.trim() === '') {
    return { isValid: false, error: 'Address is required' }
  }
  
  const cleanAddress = address.trim()
  
  if (!cleanAddress.startsWith('0x')) {
    return { isValid: false, error: 'Address must start with 0x' }
  }
  
  if (cleanAddress.length !== 66) {
    return { isValid: false, error: 'Address must be 66 characters long' }
  }
  
  // Check if it contains only valid hex characters
  const hexPattern = /^0x[0-9a-fA-F]{64}$/
  if (!hexPattern.test(cleanAddress)) {
    return { isValid: false, error: 'Address contains invalid characters' }
  }
  
  return { isValid: true }
}

// Get user's Victory token coins
export const getUserVictoryCoins = async (userAddress: string) => {
  try {
    const coins = await suiClient.getCoins({
      owner: userAddress,
      coinType: CONSTANTS.VICTORY_TOKEN.TYPE,
    })
    return coins.data
  } catch (error) {
    console.error('Error fetching user Victory coins:', error)
    return []
  }
}

// Calculate total user Victory balance
export const calculateUserVictoryBalance = (coins: any[]): string => {
  const total = coins.reduce((sum, coin) => sum + BigInt(coin.balance), BigInt(0))
  return mistToVictory(total.toString())
}

// Fetch vault object IDs (using static constants)
export const fetchVaultObjectIds = async (): Promise<VaultObjectIds> => {
  try {
    const vaultIds: VaultObjectIds = {
      farmRewardVaultId: CONSTANTS.VAULT_IDS.FARM_REWARD_VAULT_ID,
      lockerRewardVaultId: CONSTANTS.VAULT_IDS.LOCKER_REWARD_VAULT_ID,
      lockerLockedVaultId: CONSTANTS.VAULT_IDS.LOCKER_LOCKED_VAULT_ID,
      suiRewardVaultId: CONSTANTS.VAULT_IDS.SUI_REWARD_VAULT_ID
    }

    console.log('Vault IDs loaded:', vaultIds)
    return vaultIds
  } catch (error) {
    console.error('Error with vault object IDs:', error)
    return {
      farmRewardVaultId: CONSTANTS.VAULT_IDS.FARM_REWARD_VAULT_ID,
      lockerRewardVaultId: CONSTANTS.VAULT_IDS.LOCKER_REWARD_VAULT_ID,
      lockerLockedVaultId: CONSTANTS.VAULT_IDS.LOCKER_LOCKED_VAULT_ID,
      suiRewardVaultId: CONSTANTS.VAULT_IDS.SUI_REWARD_VAULT_ID
    }
  }
}

// Fetch vault balance from a specific vault object
export const fetchVaultBalance = async (vaultId: string, isVictoryVault: boolean = true): Promise<string> => {
  try {
    if (!vaultId) {
      return '0'
    }

    const vaultObject = await suiClient.getObject({
      id: vaultId,
      options: { 
        showContent: true,
        showType: true
      }
    })

    if (vaultObject.error) {
      console.error('Vault object error:', vaultId, vaultObject.error)
      return '0'
    }

    if (vaultObject.data?.content && 'fields' in vaultObject.data.content) {
      const fields = vaultObject.data.content.fields as any
      const vaultType = vaultObject.data.type
      
      console.log('Vault structure:', { 
        vaultId, 
        vaultType,
        fields
      })
      
      let balance = '0'
      
      // Determine balance field based on vault type
      if (vaultType?.includes('::farm::RewardVault')) {
        // Farm Vault: victory_balance field
        balance = fields.victory_balance || '0'
      } else if (vaultType?.includes('::victory_token_locker::VictoryRewardVault')) {
        // Locker Reward Vault: victory_balance field
        balance = fields.victory_balance || '0'
      } else if (vaultType?.includes('::victory_token_locker::LockedTokenVault')) {
        // Locker Locked Vault: locked_balance field
        balance = fields.locked_balance || '0'
      } else if (vaultType?.includes('::victory_token_locker::SUIRewardVault')) {
        // SUI Reward Vault: sui_balance field
        balance = fields.sui_balance || '0'
      } else {
        // Fallback: try common field names
        balance = fields.victory_balance || fields.locked_balance || fields.sui_balance || fields.balance || '0'
      }

      console.log('Vault balance extracted:', { 
        vaultId, 
        vaultType,
        balance,
        balanceFormatted: isVictoryVault ? mistToVictory(balance) : mistToSui(balance)
      })
      
      return balance.toString()
    }

    return '0'
  } catch (error) {
    console.error('Error fetching vault balance:', vaultId, error)
    return '0'
  }
}

// Get Victory token supply information
export const getVictoryTokenSupply = async (): Promise<{ totalSupply: string; treasuryBalance: string }> => {
  try {
    return {
      totalSupply: '100000000', // 100M tokens
      treasuryBalance: '0' // Treasury doesn't hold tokens, they're in vaults
    }
  } catch (error) {
    console.error('Error fetching Victory token supply:', error)
    return {
      totalSupply: '100000000',
      treasuryBalance: '0'
    }
  }
}

// Comprehensive token data fetching
export const fetchCompleteTokenData = async (userAddress?: string): Promise<{
  tokenStats: TokenStats
  vaultIds: VaultObjectIds
  userBalance: string
}> => {
  try {
    // Get supply info
    const { totalSupply, treasuryBalance } = await getVictoryTokenSupply()
    
    // Fetch vault IDs
    const vaultIds = await fetchVaultObjectIds()
    
    // Fetch vault balances
    let farmVaultBalance = '0'
    let lockerRewardVaultBalance = '0'
    let lockerLockedVaultBalance = '0'
    let suiRewardVaultBalance = '0'

    // Fetch actual vault balances if vault IDs are found
    const balancePromises: Promise<void>[] = []

    if (vaultIds.farmRewardVaultId) {
      balancePromises.push(
        fetchVaultBalance(vaultIds.farmRewardVaultId, true).then(balance => {
          farmVaultBalance = balance
        }).catch(error => {
          console.error('Farm vault balance error:', error)
        })
      )
    }

    if (vaultIds.lockerRewardVaultId) {
      balancePromises.push(
        fetchVaultBalance(vaultIds.lockerRewardVaultId, true).then(balance => {
          lockerRewardVaultBalance = balance
        }).catch(error => {
          console.error('Locker reward vault balance error:', error)
        })
      )
    }

    if (vaultIds.lockerLockedVaultId) {
      balancePromises.push(
        fetchVaultBalance(vaultIds.lockerLockedVaultId, true).then(balance => {
          lockerLockedVaultBalance = balance
        }).catch(error => {
          console.error('Locker locked vault balance error:', error)
        })
      )
    }

    if (vaultIds.suiRewardVaultId) {
      balancePromises.push(
        fetchVaultBalance(vaultIds.suiRewardVaultId, false).then(balance => {
          suiRewardVaultBalance = balance
        }).catch(error => {
          console.error('SUI reward vault balance error:', error)
        })
      )
    }

    // Wait for all balance fetches to complete
    await Promise.all(balancePromises)

    // Convert to human readable format
    const farmVaultBalanceFormatted = mistToVictory(farmVaultBalance)
    const lockerRewardVaultBalanceFormatted = mistToVictory(lockerRewardVaultBalance)
    const lockerLockedVaultBalanceFormatted = mistToVictory(lockerLockedVaultBalance)
    const suiVaultBalanceFormatted = mistToSui(suiRewardVaultBalance)

    // Calculate circulating supply
    const totalInVaults = parseFloat(farmVaultBalanceFormatted) + 
                         parseFloat(lockerRewardVaultBalanceFormatted) + 
                         parseFloat(lockerLockedVaultBalanceFormatted)
    const circulatingSupply = Math.max(0, parseFloat(totalSupply) - totalInVaults).toString()

    const tokenStats: TokenStats = {
      totalSupply,
      circulatingSupply,
      farmVaultBalance: farmVaultBalanceFormatted,
      lockerRewardVaultBalance: lockerRewardVaultBalanceFormatted,
      lockerLockedVaultBalance: lockerLockedVaultBalanceFormatted,
      suiRewardVaultBalance: suiVaultBalanceFormatted,
      treasuryBalance
    }

    // Get user balance if address provided
    let userBalance = '0'
    if (userAddress) {
      try {
        const userCoins = await getUserVictoryCoins(userAddress)
        userBalance = calculateUserVictoryBalance(userCoins)
      } catch (error) {
        console.warn('Could not fetch user balance:', error)
      }
    }

    console.log('Token data fetched successfully:', { tokenStats, userBalance })

    return { tokenStats, vaultIds, userBalance }
  } catch (error) {
    console.error('Error fetching complete token data:', error)
    
    // Return fallback data
    return {
      tokenStats: {
        totalSupply: '100000000',
        circulatingSupply: '25000000',
        farmVaultBalance: '25000000',
        lockerRewardVaultBalance: '35000000', 
        lockerLockedVaultBalance: '15000000',
        suiRewardVaultBalance: '1250.75',
        treasuryBalance: '0'
      },
      vaultIds: {},
      userBalance: '0'
    }
  }
}

// Build deposit transaction for farm vault
export const buildFarmDepositTransaction = (
  amount: string, 
  userCoins: any[], 
  farmVaultId?: string
): Transaction => {
  const tx = new Transaction()
  const depositAmountMist = victoryToMist(amount)

  // Handle coin merging if multiple coins
  let coinToUse = userCoins[0]
  if (userCoins.length > 1) {
    tx.mergeCoins(userCoins[0].coinObjectId, userCoins.slice(1).map(c => c.coinObjectId))
  }

  // Split the required amount
  const [depositCoin] = tx.splitCoins(coinToUse.coinObjectId, [depositAmountMist])

  // Use provided vault ID or fallback to static constant
  const vaultId = farmVaultId || CONSTANTS.VAULT_IDS.FARM_REWARD_VAULT_ID

  // Use the correct function name from the farm contract
  tx.moveCall({
    target: `${CONSTANTS.PACKAGE_ID}::${CONSTANTS.MODULES.FARM}::deposit_victory_tokens`,
    arguments: [
      tx.object(vaultId),
      depositCoin,
      tx.object(CONSTANTS.ADMIN_CAP_ID),
      tx.object(CONSTANTS.CLOCK_ID)
    ]
  })

  return tx
}

// Build deposit transaction for locker reward vault
export const buildLockerDepositTransaction = (
  amount: string, 
  userCoins: any[], 
  lockerVaultId?: string
): Transaction => {
  const tx = new Transaction()
  const depositAmountMist = victoryToMist(amount)

  // Handle coin merging if multiple coins
  let coinToUse = userCoins[0]
  if (userCoins.length > 1) {
    tx.mergeCoins(userCoins[0].coinObjectId, userCoins.slice(1).map(c => c.coinObjectId))
  }

  // Split the required amount
  const [depositCoin] = tx.splitCoins(coinToUse.coinObjectId, [depositAmountMist])

  // Use provided vault ID or fallback to static constant
  const vaultId = lockerVaultId || CONSTANTS.VAULT_IDS.LOCKER_REWARD_VAULT_ID

  // Use the correct function name from the locker contract
  tx.moveCall({
    target: `${CONSTANTS.PACKAGE_ID}::${CONSTANTS.MODULES.TOKEN_LOCKER}::deposit_victory_tokens`,
    arguments: [
      tx.object(vaultId),
      tx.object(CONSTANTS.TOKEN_LOCKER_ID),
      depositCoin,
      tx.object(CONSTANTS.TOKEN_LOCKER_ADMIN_CAP_ID),
      tx.object(CONSTANTS.CLOCK_ID)
    ]
  })

  return tx
}

// Build sweep transaction for farm vault
export const buildFarmSweepTransaction = (
  amount: string, 
  recipient: string, 
  farmVaultId?: string
): Transaction => {
  const tx = new Transaction()
  const sweepAmountMist = victoryToMist(amount)

  // Use provided vault ID or fallback to static constant
  const vaultId = farmVaultId || CONSTANTS.VAULT_IDS.FARM_REWARD_VAULT_ID

  // Use the correct function name from the farm contract
  tx.moveCall({
    target: `${CONSTANTS.PACKAGE_ID}::${CONSTANTS.MODULES.FARM}::admin_sweep_vault_tokens`,
    arguments: [
      tx.object(vaultId),
      tx.pure.u64(sweepAmountMist),
      tx.pure.address(recipient),
      tx.object(CONSTANTS.ADMIN_CAP_ID),
      tx.object(CONSTANTS.CLOCK_ID)
    ]
  })

  return tx
}

// Build mint transaction
export const buildMintTransaction = (amount: string, recipient: string): Transaction => {
  const tx = new Transaction()
  const mintAmountMist = victoryToMist(amount)

  tx.moveCall({
    target: `${CONSTANTS.PACKAGE_ID}::${CONSTANTS.MODULES.VICTORY_TOKEN}::mint`,
    arguments: [
      tx.object(CONSTANTS.VICTORY_TOKEN.TREASURY_CAP_WRAPPER_ID),
      tx.pure.u64(mintAmountMist),
      tx.pure.address(recipient),
      tx.object(CONSTANTS.VICTORY_TOKEN.MINTER_CAP_ID)
    ]
  })

  return tx
}

// Build burn transaction
export const buildBurnTransaction = (coinId: string): Transaction => {
  const tx = new Transaction()

  tx.moveCall({
    target: `${CONSTANTS.PACKAGE_ID}::${CONSTANTS.MODULES.VICTORY_TOKEN}::burn`,
    arguments: [
      tx.object(CONSTANTS.VICTORY_TOKEN.TREASURY_CAP_WRAPPER_ID),
      tx.object(coinId)
    ]
  })

  return tx
}

// Get transaction explorer URL
export const getTransactionExplorerUrl = (txDigest: string, network: string = 'testnet'): string => {
  const baseUrl = network === 'mainnet' ? 'https://suiexplorer.com' : `https://suiexplorer.com`
  return `${baseUrl}/txblock/${txDigest}?network=${network}`
}

// Error handling helpers
export const getTokenOperationErrorMessage = (error: any): string => {
  if (typeof error === 'string') return error
  
  if (error?.message) {
    if (error.message.includes('Insufficient')) {
      return 'Insufficient funds for transaction'
    }
    if (error.message.includes('rejected')) {
      return 'Transaction was rejected by user'
    }
    if (error.message.includes('No Victory tokens')) {
      return 'No Victory tokens found in wallet'
    }
    if (error.message.includes('E_NOT_AUTHORIZED')) {
      return 'Only admin can perform this operation'
    }
    if (error.message.includes('EZERO_AMOUNT')) {
      return 'Amount must be greater than zero'
    }
    if (error.message.includes('E_INSUFFICIENT_REWARDS')) {
      return 'Insufficient vault balance'
    }
    if (error.message.includes('PLACEHOLDER')) {
      return 'Vault ID not found - please check console for vault configuration'
    }
    
    return error.message
  }
  
  return 'An unknown error occurred'
}