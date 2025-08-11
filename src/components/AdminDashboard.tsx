// components/AdminDashboard.tsx
import React, { useState } from 'react'
import { AdminHeader } from './AdminHeader'
import PoolManagement from './PoolManagement'
import CommonMonitoringTab from './CommonMonitoringTab'
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

type ActiveTab = 'overview' | 'pools' | 'monitoring' | 'tokens' | 'emissions' | 'factory' | 'locker' | 'analytics'

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview')

  // Remove the wallet connection check - auth is handled by AuthContext
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <AdminHeader />
      
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-slate-800/30 backdrop-blur-xl border-r border-slate-700/30 min-h-[calc(100vh-80px)]">
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
          {activeTab === 'monitoring' && <CommonMonitoringTab />}
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

// Tab Components
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

      {/* Quick Actions */}
      <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-4 py-3 rounded-lg transition-all duration-200">
            Create New Pool
          </button>
          <button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold px-4 py-3 rounded-lg transition-all duration-200">
            Update Emissions
          </button>
          <button className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-semibold px-4 py-3 rounded-lg transition-all duration-200">
            Emergency Pause
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-slate-700/30">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <div className="text-white font-medium">SUI/USDC LP Pool Created</div>
                <div className="text-slate-400 text-sm">Allocation: 1500 points</div>
              </div>
            </div>
            <div className="text-slate-500 text-sm">2h ago</div>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-slate-700/30">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <div className="text-white font-medium">WBTC Pool Updated</div>
                <div className="text-slate-400 text-sm">Allocation increased to 800</div>
              </div>
            </div>
            <div className="text-slate-500 text-sm">5h ago</div>
          </div>
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <div className="text-white font-medium">Victory Tokens Deposited</div>
                <div className="text-slate-400 text-sm">10,000 VICTORY added to vault</div>
              </div>
            </div>
            <div className="text-slate-500 text-sm">1d ago</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function TokenControlTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-4">Token Control</h2>
      
      {/* Victory Token Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
          <div className="text-slate-400 text-sm">Total Supply</div>
          <div className="text-2xl font-bold text-white mt-1">100M VICTORY</div>
          <div className="text-blue-400 text-sm mt-1">Fixed supply</div>
        </div>
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
          <div className="text-slate-400 text-sm">Circulating</div>
          <div className="text-2xl font-bold text-white mt-1">25.4M</div>
          <div className="text-green-400 text-sm mt-1">25.4% of supply</div>
        </div>
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
          <div className="text-slate-400 text-sm">In Vault</div>
          <div className="text-2xl font-bold text-white mt-1">74.6M</div>
          <div className="text-purple-400 text-sm mt-1">Ready for rewards</div>
        </div>
      </div>

      {/* Token Actions */}
      <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Token Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-3 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Deposit to Vault</span>
          </button>
          <button className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-4 py-3 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V19a2 2 0 002 2h4a2 2 0 002-2V7m-6 0h6" />
            </svg>
            <span>Sweep Vault</span>
          </button>
        </div>
      </div>

      {/* Token Distribution */}
      <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Token Distribution</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-slate-300">LP Rewards</span>
            <span className="text-white">60%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div className="bg-blue-500 h-2 rounded-full" style={{ width: '60%' }}></div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-slate-300">Single Asset Rewards</span>
            <span className="text-white">25%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div className="bg-purple-500 h-2 rounded-full" style={{ width: '25%' }}></div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-slate-300">Reserved</span>
            <span className="text-white">15%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '15%' }}></div>
          </div>
        </div>
      </div>
    </div>
  )
}

function EmissionsTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-4">Emissions Control</h2>
      
      {/* Emission Schedule */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Current Schedule</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-300">Current Week</span>
              <span className="text-white">12 / 156</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">LP Allocation</span>
              <span className="text-blue-400">75%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Single Allocation</span>
              <span className="text-purple-400">25%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Status</span>
              <span className="text-green-400">Active</span>
            </div>
          </div>
        </div>
        
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Weekly Emissions</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-300">This Week</span>
              <span className="text-white">50,000 VICTORY</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Next Week</span>
              <span className="text-slate-400">49,500 VICTORY</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Total Distributed</span>
              <span className="text-green-400">600,000 VICTORY</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Remaining</span>
              <span className="text-yellow-400">7.2M VICTORY</span>
            </div>
          </div>
        </div>
      </div>

      {/* Emission Controls */}
      <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Emergency Controls</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-4 py-3 rounded-lg transition-all duration-200">
            Pause Emissions
          </button>
          <button className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-3 rounded-lg transition-all duration-200">
            Resume Emissions
          </button>
        </div>
      </div>
    </div>
  )
}

function FactoryTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-4">Factory Control</h2>
      
      {/* Protocol Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
          <div className="text-slate-400 text-sm">Protocol Status</div>
          <div className="text-2xl font-bold text-green-400 mt-1">Active</div>
          <div className="text-slate-300 text-sm mt-1">All systems operational</div>
        </div>
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
          <div className="text-slate-400 text-sm">Total Pairs</div>
          <div className="text-2xl font-bold text-white mt-1">45</div>
          <div className="text-blue-400 text-sm mt-1">LP tokens available</div>
        </div>
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
          <div className="text-slate-400 text-sm">Factory Fee</div>
          <div className="text-2xl font-bold text-white mt-1">0.3%</div>
          <div className="text-purple-400 text-sm mt-1">Per swap</div>
        </div>
      </div>

      {/* Factory Actions */}
      <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Factory Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
            <div>
              <div className="text-white font-medium">Allow New Pairs</div>
              <div className="text-slate-400 text-sm">Enable creation of new LP pairs</div>
            </div>
            <div className="w-12 h-6 bg-green-500 rounded-full relative">
              <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5"></div>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
            <div>
              <div className="text-white font-medium">Protocol Fees</div>
              <div className="text-slate-400 text-sm">Collect fees to protocol treasury</div>
            </div>
            <div className="w-12 h-6 bg-green-500 rounded-full relative">
              <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function LockerTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-4">Token Locker</h2>
      
      {/* Locker Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
          <div className="text-slate-400 text-sm">Total Locked</div>
          <div className="text-2xl font-bold text-white mt-1">2.5M VICTORY</div>
          <div className="text-green-400 text-sm mt-1">6 months avg lock</div>
        </div>
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
          <div className="text-slate-400 text-sm">SUI Revenue</div>
          <div className="text-2xl font-bold text-white mt-1">125.4 SUI</div>
          <div className="text-blue-400 text-sm mt-1">This week</div>
        </div>
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
          <div className="text-slate-400 text-sm">Active Locks</div>
          <div className="text-2xl font-bold text-white mt-1">234</div>
          <div className="text-purple-400 text-sm mt-1">Unique lockers</div>
        </div>
      </div>

      {/* Revenue Distribution */}
      <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Revenue Distribution</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-slate-300">To Lockers</span>
              <span className="text-white">80% (100.32 SUI)</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: '80%' }}></div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-slate-300">Protocol Treasury</span>
              <span className="text-white">20% (25.08 SUI)</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: '20%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Lock Management */}
      <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Lock Management</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-3 rounded-lg transition-all duration-200">
            View All Locks
          </button>
          <button className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-3 rounded-lg transition-all duration-200">
            Distribute Revenue
          </button>
        </div>
      </div>
    </div>
  )
}

function AnalyticsTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-4">Analytics</h2>
      
      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
          <div className="text-slate-400 text-sm">Daily Volume</div>
          <div className="text-2xl font-bold text-white mt-1">$124.5K</div>
          <div className="text-green-400 text-sm mt-1">+15.2% vs yesterday</div>
        </div>
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
          <div className="text-slate-400 text-sm">Weekly Users</div>
          <div className="text-2xl font-bold text-white mt-1">1,847</div>
          <div className="text-blue-400 text-sm mt-1">+89 new users</div>
        </div>
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
          <div className="text-slate-400 text-sm">Avg APY</div>
          <div className="text-2xl font-bold text-white mt-1">45.6%</div>
          <div className="text-purple-400 text-sm mt-1">Across all pools</div>
        </div>
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
          <div className="text-slate-400 text-sm">Success Rate</div>
          <div className="text-2xl font-bold text-white mt-1">99.8%</div>
          <div className="text-green-400 text-sm mt-1">Transaction success</div>
        </div>
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">TVL Over Time</h3>
          <div className="h-64 bg-slate-700/30 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <svg className="w-12 h-12 text-slate-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-slate-400">Chart Coming Soon</p>
            </div>
          </div>
        </div>
        
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Pool Performance</h3>
          <div className="h-64 bg-slate-700/30 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <svg className="w-12 h-12 text-slate-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
              <p className="text-slate-400">Chart Coming Soon</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Performers */}
      <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Top Performing Pools</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-white">SUI/VICTORY LP</span>
            </div>
            <div className="text-right">
              <div className="text-white font-medium">68.2% APY</div>
              <div className="text-green-400 text-sm">$1.2M TVL</div>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span className="text-white">SUI/USDC LP</span>
            </div>
            <div className="text-right">
              <div className="text-white font-medium">42.1% APY</div>
              <div className="text-blue-400 text-sm">$2.1M TVL</div>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <span className="text-white">WBTC Single</span>
            </div>
            <div className="text-right">
              <div className="text-white font-medium">35.7% APY</div>
              <div className="text-purple-400 text-sm">$845K TVL</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}