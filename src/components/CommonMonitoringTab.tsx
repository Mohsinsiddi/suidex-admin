// components/CommonMonitoringTab.tsx
import React, { useState } from 'react'
import PoolMonitoringTab from './PoolMonitoringTab'
import DexMonitoringTab from './DexMonitoringTab'
import FarmMonitoringTab from './FarmMonitoringTab'
import { 
  MonitorIcon,
  PoolIcon,
  ActivityIcon,
  DexIcon
} from './icons'

// Farm icon
export const FarmIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
  </svg>
)

type MonitoringTabType = 'pool' | 'dex' | 'farm'

interface MonitoringTabConfig {
  id: MonitoringTabType
  label: string
  icon: React.ReactNode
  component: React.ComponentType
  badge?: string
  description: string
}

const MONITORING_TABS: MonitoringTabConfig[] = [
  {
    id: 'pool',
    label: 'Pool Events',
    icon: <PoolIcon />,
    component: PoolMonitoringTab,
    description: 'Pool creation and configuration events'
  },
  {
    id: 'dex',
    label: 'DEX Events',
    icon: <DexIcon />,
    component: DexMonitoringTab,
    description: 'Trading and liquidity events'
  },
  {
    id: 'farm',
    label: 'Farm Events',
    icon: <FarmIcon />,
    component: FarmMonitoringTab,
    badge: 'New',
    description: 'Staking, rewards, and farm management'
  }
]

export default function CommonMonitoringTab() {
  const [activeTab, setActiveTab] = useState<MonitoringTabType>('pool')

  const activeTabConfig = MONITORING_TABS.find(tab => tab.id === activeTab)
  const ActiveComponent = activeTabConfig?.component || PoolMonitoringTab

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">System Monitoring</h2>
          <p className="text-slate-400">Track all protocol events and activities across different components</p>
        </div>
        <div className="flex items-center space-x-2">
          <MonitorIcon className="w-5 h-5 text-purple-400" />
          <span className="text-slate-300 text-sm">Real-time monitoring</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-4">
        <div className="flex flex-col space-y-3">
          {/* Tab Buttons */}
          <div className="flex space-x-1">
            {MONITORING_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-600/20 to-blue-600/20 text-white border border-purple-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-5 h-5 ${activeTab === tab.id ? 'text-purple-400' : ''}`}>
                    {tab.icon}
                  </div>
                  <span className="font-medium">{tab.label}</span>
                </div>
                {tab.badge && (
                  <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full ml-2">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
          
          {/* Active Tab Description */}
          {activeTabConfig && (
            <div className="px-4 py-2 bg-slate-700/30 rounded-lg border border-slate-600/30">
              <p className="text-slate-300 text-sm">
                <span className="text-purple-400 font-medium">{activeTabConfig.label}:</span> {activeTabConfig.description}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        <ActiveComponent />
      </div>
      
      {/* Footer Info */}
      <div className="bg-slate-800/20 backdrop-blur-xl border border-slate-700/30 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-slate-300 text-sm">Live monitoring active</span>
            </div>
            <div className="text-slate-400 text-sm">
              Events update every 30 seconds
            </div>
          </div>
          <div className="text-slate-400 text-sm">
            Network: Sui Testnet
          </div>
        </div>
      </div>
    </div>
  )
}