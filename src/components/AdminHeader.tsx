import React from 'react'
import { ConnectButton, useWallet } from '@suiet/wallet-kit'

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

function ShieldIcon({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  )
}

export function AdminHeader() {
  const { connected } = useWallet()

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

          {/* Right side - Search and Wallet */}
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
    </header>
  )
}