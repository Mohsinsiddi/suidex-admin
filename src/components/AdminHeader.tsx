import React, { useState } from 'react'
import { ConnectButton, useWallet } from '@suiet/wallet-kit'
import { useAuth } from '../contexts/AuthContext'

// Icons
interface IconProps {
  className?: string
}

function SearchIcon({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
}

function KeyIcon({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1721 9z" />
    </svg>
  )
}

function WalletIcon({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  )
}

function LogoutIcon({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  )
}

function ChevronDownIcon({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )
}

function ShieldIcon({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  )
}

export function AdminHeader() {
  const { connected, account } = useWallet()
  const { authMethod, logout } = useAuth()
  const [showAuthDetails, setShowAuthDetails] = useState(false)

  const handleLogout = () => {
    logout()
    // This will trigger the app to show auth modal again
  }

  return (
    <header className="bg-slate-800/30 backdrop-blur-xl border-b border-slate-700/30 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Left side - Logo and Nav */}
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <ShieldIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">SuiDeX Admin</h1>
                <div className="text-xs text-slate-400">Protocol Management</div>
              </div>
            </div>
            
            <nav className="hidden lg:flex space-x-6">
              <div className="flex items-center space-x-2 bg-purple-600/20 px-3 py-1.5 rounded-lg">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-white font-medium text-sm">Admin Portal</span>
              </div>
              <a 
                href="https://dex.suidex.org/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-slate-300 hover:text-white cursor-pointer transition-colors duration-200 text-sm px-3 py-1.5 rounded-lg hover:bg-slate-700/30"
              >
                Main DEX ↗
              </a>
            </nav>
          </div>

          {/* Right side - Search, Auth Status, Wallet */}
          <div className="flex items-center space-x-3">
            {/* Search */}
            <div className="hidden xl:block">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search pools, tokens..."
                  className="bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2 pl-10 text-white placeholder-slate-400 focus:outline-none focus:border-purple-500/50 w-72 text-sm"
                />
                <SearchIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              </div>
            </div>

            {/* Auth Status Dropdown - Made Bigger */}
            <div className="relative">
              <button
                onClick={() => setShowAuthDetails(!showAuthDetails)}
                className="flex items-center space-x-2 bg-slate-700/50 hover:bg-slate-700/70 px-3 py-2 rounded-lg transition-all duration-200 border border-slate-600/30"
              >
                <div className="flex items-center space-x-2">
                  {authMethod === 'secret' ? (
                    <KeyIcon className="w-4 h-4 text-green-400" />
                  ) : (
                    <WalletIcon className="w-4 h-4 text-blue-400" />
                  )}
                  
                  {/* Status indicator */}
                  {connected ? (
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  ) : authMethod === 'secret' ? (
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  ) : (
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  )}
                  
                  {/* Auth method text */}
                  <span className="text-white text-sm hidden sm:block">
                    {authMethod === 'secret' ? 'Secret' : 'Wallet'}
                  </span>
                </div>
                <ChevronDownIcon className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${showAuthDetails ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown with High Z-Index */}
              {showAuthDetails && (
                <div className="absolute right-0 top-full mt-1 w-64 bg-slate-900/98 backdrop-blur-xl border border-slate-700/50 rounded-lg shadow-2xl z-[9999]">
                  {/* Header */}
                  <div className="p-3 border-b border-slate-700/30">
                    <h3 className="text-white font-medium text-sm">Authentication Status</h3>
                  </div>
                  
                  <div className="p-3 space-y-3">
                    {/* Auth Method */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {authMethod === 'secret' ? (
                          <KeyIcon className="w-4 h-4 text-green-400" />
                        ) : (
                          <WalletIcon className="w-4 h-4 text-blue-400" />
                        )}
                        <span className="text-slate-300 text-sm">
                          {authMethod === 'secret' ? 'Secret Key Auth' : 'Admin Wallet Auth'}
                        </span>
                      </div>
                      <span className="text-green-400 text-sm">✓</span>
                    </div>

                    {/* Wallet Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <WalletIcon className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-300 text-sm">Wallet Connection</span>
                      </div>
                      <span className={`text-sm ${connected ? 'text-green-400' : 'text-yellow-400'}`}>
                        {connected ? '✓ Connected' : '⚠ Disconnected'}
                      </span>
                    </div>

                    {/* Warning for secret key auth without wallet */}
                    {authMethod === 'secret' && !connected && (
                      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-2">
                        <div className="text-yellow-400 text-xs">
                          Connect wallet to perform transactions
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Logout Button */}
                  <div className="p-3 border-t border-slate-700/30">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center space-x-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 px-3 py-2 rounded transition-colors duration-200 text-sm"
                    >
                      <LogoutIcon className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Compact Wallet Connect Button */}
            <ConnectButton style={{
              background: connected 
                ? 'linear-gradient(to right, #059669, #047857)' 
                : 'linear-gradient(to right, #9333ea, #2563eb)',
              color: 'white',
              fontWeight: '600',
              padding: '6px 12px',
              borderRadius: '8px',
              border: 'none',
              transition: 'all 0.2s',
              fontSize: '12px'
            }} />
          </div>
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {showAuthDetails && (
        <div 
          className="fixed inset-0 z-[9998]" 
          onClick={() => setShowAuthDetails(false)}
        />
      )}
    </header>
  )
}