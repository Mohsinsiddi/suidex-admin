import React, { useState } from 'react'
import { useWallet } from '@suiet/wallet-kit'
import PoolManagement from './PoolManagement'
import { 
  OverviewIcon, 
  PoolIcon, 
  TokenIcon, 
  EmissionIcon, 
  FactoryIcon, 
  LockerIcon, 
  AnalyticsIcon 
} from './icons'

type ActiveTab = 'overview' | 'pools' | 'tokens' | 'emissions' | 'factory' | 'locker' | 'analytics'

export default function AdminDashboard() {
  const { connected, account } = useWallet()
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview')

  if (!connected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Access Denied</h2>
          <p className="text-slate-400 mb-6">Please connect your wallet to access the admin dashboard</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-slate-800/30 backdrop-blur-xl border-r border-slate-700/30 min-h-screen">
          <div className="p-6">
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
                label="Factory"
                active={activeTab === 'factory'}
                onClick={() => setActiveTab('factory')}
              />
              <NavItem
                icon={<LockerIcon />}
                label="Token Locker"
                active={activeTab === 'locker'}
                onClick={() => setActiveTab('locker')}
              />
              <NavItem
                icon={<AnalyticsIcon />}
                label="Analytics"
                active={activeTab === 'analytics'}
                onClick={() => setActiveTab('analytics')}
              />
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'pools' && <PoolManagement />}
          {activeTab === 'tokens' && <TokenControlTab />}
          {activeTab === 'emissions' && <EmissionsTab />}
          {activeTab === 'factory' && <FactoryTab />}
          {activeTab === 'locker' && <LockerTab />}
          {activeTab === 'analytics' && <AnalyticsTab />}
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
}

function NavItem({ icon, label, active, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
        active
          ? 'bg-gradient-to-r from-purple-600/20 to-blue-600/20 text-white border border-purple-500/30'
          : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
      }`}
    >
      <div className={`w-5 h-5 ${active ? 'text-purple-400' : ''}`}>
        {icon}
      </div>
      <span className="font-medium">{label}</span>
    </button>
  )
}

// Tab Components (Placeholders for now)
function OverviewTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">System Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
          <div className="text-slate-400 text-sm">Total Value Locked</div>
          <div className="text-2xl font-bold text-white mt-1">$4.68M</div>
          <div className="text-green-400 text-sm mt-1">+12.5% this week</div>
        </div>
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
          <div className="text-slate-400 text-sm">Active Pools</div>
          <div className="text-2xl font-bold text-white mt-1">12</div>
          <div className="text-blue-400 text-sm mt-1">3 LP + 9 Single</div>
        </div>
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
          <div className="text-slate-400 text-sm">Total Users</div>
          <div className="text-2xl font-bold text-white mt-1">1,234</div>
          <div className="text-purple-400 text-sm mt-1">+89 this week</div>
        </div>
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
          <div className="text-slate-400 text-sm">Emission Week</div>
          <div className="text-2xl font-bold text-white mt-1">12 / 156</div>
          <div className="text-yellow-400 text-sm mt-1">Active</div>
        </div>
      </div>
    </div>
  )
}

function TokenControlTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-4">Token Control</h2>
      <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-8 text-center">
        <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <TokenIcon />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Coming Soon</h3>
        <p className="text-slate-400">Victory token minting and management features</p>
      </div>
    </div>
  )
}

function EmissionsTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-4">Emissions Control</h2>
      <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-8 text-center">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <EmissionIcon />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Coming Soon</h3>
        <p className="text-slate-400">156-week emission schedule management</p>
      </div>
    </div>
  )
}

function FactoryTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-4">Factory Control</h2>
      <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-8 text-center">
        <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <FactoryIcon />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Coming Soon</h3>
        <p className="text-slate-400">Protocol settings and pause controls</p>
      </div>
    </div>
  )
}

function LockerTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-4">Token Locker</h2>
      <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-8 text-center">
       <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <LockerIcon />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Coming Soon</h3>
        <p className="text-slate-400">Victory token locks and SUI revenue management</p>
      </div>
    </div>
  )
}

function AnalyticsTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-4">Analytics</h2>
      <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-8 text-center">
        <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <AnalyticsIcon />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Coming Soon</h3>
        <p className="text-slate-400">System metrics and performance monitoring</p>
      </div>
    </div>
  )
}