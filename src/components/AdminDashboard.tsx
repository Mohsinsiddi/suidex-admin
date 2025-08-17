// components/AdminDashboard.tsx
import React, { useState } from 'react'
import { useWallet } from '@suiet/wallet-kit'
import { useAuth } from '../contexts/AuthContext'
import { AdminHeader } from './AdminHeader'
import PoolManagement from './PoolManagement'
import CommonMonitoringTab from './CommonMonitoringTab'
import VictoryTokenControl from './VictoryTokenControl'
import EmissionManagement from './EmissionManagement'
import FactoryTab from './FactoryTab'
import TokenLockerTab from './TokenLockerTab'
import { 
  OverviewIcon, 
  PoolIcon, 
  TokenIcon, 
  EmissionIcon, 
  FactoryIcon, 
  LockerIcon, 
  AnalyticsIcon,
  MonitorIcon
} from './icons'
import EnhancedOverviewTab from './TVLOverview'

// Icons for auth status
interface IconProps {
  className?: string
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

type ActiveTab = 'overview' | 'pools' | 'monitoring' | 'tokens' | 'emissions' | 'factory' | 'locker'

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview')
  const [showAuthDetails, setShowAuthDetails] = useState(false)
  const { connected, account } = useWallet()
  const { authMethod, logout } = useAuth()

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <AdminHeader />
      
      <div className="flex">
        {/* Sidebar with Auth Status */}
        <div className="w-64 bg-slate-800/30 backdrop-blur-xl border-r border-slate-700/30 min-h-[calc(100vh-80px)] flex flex-col">
          <div className="p-6 flex-1">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg"></div>
              <h2 className="text-white font-bold text-lg">Admin Panel</h2>
            </div>
            
            <nav className="space-y-2">
              <NavItem
                icon={<OverviewIcon />}
                label="Overview"
                active={activeTab === 'overview'}
                onClick={() => setActiveTab('overview')}
              />
              <NavItem
                icon={<PoolIcon />}
                label="Pool Management"
                active={activeTab === 'pools'}
                onClick={() => setActiveTab('pools')}
              />
              <NavItem
                icon={<MonitorIcon />}
                label="Monitoring"
                active={activeTab === 'monitoring'}
                onClick={() => setActiveTab('monitoring')}
                badge=""
              />
              <NavItem
                icon={<TokenIcon />}
                label="Token Control"
                active={activeTab === 'tokens'}
                onClick={() => setActiveTab('tokens')}
              />
              <NavItem
                icon={<EmissionIcon />}
                label="Emissions"
                active={activeTab === 'emissions'}
                onClick={() => setActiveTab('emissions')}
              />
              <NavItem
                icon={<FactoryIcon />}
                label="DEX Factory"
                active={activeTab === 'factory'}
                onClick={() => setActiveTab('factory')}
              />
              <NavItem
                icon={<LockerIcon />}
                label="Token Locker"
                active={activeTab === 'locker'}
                onClick={() => setActiveTab('locker')}
              />
            </nav>
          </div>

          {/* Auth Status Section - Bottom of Sidebar */}
          <div className="p-6 border-t border-slate-700/30">
            <div className="relative">
              <button
                onClick={() => setShowAuthDetails(!showAuthDetails)}
                className="w-full flex items-center justify-between bg-slate-700/50 hover:bg-slate-700/70 px-3 py-2 rounded-lg transition-all duration-200 border border-slate-600/30"
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
                  
                  <div className="text-left">
                    <div className="text-white text-sm font-medium">
                      {authMethod === 'secret' ? 'Secret Auth' : 'Wallet Auth'}
                    </div>
                    <div className="text-slate-400 text-xs">
                      {connected ? 'Connected' : 'View Only'}
                    </div>
                  </div>
                </div>
                <ChevronDownIcon className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${showAuthDetails ? 'rotate-180' : ''}`} />
              </button>

              {/* Auth Details Dropdown */}
              {showAuthDetails && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-slate-900/98 backdrop-blur-xl border border-slate-700/50 rounded-lg shadow-2xl z-[9999]">
                  {/* Header */}
                  <div className="p-3 border-b border-slate-700/30">
                    <h3 className="text-white font-medium text-sm">Session Details</h3>
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
                          {authMethod === 'secret' ? 'Secret Key' : 'Admin Wallet'}
                        </span>
                      </div>
                      <span className="text-green-400 text-sm">✓ Active</span>
                    </div>

                    {/* Wallet Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <WalletIcon className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-300 text-sm">Wallet</span>
                      </div>
                      <span className={`text-sm ${connected ? 'text-green-400' : 'text-yellow-400'}`}>
                        {connected ? '✓ Connected' : '⚠ Disconnected'}
                      </span>
                    </div>

                    {/* Wallet Address if connected */}
                    {connected && account?.address && (
                      <div className="bg-slate-700/30 rounded p-2">
                        <div className="text-slate-400 text-xs mb-1">Connected:</div>
                        <div className="text-white font-mono text-xs break-all">
                          {account.address.slice(0, 8)}...{account.address.slice(-6)}
                        </div>
                      </div>
                    )}

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
          </div>

          {/* Click outside to close dropdown */}
          {showAuthDetails && (
            <div 
              className="fixed inset-0 z-[9998]" 
              onClick={() => setShowAuthDetails(false)}
            />
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'pools' && <PoolManagement />}
          {activeTab === 'monitoring' && <CommonMonitoringTab />}
          {activeTab === 'tokens' && <VictoryTokenControl />}
          {activeTab === 'emissions' && <EmissionsTab />}
          {activeTab === 'factory' && <FactoryTabRender />}
          {activeTab === 'locker' && <LockerTab />}
        </div>
      </div>
    </div>
  )
}

// Navigation Item Component
interface NavItemProps {
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
  badge?: string
}

function NavItem({ icon, label, active, onClick, badge }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 ${
        active
          ? 'bg-gradient-to-r from-purple-600/20 to-blue-600/20 text-white border border-purple-500/30'
          : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
      }`}
    >
      <div className="flex items-center space-x-3">
        <div className={`w-5 h-5 ${active ? 'text-purple-400' : ''}`}>
          {icon}
        </div>
        <span className="font-medium">{label}</span>
      </div>
      {badge && (
        <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">
          {badge}
        </span>
      )}
    </button>
  )
}

// Tab Components (same as before)
function OverviewTab() {
  return (
   <EnhancedOverviewTab />
  )
}

function EmissionsTab() {
  return <EmissionManagement />
}

function FactoryTabRender() {
  return (
    <FactoryTab/>
  )
}

function LockerTab() {
  return (
   <TokenLockerTab />
  )
}
