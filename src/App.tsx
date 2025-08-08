import React from 'react'
import { ConnectButton, useWallet } from '@suiet/wallet-kit'

function App() {
  const { connected, account } = useWallet()

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
                <span className="text-white font-medium bg-purple-600/20 px-3 py-1 rounded-md">Admin Portal</span>
                <a 
                  href="https://dex.suidex.org/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-white font-medium bg-purple-600/20 px-3 py-1 rounded-md"
                >
                  DEX
                </a>
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden md:block">
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
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white text-center mb-4">Wallet Connected</h3>
              <div className="bg-slate-900/50 rounded-xl p-4 mb-6">
                <p className="text-slate-300 text-sm text-center break-all font-mono">
                  {account?.address}
                </p>
              </div>
              <div className="text-center">
                <button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg">
                  Access Admin Dashboard →
                </button>
              </div>
            </div>

            {/* Admin Modules Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AdminCard 
                icon={<PoolIcon />}
                title="Pool Management"
                description="Create and manage liquidity pools, adjust allocation points and fees"
                status="Active"
                statusColor="green"
              />
              <AdminCard 
                icon={<TokenIcon />}
                title="Token Control"
                description="Mint Victory tokens, manage vaults and reward distributions"
                status="Ready"
                statusColor="blue"
              />
              <AdminCard 
                icon={<EmissionIcon />}
                title="Emissions"
                description="Monitor and control the 156-week emission schedule"
                status="Week 12"
                statusColor="purple"
              />
              <AdminCard 
                icon={<FactoryIcon />}
                title="Factory"
                description="Protocol-wide settings, pause controls and address management"
                status="Online"
                statusColor="green"
              />
              <AdminCard 
                icon={<LockerIcon />}
                title="Token Locker"
                description="Manage Victory token locks, SUI revenue distribution"
                status="Active"
                statusColor="yellow"
              />
              <AdminCard 
                icon={<AnalyticsIcon />}
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
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
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
              <span>Network: Sui Mainnet</span>
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

// Icon Components
function PoolIcon() {
  return (
    <svg className="w-6 h-6 text-slate-300 group-hover:text-purple-400 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  )
}

function TokenIcon() {
  return (
    <svg className="w-6 h-6 text-slate-300 group-hover:text-purple-400 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
    </svg>
  )
}

function EmissionIcon() {
  return (
    <svg className="w-6 h-6 text-slate-300 group-hover:text-purple-400 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  )
}

function FactoryIcon() {
  return (
    <svg className="w-6 h-6 text-slate-300 group-hover:text-purple-400 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function LockerIcon() {
  return (
    <svg className="w-6 h-6 text-slate-300 group-hover:text-purple-400 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  )
}

function AnalyticsIcon() {
  return (
    <svg className="w-6 h-6 text-slate-300 group-hover:text-purple-400 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )
}

export default App