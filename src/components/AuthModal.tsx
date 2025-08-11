import React, { useState } from 'react'
import { useWallet, ConnectButton } from '@suiet/wallet-kit'
import { useAuth } from '../contexts/AuthContext'

// Icons
interface IconProps {
  className?: string
}

function LockIcon({ className = "w-6 h-6" }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  )
}

function KeyIcon({ className = "w-6 h-6" }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    </svg>
  )
}

function UserIcon({ className = "w-6 h-6" }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )
}

function EyeIcon({ className = "w-6 h-6" }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  )
}

function EyeOffIcon({ className = "w-6 h-6" }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
    </svg>
  )
}

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onAuthenticated: () => void
}

const ADMIN_ADDRESS = '0x9b15baa31a2d308bd09f9258f0a9db09da3d4e8e113cf1888efa919d9778fa7c'

export function AuthModal({ isOpen, onClose, onAuthenticated }: AuthModalProps) {
  const { account } = useWallet()
  const { setIsAuthenticated, setAuthMethod } = useAuth()
  const [localAuthMethod, setLocalAuthMethod] = useState<'key' | 'address'>('key')
  const [secretKey, setSecretKey] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const validateSecretKey = (key: string): boolean => {
    // Get secret key from environment variable
    const validKey = import.meta.env.VITE_ADMIN_SECRET_KEY
    return key === validKey
  }

  const validateAdminAddress = (): boolean => {
    if (!account?.address) return false
    return account.address.toLowerCase() === ADMIN_ADDRESS.toLowerCase()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      let isValid = false

      if (localAuthMethod === 'key') {
        if (!secretKey.trim()) {
          setError('Please enter the secret key')
          setLoading(false)
          return
        }
        isValid = validateSecretKey(secretKey.trim())
        if (!isValid) {
          setError('Invalid secret key')
        }
      } else {
        isValid = validateAdminAddress()
        if (!isValid) {
          setError('Your wallet address is not authorized for admin access')
        }
      }

      if (isValid) {
        // Add a small delay for better UX
        await new Promise(resolve => setTimeout(resolve, 500))
        setIsAuthenticated(true)
        setAuthMethod(localAuthMethod === 'key' ? 'secret' : 'wallet')
        onAuthenticated()
        setSecretKey('')
        setError('')
      }
    } catch (err) {
      setError('Authentication failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Blurred background with same gradient as main app */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Animated background stars */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
          <div className="absolute top-40 right-20 w-1 h-1 bg-purple-300 rounded-full animate-pulse"></div>
          <div className="absolute bottom-40 left-20 w-1.5 h-1.5 bg-blue-300 rounded-full animate-pulse"></div>
          <div className="absolute top-60 right-40 w-1 h-1 bg-white rounded-full animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
          <div className="absolute top-32 left-1/3 w-1 h-1 bg-blue-200 rounded-full animate-pulse"></div>
        </div>
        {/* Blur overlay */}
        <div className="absolute inset-0 backdrop-blur-sm bg-black/20"></div>
      </div>
      
      {/* Modal */}
      <div className="relative bg-slate-800/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <LockIcon className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Admin Authentication Required</h2>
          <p className="text-slate-300 text-sm">
            Verify your credentials to access the admin portal
          </p>
        </div>

        {/* Auth method selector */}
        <div className="flex bg-slate-900/50 rounded-xl p-1 mb-6">
          <button
            type="button"
            onClick={() => setLocalAuthMethod('key')}
            className={`flex-1 flex items-center justify-center py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
              localAuthMethod === 'key'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <KeyIcon className="w-4 h-4 mr-2" />
            Secret Key
          </button>
          <button
            type="button"
            onClick={() => setLocalAuthMethod('address')}
            className={`flex-1 flex items-center justify-center py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
              localAuthMethod === 'address'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <UserIcon className="w-4 h-4 mr-2" />
            Admin Address
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {localAuthMethod === 'key' ? (
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Secret Key
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  placeholder="Enter admin secret key"
                  className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 pr-12 text-white placeholder-slate-400 focus:outline-none focus:border-purple-500/50 transition-colors duration-200"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors duration-200"
                >
                  {showPassword ? (
                    <EyeOffIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Wallet Connection
              </label>
              
              {!account?.address ? (
                <div className="space-y-4">
                  <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3">
                    <p className="text-slate-400 text-sm text-center">Connect your wallet to verify admin address</p>
                  </div>
                  <div className="flex justify-center">
                    <ConnectButton style={{
                      background: 'linear-gradient(to right, #9333ea, #2563eb)',
                      color: 'white',
                      fontWeight: '600',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      border: 'none',
                      transition: 'all 0.2s'
                    }} />
                  </div>
                </div>
              ) : (
                <div>
                  <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 mb-3">
                    <p className="text-white font-mono text-sm break-all">
                      {account.address}
                    </p>
                  </div>
                  <div className="mb-4">
                    <p className="text-xs text-slate-400">
                      Expected: <span className="font-mono break-all">{ADMIN_ADDRESS}</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || (localAuthMethod === 'address' && !account?.address) || (localAuthMethod === 'key' && !secretKey.trim())}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 shadow-lg"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Verifying...
              </div>
            ) : (
              'Authenticate'
            )}
          </button>
        </form>

        {/* Help text */}
        <div className="mt-6 pt-6 border-t border-slate-700/30">
          <p className="text-xs text-slate-400 text-center">
            {localAuthMethod === 'key' 
              ? 'Enter the admin secret key to gain access to the portal'
              : 'Connect with an authorized admin wallet address'
            }
          </p>
        </div>
      </div>
    </div>
  )
}