// components/admin/PairAddressUpdateForm.tsx

import React, { useState, useCallback } from 'react'
import { useWallet } from '@suiet/wallet-kit'
import { PairService } from '../services/pairService'
import { TokenTypeUtils } from '../utils/tokenTypeUtils'
import type { 
  PairLookupResult, 
  PairFeeAddresses, 
  PairUpdateAddresses,
  CommonToken 
} from '../types/pairTypes'

interface PairAddressUpdateFormProps {
  onSuccess?: (pairAddress: string) => void
  onError?: (error: string) => void
}

type FormStep = 'search' | 'review' | 'update'

export const PairAddressUpdateForm: React.FC<PairAddressUpdateFormProps> = ({
  onSuccess,
  onError
}) => {
  const { connected, account, signAndExecuteTransaction } = useWallet()

  const [currentStep, setCurrentStep] = useState<FormStep>('search')
  const [token0Type, setToken0Type] = useState('')
  const [token1Type, setToken1Type] = useState('')
  const [showToken0Dropdown, setShowToken0Dropdown] = useState(false)
  const [showToken1Dropdown, setShowToken1Dropdown] = useState(false)
  const [pairLookup, setPairLookup] = useState<PairLookupResult | null>(null)
  const [currentAddresses, setCurrentAddresses] = useState<PairFeeAddresses | null>(null)
  const [newAddresses, setNewAddresses] = useState<PairUpdateAddresses>({
    team1: '',
    team2: '',
    dev: '',
    locker: '',
    buyback: ''
  })
  const [isSearching, setIsSearching] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const commonTokens = PairService.getCommonTokens()

  const handleSwapTokens = useCallback(() => {
    setToken0Type(token1Type)
    setToken1Type(token0Type)
    setWarning(null)
    setError(null)
  }, [token0Type, token1Type])

  const handleSelectCommonToken = useCallback((token: CommonToken, field: 'token0' | 'token1') => {
    if (field === 'token0') {
      setToken0Type(token.type)
      setShowToken0Dropdown(false)
    } else {
      setToken1Type(token.type)
      setShowToken1Dropdown(false)
    }
    setError(null)
  }, [])

  const handleFindPair = async () => {
    setIsSearching(true)
    setError(null)
    setWarning(null)
    setSuccess(null)

    try {
      const validation = TokenTypeUtils.validateTokenPair(token0Type, token1Type)
      if (!validation.isValid) {
        setError(validation.error || 'Invalid token types')
        return
      }

      if (validation.shouldSwap) {
        setWarning('Token types may need to be swapped. If pair not found, click the swap button.')
      }

      const result = await PairService.findPairByTokenTypes(token0Type, token1Type)
      setPairLookup(result)

      if (!result.exists) {
        setError(result.error || 'Pair not found')
        return
      }

      const addresses = await PairService.fetchPairFeeAddresses(result.pairAddress!)
      if (!addresses) {
        setError('Failed to fetch pair addresses')
        return
      }

      setCurrentAddresses(addresses)
      setCurrentStep('review')
      setSuccess(`Found pair: ${result.pairDisplayName}`)

    } catch (err: any) {
      setError(PairService.getErrorMessage(err))
    } finally {
      setIsSearching(false)
    }
  }

  const handleUpdateAddresses = async () => {
    if (!pairLookup || !pairLookup.exists || !currentAddresses) return
    if (!connected || !account) {
      setError('Please connect your wallet')
      return
    }

    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      if (!PairService.haveAddressesChanged(currentAddresses, newAddresses)) {
        setError('No changes detected in addresses')
        return
      }

      const validation = PairService.validatePairUpdate(
        pairLookup.pairAddress!,
        pairLookup.token0Type,
        pairLookup.token1Type,
        newAddresses
      )

      if (!validation.isValid) {
        setError(validation.errors.join(', '))
        return
      }

      const tx = PairService.buildUpdatePairAddressesTransaction(
        pairLookup.pairAddress!,
        pairLookup.token0Type,
        pairLookup.token1Type,
        newAddresses
      )

      const result = await signAndExecuteTransaction({
        transaction: tx,
        options: {
          showEffects: true,
          showEvents: true
        }
      })

      console.log('Pair addresses updated successfully', result)
      setSuccess(`Addresses updated successfully! TX: ${result.digest.slice(0, 8)}...`)
      onSuccess?.(pairLookup.pairAddress!)

      setTimeout(() => {
        handleReset()
      }, 3000)

    } catch (err: any) {
      console.error('Failed to update pair addresses:', err)
      const errorMsg = PairService.getErrorMessage(err)
      setError(errorMsg)
      onError?.(errorMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    setCurrentStep('search')
    setToken0Type('')
    setToken1Type('')
    setPairLookup(null)
    setCurrentAddresses(null)
    setNewAddresses({ team1: '', team2: '', dev: '', locker: '', buyback: '' })
    setError(null)
    setWarning(null)
    setSuccess(null)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const renderTokenInput = (
    label: string, 
    value: string, 
    onChange: (value: string) => void, 
    showDropdown: boolean, 
    setShowDropdown: (show: boolean) => void, 
    placeholder: string
  ) => (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          placeholder={placeholder}
          className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all font-mono text-sm"
        />
        <button 
          type="button" 
          onClick={() => setShowDropdown(!showDropdown)} 
          className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-gray-300 hover:bg-white/10 transition-colors"
        >
          Common ▼
        </button>
      </div>
      {showDropdown && (
        <div className="absolute z-10 mt-1 w-full bg-gray-900 border border-purple-500/30 rounded-lg shadow-xl max-h-48 overflow-auto">
          {commonTokens.map((token) => (
            <button 
              key={token.type} 
              type="button" 
              onClick={() => handleSelectCommonToken(token, label.includes('Token0') ? 'token0' : 'token1')} 
              className="w-full px-4 py-3 text-left hover:bg-purple-500/20 flex justify-between items-center transition-colors border-b border-white/5 last:border-0"
            >
              <span className="font-semibold text-white">{token.symbol}</span>
              <span className="text-xs text-gray-400">{token.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )

  const renderAddressInput = (label: string, field: keyof PairUpdateAddresses, placeholder: string, description?: string) => (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
      {description && <p className="text-xs text-gray-500 mb-2">{description}</p>}
      <input 
        type="text" 
        value={newAddresses[field]} 
        onChange={(e) => setNewAddresses({ ...newAddresses, [field]: e.target.value })} 
        placeholder={placeholder} 
        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm transition-all" 
      />
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Wallet Connection Warning */}
      {!connected && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <p className="text-sm text-yellow-400">⚠️ Please connect your wallet to update pair addresses</p>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <p className="text-sm text-red-400">❌ {error}</p>
        </div>
      )}

      {/* Success Alert */}
      {success && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
          <p className="text-sm text-green-400">✓ {success}</p>
        </div>
      )}

      {/* Step Indicator */}
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-2">
          {['Search', 'Review', 'Update'].map((step, idx) => (
            <React.Fragment key={step}>
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                  currentStep === ['search', 'review', 'update'][idx] 
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50' 
                    : 'bg-white/5 text-gray-500 border border-white/10'
                }`}
              >
                {idx + 1}
              </div>
              {idx < 2 && (
                <div className={`w-16 h-1 rounded transition-all ${
                  ['review', 'update'].includes(currentStep) && idx === 0 || currentStep === 'update' && idx === 1
                    ? 'bg-purple-600' 
                    : 'bg-white/10'
                }`}></div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step 1: Search */}
      {currentStep === 'search' && (
        <div className="space-y-6">
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
            <h3 className="font-semibold text-purple-300 mb-2">Step 1: Find Pair by Token Types</h3>
            <p className="text-sm text-gray-400">
              Enter the full token types to look up the pair. Token types must be in the format: 
              <code className="ml-1 bg-white/5 px-2 py-0.5 rounded text-purple-300">0xPACKAGE::module::Type</code>
            </p>
          </div>

          {renderTokenInput('Token0 Type', token0Type, setToken0Type, showToken0Dropdown, setShowToken0Dropdown, 'e.g., 0x2::sui::SUI')}
          {renderTokenInput('Token1 Type', token1Type, setToken1Type, showToken1Dropdown, setShowToken1Dropdown, 'e.g., 0xefc...::victory_token::VICTORY_TOKEN')}

          <button 
            type="button" 
            onClick={handleSwapTokens} 
            disabled={!token0Type || !token1Type}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-300 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            <span>⇅</span> Swap Token Order
          </button>

          {warning && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <p className="text-sm text-yellow-400">⚠️ {warning}</p>
            </div>
          )}

          <button 
            type="button" 
            onClick={handleFindPair} 
            disabled={!token0Type || !token1Type || isSearching}
            className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all shadow-lg shadow-purple-500/30"
          >
            {isSearching ? 'Searching...' : 'Find Pair'}
          </button>
        </div>
      )}

      {/* Step 2: Review */}
      {currentStep === 'review' && pairLookup && currentAddresses && (
        <div className="space-y-6">
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <h3 className="font-semibold text-green-300 mb-2">✓ Pair Found</h3>
            <p className="text-sm text-gray-300">{pairLookup.pairDisplayName}</p>
            <p className="text-xs text-gray-400 font-mono mt-1 flex items-center gap-2">
              {PairService.formatAddress(pairLookup.pairAddress!, 8, 6)}
              <button 
                onClick={() => copyToClipboard(pairLookup.pairAddress!)}
                className="text-purple-400 hover:text-purple-300 transition-colors"
                title="Copy address"
              >
                📋
              </button>
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <h4 className="font-semibold text-gray-200 mb-4">Current Fee Addresses</h4>
            <div className="space-y-3 text-sm">
              {[
                ['Team1 Address', currentAddresses.team1, 'Team allocation (40% of team fees)'],
                ['Team2 Address', currentAddresses.team2, 'Team allocation (50% of team fees)'],
                ['Dev Address', currentAddresses.dev, 'Development fund (10% of team fees)'],
                ['Locker Address', currentAddresses.locker, 'Victory token locker contract'],
                ['Buyback Address', currentAddresses.buyback, 'Token buyback and burn contract']
              ].map(([label, addr, desc]) => (
                <div key={label as string} className="flex justify-between items-start gap-4 pb-3 border-b border-white/5 last:border-0">
                  <div>
                    <div className="text-gray-400 text-xs mb-1">{label}</div>
                    <div className="text-gray-500 text-xs">{desc}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-gray-300">{PairService.formatAddress(addr as string)}</span>
                    <button 
                      onClick={() => copyToClipboard(addr as string)}
                      className="text-purple-400 hover:text-purple-300 transition-colors"
                      title="Copy address"
                    >
                      📋
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button 
              type="button" 
              onClick={handleReset} 
              className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-gray-300 hover:bg-white/10 transition-colors"
            >
              ← Search Another Pair
            </button>
            <button 
              type="button" 
              onClick={() => { 
                setCurrentStep('update'); 
                setSuccess(null); 
                setError(null); 
              }} 
              className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-all shadow-lg shadow-purple-500/30"
            >
              Update Addresses →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Update */}
      {currentStep === 'update' && pairLookup && currentAddresses && (
        <div className="space-y-6">
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
            <h3 className="font-semibold text-purple-300 mb-2">Step 3: Update Fee Addresses</h3>
            <p className="text-sm text-gray-400">Enter new addresses for <span className="text-purple-300">{pairLookup.pairDisplayName}</span> pair</p>
          </div>

          <button 
            type="button" 
            onClick={() => setNewAddresses({ 
              team1: currentAddresses.team1, 
              team2: currentAddresses.team2, 
              dev: currentAddresses.dev, 
              locker: currentAddresses.locker, 
              buyback: currentAddresses.buyback 
            })} 
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-300 hover:bg-white/10 text-sm transition-colors"
          >
            📋 Copy Current Addresses
          </button>

          <div className="space-y-4">
            {renderAddressInput('Team1 Address (40%)', 'team1', '0x...', 'Team allocation (40% of team fees)')}
            {renderAddressInput('Team2 Address (50%)', 'team2', '0x...', 'Team allocation (50% of team fees)')}
            {renderAddressInput('Dev Address (10%)', 'dev', '0x...', 'Development fund (10% of team fees)')}
            {renderAddressInput('Locker Address', 'locker', '0x...', 'Victory token locker contract')}
            {renderAddressInput('Buyback Address', 'buyback', '0x...', 'Token buyback and burn contract')}
          </div>

          <div className="flex gap-3">
            <button 
              type="button" 
              onClick={() => setCurrentStep('review')} 
              className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-gray-300 hover:bg-white/10 transition-colors"
            >
              ← Back
            </button>
            <button 
              type="button" 
              onClick={handleUpdateAddresses} 
              disabled={isSubmitting || !connected}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all shadow-lg shadow-green-500/30"
            >
              {isSubmitting ? 'Updating...' : 'Update Addresses'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}