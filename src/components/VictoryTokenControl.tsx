// components/VictoryTokenControl.tsx
import React, { useState, useEffect } from 'react'
import { useWallet } from '@suiet/wallet-kit'
import { Transaction } from '@mysten/sui/transactions'
import { CONSTANTS } from '../constants'
import {
  type TokenStats,
  type VaultInfo,
  type VaultObjectIds,
  fetchCompleteTokenData,
  getUserVictoryCoins,
  calculateUserVictoryBalance,
  formatTokenAmount,
  calculatePercentage,
  validateVictoryAmount,
  validateSuiAddress,
  buildFarmDepositTransaction,
  buildLockerDepositTransaction,
  buildFarmSweepTransaction,
  buildMintTransaction,
  buildBurnTransaction,
  getTokenOperationErrorMessage,
  getTransactionExplorerUrl,
  buildLockerVictorySweepTransaction,
  buildLockerSUISweepTransaction,
} from '../utils/tokenUtils'

interface TransactionStatus {
  isProcessing: boolean
  isSuccess: boolean
  isError: boolean
  message: string
  txDigest?: string
}

interface MintBurnModal {
  isOpen: boolean
  type: 'mint' | 'burn' | null
}

// Remove fallback data since vault fetching is now working

const VictoryTokenControl: React.FC = () => {
  const { connected, account, signAndExecuteTransaction } = useWallet()
  const [tokenStats, setTokenStats] = useState<TokenStats | null>(null)
  const [vaultInfos, setVaultInfos] = useState<VaultInfo[]>([])
  const [vaultObjectIds, setVaultObjectIds] = useState<VaultObjectIds>({})
  const [userVictoryBalance, setUserVictoryBalance] = useState<string>('0')
  const [userVictoryCoins, setUserVictoryCoins] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Modal states
  const [depositModal, setDepositModal] = useState<{ isOpen: boolean; vault: VaultInfo | null }>({ 
    isOpen: false, 
    vault: null 
  })
  const [sweepModal, setSweepModal] = useState<{ isOpen: boolean; vault: VaultInfo | null }>({ 
    isOpen: false, 
    vault: null 
  })
  const [mintBurnModal, setMintBurnModal] = useState<MintBurnModal>({ 
    isOpen: false, 
    type: null 
  })
  
  // Form states
  const [depositAmount, setDepositAmount] = useState('')
  const [sweepAmount, setSweepAmount] = useState('')
  const [recipientAddress, setRecipientAddress] = useState('')
  const [mintAmount, setMintAmount] = useState('')
  const [mintRecipient, setMintRecipient] = useState('')
  const [selectedBurnCoin, setSelectedBurnCoin] = useState('')
  
  // Transaction states
  const [depositStatus, setDepositStatus] = useState<TransactionStatus>({
    isProcessing: false,
    isSuccess: false,
    isError: false,
    message: ''
  })
  const [sweepStatus, setSweepStatus] = useState<TransactionStatus>({
    isProcessing: false,
    isSuccess: false,
    isError: false,
    message: ''
  })
  const [mintBurnStatus, setMintBurnStatus] = useState<TransactionStatus>({
    isProcessing: false,
    isSuccess: false,
    isError: false,
    message: ''
  })

  useEffect(() => {
    fetchTokenData()
    const interval = setInterval(fetchTokenData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [connected, account])

  const fetchTokenData = async () => {
    try {
      setLoading(true)
      setError(null)

      const userAddress = connected && account?.address ? account.address : undefined
      const { tokenStats, vaultIds, userBalance } = await fetchCompleteTokenData(userAddress)
      
      setTokenStats(tokenStats)
      setVaultObjectIds(vaultIds)
      setUserVictoryBalance(userBalance)

      // Get user's Victory coins if connected
      if (userAddress) {
        try {
          const coins = await getUserVictoryCoins(userAddress)
          setUserVictoryCoins(coins)
          const calculatedBalance = calculateUserVictoryBalance(coins)
          setUserVictoryBalance(calculatedBalance)
        } catch (error) {
          console.warn('Could not fetch user coins:', error)
          setUserVictoryCoins([])
          setUserVictoryBalance('0')
        }
      }

      // Create vault info array with real data
      const vaults: VaultInfo[] = [
        {
          id: 'farm_vault',
          name: 'Farm Reward Vault',
          balance: tokenStats.farmVaultBalance,
          description: 'Victory tokens for farm staking rewards',
          canDeposit: true,
          canSweep: true,
          icon: '🌾',
          color: 'from-green-600 to-emerald-600',
          objectId: vaultIds.farmRewardVaultId || CONSTANTS.VAULT_IDS.FARM_REWARD_VAULT_ID
        },
        {
          id: 'locker_reward_vault',
          name: 'Locker Reward Vault',
          balance: tokenStats.lockerRewardVaultBalance,
          description: 'Victory tokens for locker staking rewards',
          canDeposit: true,
          canSweep: true,
          icon: '🏆',
          color: 'from-purple-600 to-violet-600',
          objectId: vaultIds.lockerRewardVaultId || CONSTANTS.VAULT_IDS.LOCKER_REWARD_VAULT_ID
        },
        {
          id: 'locker_locked_vault',
          name: 'Locker Locked Vault',
          balance: tokenStats.lockerLockedVaultBalance,
          description: 'User locked Victory tokens (DO NOT TOUCH)',
          canDeposit: false,
          canSweep: false,
          icon: '🔒',
          color: 'from-red-600 to-rose-600',
          objectId: vaultIds.lockerLockedVaultId || CONSTANTS.VAULT_IDS.LOCKER_LOCKED_VAULT_ID
        },
        {
          id: 'sui_reward_vault',
          name: 'SUI Reward Vault',
          balance: tokenStats.suiRewardVaultBalance,
          description: 'SUI tokens for revenue sharing',
          canDeposit: false,
          canSweep: true,
          icon: '💎',
          color: 'from-blue-600 to-cyan-600',
          objectId: vaultIds.suiRewardVaultId || CONSTANTS.VAULT_IDS.SUI_REWARD_VAULT_ID
        }
      ]

      setVaultInfos(vaults)
    } catch (err) {
      console.error('Error in fetchTokenData:', err)
      setError('Failed to fetch token data')
    } finally {
      setLoading(false)
    }
  }

  const resetDepositForm = () => {
    setDepositAmount('')
  }

  const resetDepositStatus = () => {
    setDepositStatus({
      isProcessing: false,
      isSuccess: false,
      isError: false,
      message: ''
    })
  }

  const closeDepositModal = () => {
    setDepositModal({ isOpen: false, vault: null })
    resetDepositForm()
    resetDepositStatus()
  }

  const resetSweepForm = () => {
    setSweepAmount('')
    setRecipientAddress('')
  }

  const resetSweepStatus = () => {
    setSweepStatus({
      isProcessing: false,
      isSuccess: false,
      isError: false,
      message: ''
    })
  }

  const closeSweepModal = () => {
    setSweepModal({ isOpen: false, vault: null })
    resetSweepForm()
    resetSweepStatus()
  }

  const resetMintBurnForm = () => {
    setMintAmount('')
    setMintRecipient('')
    setSelectedBurnCoin('')
  }

  const resetMintBurnStatus = () => {
    setMintBurnStatus({
      isProcessing: false,
      isSuccess: false,
      isError: false,
      message: ''
    })
  }

  const closeMintBurnModal = () => {
    setMintBurnModal({ isOpen: false, type: null })
    resetMintBurnForm()
    resetMintBurnStatus()
  }

  const handleDepositToVault = async () => {
    if (!connected || !account?.address || !depositModal.vault) {
      setDepositStatus({
        isProcessing: false,
        isSuccess: false,
        isError: true,
        message: 'Please connect your wallet first.'
      })
      return
    }

    // Validate amount
    const validation = validateVictoryAmount(depositAmount)
    if (!validation.isValid) {
      setDepositStatus({
        isProcessing: false,
        isSuccess: false,
        isError: true,
        message: validation.error || 'Invalid amount'
      })
      return
    }

    setDepositStatus({
      isProcessing: true,
      isSuccess: false,
      isError: false,
      message: 'Getting user coins...'
    })

    try {
      // Get user's Victory tokens
      const userCoins = await getUserVictoryCoins(account.address)
      
      if (userCoins.length === 0) {
        throw new Error('No Victory tokens found in wallet')
      }

      // Check if user has enough balance
      const userBalance = parseFloat(calculateUserVictoryBalance(userCoins))
      const depositAmountNum = parseFloat(depositAmount)
      
      if (userBalance < depositAmountNum) {
        throw new Error(`Insufficient balance. You have ${userBalance.toFixed(2)} VICTORY`)
      }

      setDepositStatus({
        isProcessing: true,
        isSuccess: false,
        isError: false,
        message: 'Building transaction...'
      })

      // Build transaction based on vault type
      let tx: Transaction
      if (depositModal.vault.id === 'farm_vault') {
        tx = buildFarmDepositTransaction(depositAmount, userCoins, depositModal.vault.objectId)
      } else if (depositModal.vault.id === 'locker_reward_vault') {
        tx = buildLockerDepositTransaction(depositAmount, userCoins, depositModal.vault.objectId)
      } else {
        throw new Error('Unsupported vault type for deposit')
      }

      setDepositStatus({
        isProcessing: true,
        isSuccess: false,
        isError: false,
        message: 'Please approve transaction in wallet...'
      })

      const result = await signAndExecuteTransaction({
        transaction: tx,
        options: {
          showInput: true,
          showEffects: true,
          showEvents: true,
          showObjectChanges: true,
          showBalanceChanges: true,
        }
      })

      console.log('Deposit transaction result:', result)
      
      // Check if transaction was successful - Sui transactions succeed if they have a digest and no error
      if (result?.digest) {
        // Additional check: if there are effects and no explicit error, consider it successful
        const hasError = result?.effects?.status?.error || 
                         (result?.effects?.status && result?.effects?.status !== 0 && result?.effects?.status !== 1)
        
        if (!hasError) {
          setDepositStatus({
            isProcessing: false,
            isSuccess: true,
            isError: false,
            message: `Successfully deposited ${depositAmount} VICTORY to ${depositModal.vault.name}!`,
            txDigest: result.digest
          })
          
          // Refresh data after short delay
          setTimeout(() => {
            fetchTokenData()
          }, 3000)
          
          // Auto-close modal after 5 seconds
          setTimeout(() => {
            closeDepositModal()
          }, 5000)
        } else {
          throw new Error(`Transaction failed: ${result?.effects?.status?.error || 'Transaction error'}`)
        }
      } else {
        throw new Error('Transaction failed: No transaction digest received')
      }
    } catch (error: any) {
      console.error('Deposit error:', error)
      setDepositStatus({
        isProcessing: false,
        isSuccess: false,
        isError: true,
        message: getTokenOperationErrorMessage(error)
      })
    }
  }

  const handleSweepFromVault = async () => {
    if (!connected || !account?.address || !sweepModal.vault || !recipientAddress) {
      setSweepStatus({
        isProcessing: false,
        isSuccess: false,
        isError: true,
        message: 'Please fill in all required fields and connect your wallet.'
      })
      return
    }

    // Validate amount
    const amountValidation = validateVictoryAmount(sweepAmount)
    if (!amountValidation.isValid) {
      setSweepStatus({
        isProcessing: false,
        isSuccess: false,
        isError: true,
        message: amountValidation.error || 'Invalid amount'
      })
      return
    }

    // Validate recipient address
    const addressValidation = validateSuiAddress(recipientAddress)
    if (!addressValidation.isValid) {
      setSweepStatus({
        isProcessing: false,
        isSuccess: false,
        isError: true,
        message: addressValidation.error || 'Invalid recipient address'
      })
      return
    }

    setSweepStatus({
      isProcessing: true,
      isSuccess: false,
      isError: false,
      message: 'Building sweep transaction...'
    })

    try {
      let tx: Transaction
      if (sweepModal.vault.id === 'farm_vault') {
        tx = buildFarmSweepTransaction(sweepAmount, recipientAddress, sweepModal.vault.objectId)
      } else if (sweepModal.vault.id === 'locker_reward_vault') {
        tx = buildLockerVictorySweepTransaction(sweepAmount, recipientAddress, sweepModal.vault.objectId)
      } else if (sweepModal.vault.id === 'sui_reward_vault') {
        tx = buildLockerSUISweepTransaction(sweepAmount, recipientAddress, sweepModal.vault.objectId)
      } else {
        throw new Error('Sweep function not available for this vault type')
      }

      setSweepStatus({
        isProcessing: true,
        isSuccess: false,
        isError: false,
        message: 'Please approve transaction in wallet...'
      })

      const result = await signAndExecuteTransaction({
        transaction: tx,
        options: {
          showInput: true,
          showEffects: true,
          showEvents: true,
          showObjectChanges: true,
          showBalanceChanges: true,
        }
      })

      console.log('Sweep transaction result:', result)
      
      // Check if transaction was successful - Sui transactions succeed if they have a digest and no error
      if (result?.digest) {
        // Additional check: if there are effects and no explicit error, consider it successful
        const hasError = result?.effects?.status?.error || 
                         (result?.effects?.status && result?.effects?.status !== 0 && result?.effects?.status !== 1)
        
        if (!hasError) {
          setSweepStatus({
            isProcessing: false,
            isSuccess: true,
            isError: false,
            message: `Successfully swept ${sweepAmount} ${sweepModal.vault.id === 'sui_reward_vault' ? 'SUI' : 'VICTORY'} to ${recipientAddress.slice(0, 8)}...${recipientAddress.slice(-6)}`,
            txDigest: result.digest
          })
          
          // Refresh data after short delay
          setTimeout(() => {
            fetchTokenData()
          }, 3000)
          
          // Auto-close modal after 5 seconds
          setTimeout(() => {
            closeSweepModal()
          }, 5000)
        } else {
          throw new Error(`Transaction failed: ${result?.effects?.status?.error || 'Transaction error'}`)
        }
      } else {
        throw new Error('Transaction failed: No transaction digest received')
      }
    } catch (error: any) {
      console.error('Sweep error:', error)
      setSweepStatus({
        isProcessing: false,
        isSuccess: false,
        isError: true,
        message: getTokenOperationErrorMessage(error)
      })
    }
  }

  const handleMintTokens = async () => {
    if (!connected || !account?.address) {
      setMintBurnStatus({
        isProcessing: false,
        isSuccess: false,
        isError: true,
        message: 'Please connect your wallet first.'
      })
      return
    }

    // Validate amount
    const amountValidation = validateVictoryAmount(mintAmount)
    if (!amountValidation.isValid) {
      setMintBurnStatus({
        isProcessing: false,
        isSuccess: false,
        isError: true,
        message: amountValidation.error || 'Invalid amount'
      })
      return
    }

    // Validate recipient address
    const addressValidation = validateSuiAddress(mintRecipient)
    if (!addressValidation.isValid) {
      setMintBurnStatus({
        isProcessing: false,
        isSuccess: false,
        isError: true,
        message: addressValidation.error || 'Invalid recipient address'
      })
      return
    }

    setMintBurnStatus({
      isProcessing: true,
      isSuccess: false,
      isError: false,
      message: 'Building mint transaction...'
    })

    try {
      const tx = buildMintTransaction(mintAmount, mintRecipient)

      setMintBurnStatus({
        isProcessing: true,
        isSuccess: false,
        isError: false,
        message: 'Please approve transaction in wallet...'
      })

      const result = await signAndExecuteTransaction({
        transaction: tx,
        options: {
          showInput: true,
          showEffects: true,
          showEvents: true,
          showObjectChanges: true,
          showBalanceChanges: true,
        }
      })

      console.log('Mint transaction result:', result)
      
      // Check if transaction was successful - Sui transactions succeed if they have a digest and no error
      if (result?.digest) {
        // Additional check: if there are effects and no explicit error, consider it successful
        const hasError = result?.effects?.status?.error || 
                         (result?.effects?.status && result?.effects?.status !== 0 && result?.effects?.status !== 1)
        
        if (!hasError) {
          setMintBurnStatus({
            isProcessing: false,
            isSuccess: true,
            isError: false,
            message: `Successfully minted ${mintAmount} VICTORY to ${mintRecipient.slice(0, 8)}...${mintRecipient.slice(-6)}`,
            txDigest: result.digest
          })
          
          // Refresh data after short delay
          setTimeout(() => {
            fetchTokenData()
          }, 3000)

          // Auto-close modal after 5 seconds
          setTimeout(() => {
            closeMintBurnModal()
          }, 5000)
        } else {
          throw new Error(`Transaction failed: ${result?.effects?.status?.error || 'Transaction error'}`)
        }
      } else {
        throw new Error('Transaction failed: No transaction digest received')
      }
    } catch (error: any) {
      console.error('Mint error:', error)
      setMintBurnStatus({
        isProcessing: false,
        isSuccess: false,
        isError: true,
        message: getTokenOperationErrorMessage(error)
      })
    }
  }

  const handleBurnTokens = async () => {
    if (!connected || !account?.address || !selectedBurnCoin) {
      setMintBurnStatus({
        isProcessing: false,
        isSuccess: false,
        isError: true,
        message: 'Please select a coin to burn and connect your wallet.'
      })
      return
    }

    setMintBurnStatus({
      isProcessing: true,
      isSuccess: false,
      isError: false,
      message: 'Building burn transaction...'
    })

    try {
      const tx = buildBurnTransaction(selectedBurnCoin)

      setMintBurnStatus({
        isProcessing: true,
        isSuccess: false,
        isError: false,
        message: 'Please approve transaction in wallet...'
      })

      const result = await signAndExecuteTransaction({
        transaction: tx,
        options: {
          showInput: true,
          showEffects: true,
          showEvents: true,
          showObjectChanges: true,
          showBalanceChanges: true,
        }
      })

      console.log('Burn transaction result:', result)
      
      // Check if transaction was successful - Sui transactions succeed if they have a digest and no error
      if (result?.digest) {
        // Additional check: if there are effects and no explicit error, consider it successful
        const hasError = result?.effects?.status?.error || 
                         (result?.effects?.status && result?.effects?.status !== 0 && result?.effects?.status !== 1)
        
        if (!hasError) {
          // Find the burned coin info for better message
          const burnedCoin = userVictoryCoins.find(coin => coin.coinObjectId === selectedBurnCoin)
          const burnedAmount = burnedCoin ? formatTokenAmount(burnedCoin.balance / 1e6) : 'Unknown'
          
          setMintBurnStatus({
            isProcessing: false,
            isSuccess: true,
            isError: false,
            message: `Successfully burned ${burnedAmount} VICTORY tokens!`,
            txDigest: result.digest
          })
          
          // Refresh data after short delay
          setTimeout(() => {
            fetchTokenData()
          }, 3000)

          // Auto-close modal after 5 seconds
          setTimeout(() => {
            closeMintBurnModal()
          }, 5000)
        } else {
          throw new Error(`Transaction failed: ${result?.effects?.status?.error || 'Transaction error'}`)
        }
      } else {
        throw new Error('Transaction failed: No transaction digest received')
      }
    } catch (error: any) {
      console.error('Burn error:', error)
      setMintBurnStatus({
        isProcessing: false,
        isSuccess: false,
        isError: true,
        message: getTokenOperationErrorMessage(error)
      })
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white mb-4">Victory Token Control</h2>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
          <span className="ml-3 text-slate-400">Loading token data...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white mb-4">Victory Token Control</h2>
        <div className="bg-red-600/20 border border-red-500/30 rounded-xl p-6">
          <div className="text-red-400 font-medium">Error</div>
          <div className="text-red-300 text-sm mt-1">{error}</div>
          <button 
            onClick={fetchTokenData}
            className="mt-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white mb-4">Victory Token Control</h2>
        <button 
          onClick={fetchTokenData}
          className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>
      
      {/* Token Supply Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
              🏆
            </div>
            <div className="text-slate-400 text-sm">Total Supply</div>
          </div>
          <div className="text-2xl font-bold text-white mt-1">{formatTokenAmount(tokenStats?.totalSupply || '100000000')} VICTORY</div>
          <div className="text-blue-400 text-sm mt-1">Fixed supply</div>
        </div>
        
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
              🔄
            </div>
            <div className="text-slate-400 text-sm">Circulating</div>
          </div>
          <div className="text-2xl font-bold text-white mt-1">{formatTokenAmount(tokenStats?.circulatingSupply || '0')}</div>
          <div className="text-green-400 text-sm mt-1">
            {tokenStats ? calculatePercentage(tokenStats.circulatingSupply, tokenStats.totalSupply) : '0.0'}% of supply
          </div>
        </div>
        
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-violet-500 rounded-lg flex items-center justify-center">
              🏦
            </div>
            <div className="text-slate-400 text-sm">In Vaults</div>
          </div>
          <div className="text-2xl font-bold text-white mt-1">
            {formatTokenAmount(
              (parseFloat(tokenStats?.farmVaultBalance || '0') + 
               parseFloat(tokenStats?.lockerRewardVaultBalance || '0') + 
               parseFloat(tokenStats?.lockerLockedVaultBalance || '0')).toString()
            )}
          </div>
          <div className="text-purple-400 text-sm mt-1">Across all vaults</div>
        </div>
      </div>

      {/* User Balance */}
      {connected && (
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                👤
              </div>
              <div>
                <div className="text-slate-400 text-sm">Your Balance</div>
                <div className="text-xl font-bold text-white">{formatTokenAmount(userVictoryBalance)} VICTORY</div>
              </div>
            </div>
            <div className="text-slate-400 text-sm">
              Connected: {account?.address?.slice(0, 8)}...{account?.address?.slice(-6)}
            </div>
          </div>
        </div>
      )}

      {/* Admin Actions */}
      <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Admin Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setMintBurnModal({ isOpen: true, type: 'mint' })}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold px-4 py-3 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Mint Tokens</span>
          </button>
          <button
            onClick={() => setMintBurnModal({ isOpen: true, type: 'burn' })}
            className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-semibold px-4 py-3 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>Burn Tokens</span>
          </button>
        </div>
      </div>

      {/* Vault Management */}
      <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Vault Management</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {vaultInfos.map((vault) => (
            <div key={vault.id} className="bg-slate-700/30 border border-slate-600/30 rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 bg-gradient-to-r ${vault.color} rounded-lg flex items-center justify-center text-lg`}>
                    {vault.icon}
                  </div>
                  <div>
                    <div className="text-white font-medium">{vault.name}</div>
                    <div className="text-slate-400 text-sm">{vault.description}</div>
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="text-slate-400 text-sm">Balance</div>
                <div className="text-xl font-bold text-white">
                  {vault.id === 'sui_reward_vault' 
                    ? `${formatTokenAmount(vault.balance)} SUI`
                    : `${formatTokenAmount(vault.balance)} VICTORY`
                  }
                </div>
                {vault.objectId && (
                  <div className="text-xs text-slate-500 mt-1 font-mono break-all">
                    ID: {vault.objectId}
                  </div>
                )}
              </div>

              <div className="flex space-x-3">
                {vault.canDeposit && (
                  <button
                    onClick={() => setDepositModal({ isOpen: true, vault })}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>Deposit</span>
                  </button>
                )}
                
                {vault.canSweep && (
                  <button
                    onClick={() => setSweepModal({ isOpen: true, vault })}
                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold px-4 py-2 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V19a2 2 0 002 2h4a2 2 0 002-2V7m-6 0h6" />
                    </svg>
                    <span>Sweep</span>
                  </button>
                )}
                
                {!vault.canDeposit && !vault.canSweep && (
                  <div className="flex-1 bg-slate-600/50 text-slate-400 font-medium px-4 py-2 rounded-lg text-center">
                    Protected Vault
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Token Distribution Chart */}
      <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Token Distribution</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-slate-300">Circulating Supply</span>
              <span className="text-white">
                {tokenStats ? calculatePercentage(tokenStats.circulatingSupply, tokenStats.totalSupply) : '0.0'}%
              </span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full" 
                style={{ 
                  width: `${tokenStats ? calculatePercentage(tokenStats.circulatingSupply, tokenStats.totalSupply) : '0.0'}%` 
                }}
              ></div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-slate-300">Farm Vault</span>
              <span className="text-white">
                {tokenStats ? calculatePercentage(tokenStats.farmVaultBalance, tokenStats.totalSupply) : '0.0'}%
              </span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full" 
                style={{ 
                  width: `${tokenStats ? calculatePercentage(tokenStats.farmVaultBalance, tokenStats.totalSupply) : '0.0'}%` 
                }}
              ></div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-slate-300">Locker Rewards</span>
              <span className="text-white">
                {tokenStats ? calculatePercentage(tokenStats.lockerRewardVaultBalance, tokenStats.totalSupply) : '0.0'}%
              </span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-purple-500 to-violet-500 h-3 rounded-full" 
                style={{ 
                  width: `${tokenStats ? calculatePercentage(tokenStats.lockerRewardVaultBalance, tokenStats.totalSupply) : '0.0'}%` 
                }}
              ></div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-slate-300">Locker Locked</span>
              <span className="text-white">
                {tokenStats ? calculatePercentage(tokenStats.lockerLockedVaultBalance, tokenStats.totalSupply) : '0.0'}%
              </span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-red-500 to-rose-500 h-3 rounded-full" 
                style={{ 
                  width: `${tokenStats ? calculatePercentage(tokenStats.lockerLockedVaultBalance, tokenStats.totalSupply) : '0.0'}%` 
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Deposit Modal */}
      {depositModal.isOpen && depositModal.vault && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                Deposit to {depositModal.vault.name}
              </h3>
              <button
                onClick={closeDepositModal}
                className="text-slate-400 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Amount (VICTORY)
                </label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.000001"
                  min="0"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <div className="text-xs text-slate-400 mt-1">
                  Available: {formatTokenAmount(userVictoryBalance)} VICTORY
                </div>
              </div>

              {depositStatus.message && (
                <div className={`p-3 rounded-lg text-sm ${
                  depositStatus.isError ? 'bg-red-600/20 text-red-400' :
                  depositStatus.isSuccess ? 'bg-green-600/20 text-green-400' :
                  'bg-blue-600/20 text-blue-400'
                }`}>
                  {depositStatus.message}
                  {depositStatus.txDigest && (
                    <a
                      href={getTransactionExplorerUrl(depositStatus.txDigest)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block mt-2 underline hover:no-underline"
                    >
                      View Transaction
                    </a>
                  )}
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={closeDepositModal}
                  className="flex-1 bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDepositToVault}
                  disabled={depositStatus.isProcessing || !depositAmount || parseFloat(depositAmount) <= 0}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
                >
                  {depositStatus.isProcessing ? 'Processing...' : 'Deposit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sweep Modal */}
      {sweepModal.isOpen && sweepModal.vault && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                Sweep from {sweepModal.vault.name}
              </h3>
              <button
                onClick={closeSweepModal}
                className="text-slate-400 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Amount ({sweepModal.vault.id === 'sui_reward_vault' ? 'SUI' : 'VICTORY'})
                </label>
                <input
                  type="number"
                  value={sweepAmount}
                  onChange={(e) => setSweepAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.000001"
                  min="0"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <div className="text-xs text-slate-400 mt-1">
                  Vault Balance: {formatTokenAmount(sweepModal.vault.balance)} {sweepModal.vault.id === 'sui_reward_vault' ? 'SUI' : 'VICTORY'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Recipient Address
                </label>
                <input
                  type="text"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {sweepStatus.message && (
                <div className={`p-3 rounded-lg text-sm ${
                  sweepStatus.isError ? 'bg-red-600/20 text-red-400' :
                  sweepStatus.isSuccess ? 'bg-green-600/20 text-green-400' :
                  'bg-blue-600/20 text-blue-400'
                }`}>
                  {sweepStatus.message}
                  {sweepStatus.txDigest && (
                    <a
                      href={getTransactionExplorerUrl(sweepStatus.txDigest)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block mt-2 underline hover:no-underline"
                    >
                      View Transaction
                    </a>
                  )}
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={closeSweepModal}
                  className="flex-1 bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSweepFromVault}
                  disabled={sweepStatus.isProcessing || !sweepAmount || !recipientAddress || parseFloat(sweepAmount) <= 0}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
                >
                  {sweepStatus.isProcessing ? 'Processing...' : 'Sweep'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mint/Burn Modal */}
      {mintBurnModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                {mintBurnModal.type === 'mint' ? 'Mint' : 'Burn'} Victory Tokens
              </h3>
              <button
                onClick={closeMintBurnModal}
                className="text-slate-400 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {mintBurnModal.type === 'mint' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Amount (VICTORY)
                    </label>
                    <input
                      type="number"
                      value={mintAmount}
                      onChange={(e) => setMintAmount(e.target.value)}
                      placeholder="0.00"
                      step="0.000001"
                      min="0"
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Recipient Address
                    </label>
                    <input
                      type="text"
                      value={mintRecipient}
                      onChange={(e) => setMintRecipient(e.target.value)}
                      placeholder="0x..."
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Select Coin to Burn
                  </label>
                  <select
                    value={selectedBurnCoin}
                    onChange={(e) => setSelectedBurnCoin(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select a coin...</option>
                    {userVictoryCoins.map((coin) => (
                      <option key={coin.coinObjectId} value={coin.coinObjectId}>
                        {formatTokenAmount(coin.balance / 1e6)} VICTORY - {coin.coinObjectId.slice(0, 8)}...
                      </option>
                    ))}
                  </select>
                  {userVictoryCoins.length === 0 && (
                    <div className="text-xs text-slate-400 mt-1">
                      No Victory tokens found in wallet
                    </div>
                  )}
                </div>
              )}

              {mintBurnStatus.message && (
                <div className={`p-3 rounded-lg text-sm ${
                  mintBurnStatus.isError ? 'bg-red-600/20 text-red-400' :
                  mintBurnStatus.isSuccess ? 'bg-green-600/20 text-green-400' :
                  'bg-blue-600/20 text-blue-400'
                }`}>
                  {mintBurnStatus.message}
                  {mintBurnStatus.txDigest && (
                    <a
                      href={getTransactionExplorerUrl(mintBurnStatus.txDigest)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block mt-2 underline hover:no-underline"
                    >
                      View Transaction
                    </a>
                  )}
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={closeMintBurnModal}
                  className="flex-1 bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={mintBurnModal.type === 'mint' ? handleMintTokens : handleBurnTokens}
                  disabled={
                    mintBurnStatus.isProcessing || 
                    (mintBurnModal.type === 'mint' ? (!mintAmount || !mintRecipient || parseFloat(mintAmount) <= 0) : !selectedBurnCoin)
                  }
                  className={`flex-1 ${
                    mintBurnModal.type === 'mint' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  } disabled:bg-slate-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors`}
                >
                  {mintBurnStatus.isProcessing ? 'Processing...' : 
                   mintBurnModal.type === 'mint' ? 'Mint' : 'Burn'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default VictoryTokenControl