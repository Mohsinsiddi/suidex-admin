import React, { useState } from 'react'
import { ConnectButton, useWallet } from '@suiet/wallet-kit'
import AdminDashboard from './components/AdminDashboard'
import { 
  PoolIcon, 
  TokenIcon, 
  EmissionIcon, 
  FactoryIcon, 
  LockerIcon, 
  AnalyticsIcon,
  SearchIcon,
  CheckIcon,
  LockIcon
} from './components/icons'

function App() {
  const { connected, account } = useWallet()
  const [showDashboard, setShowDashboard] = useState(false)

  // Show admin dashboard if user clicked "Access Admin Dashboard"
  if (showDashboard && connected) {
    return <AdminDashboard />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated background stars */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-20 w-1 h-1 bg-purple-300 rounded-full animate-pulse"></div>
        <div className="absolute bottom-40 left-20 w-1.5 h-1.5 bg-blue-300 rounded-full animate-pulse"></div>
        <div className="absolute top-60 right-40 w-1 h-1 bg-white rounded-full animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
        <div className="absolute top-32 left-1/3 w-1 h-1 bg-blue-200 rounded-full animate-pulse"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-slate-700/30 backdrop-blur-sm bg-slate-900/20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl font-bold text-white">
                SuiDeX
              </h1>
              <nav className="hidden md:flex space-x-6">
                <span className="text-white font-medium bg-purple-600/20 px-3 py-1 rounded-md">Admin</span>
                <a 
                  href="https://dex.suidex.org/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-slate-300 hover:text-white cursor-pointer transition-colors duration-200"
                >
                  DEX
                </a>
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden md:block">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search tokens..."
                    className="bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2 pl-10 text-white placeholder-slate-400 focus:outline-none focus:border-purple-500/50 w-64"
                  />
                  <SearchIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                </div>
              </div>
              <ConnectButton style={{
                background: 'linear-gradient(to right, #9333ea, #2563eb)',
                color: 'white',
                fontWeight: '600',
                padding: '10px 24px',
                borderRadius: '12px',
                border: 'none',
                transition: 'all 0.2s'
              }} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Admin Portal
          </h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Comprehensive administrative controls for the SuiDeX protocol. Manage pools, emissions, tokens, and monitor system health with professional-grade tools.
          </p>
        </div>

        {connected ? (
          <div className="max-w-4xl mx-auto">
            {/* Connected State */}
            <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-2xl p-8 mb-8">
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                  <CheckIcon className="w-8 h-8 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white text-center mb-4">Wallet Connected</h3>
              <div className="bg-slate-900/50 rounded-xl p-4 mb-6">
                <p className="text-slate-300 text-sm text-center break-all font-mono">
                  {account?.address}
                </p>
              </div>
              <div className="text-center">
                <button 
                  onClick={() => setShowDashboard(true)}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  Access Admin Dashboard →
                </button>
              </div>
            </div>

            {/* Admin Modules Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AdminCard 
                icon={<PoolIcon className="w-6 h-6 text-slate-300 group-hover:text-purple-400 transition-colors duration-200" />}
                title="Pool Management"
                description="Create and manage liquidity pools, adjust allocation points and fees"
                status="Active"
                statusColor="green"
              />
              <AdminCard 
                icon={<TokenIcon className="w-6 h-6 text-slate-300 group-hover:text-purple-400 transition-colors duration-200" />}
                title="Token Control"
                description="Mint Victory tokens, manage vaults and reward distributions"
                status="Ready"
                statusColor="blue"
              />
              <AdminCard 
                icon={<EmissionIcon className="w-6 h-6 text-slate-300 group-hover:text-purple-400 transition-colors duration-200" />}
                title="Emissions"
                description="Monitor and control the 156-week emission schedule"
                status="Week 12"
                statusColor="purple"
              />
              <AdminCard 
                icon={<FactoryIcon className="w-6 h-6 text-slate-300 group-hover:text-purple-400 transition-colors duration-200" />}
                title="Factory"
                description="Protocol-wide settings, pause controls and address management"
                status="Online"
                statusColor="green"
              />
              <AdminCard 
                icon={<LockerIcon className="w-6 h-6 text-slate-300 group-hover:text-purple-400 transition-colors duration-200" />}
                title="Token Locker"
                description="Manage Victory token locks, SUI revenue distribution"
                status="Active"
                statusColor="yellow"
              />
              <AdminCard 
                icon={<AnalyticsIcon className="w-6 h-6 text-slate-300 group-hover:text-purple-400 transition-colors duration-200" />}
                title="Analytics"
                description="System metrics, user activity and performance monitoring"
                status="Live"
                statusColor="blue"
              />
            </div>
          </div>
        ) : (
          <div className="max-w-lg mx-auto">
            {/* Disconnected State */}
            <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-2xl p-8 text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <LockIcon className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h3>
              <p className="text-slate-300 mb-8 leading-relaxed">
                Connect your Sui wallet to access administrative functions. Only authorized admin wallets can perform protocol operations.
              </p>
              <ConnectButton style={{
                background: 'linear-gradient(to right, #9333ea, #2563eb)',
                color: 'white',
                fontWeight: '600',
                padding: '16px 32px',
                borderRadius: '12px',
                border: 'none',
                transition: 'all 0.2s',
                boxShadow: '0 10px 25px rgba(147, 51, 234, 0.3)'
              }} />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-700/30 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-slate-400 mb-4 md:mb-0">
              © 2024 SuiDeX Protocol • Admin Portal v1.0
            </div>
            <div className="flex space-x-6 text-slate-400 text-sm">
              <span>System Status: Online</span>
              <span>•</span>
              <span>Network: Sui Testnet</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Admin Card Component
interface AdminCardProps {
  icon: React.ReactNode
  title: string
  description: string
  status: string
  statusColor: 'green' | 'blue' | 'purple' | 'yellow'
}

function AdminCard({ icon, title, description, status, statusColor }: AdminCardProps) {
  const statusColors = {
    green: 'bg-green-500/20 text-green-400',
    blue: 'bg-blue-500/20 text-blue-400',
    purple: 'bg-purple-500/20 text-purple-400',
    yellow: 'bg-yellow-500/20 text-yellow-400'
  }

  return (
    <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6 hover:border-purple-500/30 transition-all duration-200 group cursor-pointer">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-slate-700/50 rounded-lg flex items-center justify-center group-hover:bg-purple-600/20 transition-colors duration-200">
          {icon}
        </div>
        <span className={`px-2 py-1 rounded-md text-xs font-medium ${statusColors[statusColor]}`}>
          {status}
        </span>
      </div>
      <h4 className="text-lg font-semibold text-white mb-2">{title}</h4>
      <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
    </div>
  )
}

export default App

// File structure needed:
// src/
//   components/
//     icons.tsx (new centralized icons file)
//     AdminDashboard.tsx (updated with icon imports)
//     PoolManagement.tsx (updated with icon imports)
//   constants/
//     index.ts
//   utils/
//     suiClient.ts
//   App.tsx (updated with icon imports)
//   main.tsx
//   index.css