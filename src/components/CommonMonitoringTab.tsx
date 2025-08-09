// components/CommonMonitoringTab.tsx
import React, { useState } from 'react'
import PoolMonitoringTab from './PoolMonitoringTab'
import DexMonitoringTab from './DexMonitoringTab'
import FarmMonitoringTab from './FarmMonitoringTab'
import GlobalEmissionMonitoringTab from './GlobalEmissionMonitoringTab'
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

// Global Emission icon
export const GlobalEmissionIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
)

type MonitoringTabType = 'pool' | 'dex' | 'farm' | 'emission'

interface MonitoringTabConfig {
  id: MonitoringTabType
  label: string
  icon: React.ReactNode
  component: React.ComponentType
  badge?: string
  description: string
  color: string
}

const MONITORING_TABS: MonitoringTabConfig[] = [
  {
    id: 'pool',
    label: 'Pool Events',
    icon: <PoolIcon />,
    component: PoolMonitoringTab,
    description: 'Pool creation and configuration events',
    color: 'blue'
  },
  {
    id: 'dex',
    label: 'DEX Events',
    icon: <DexIcon />,
    component: DexMonitoringTab,
    description: 'Trading and liquidity events',
    color: 'green'
  },
  {
    id: 'farm',
    label: 'Farm Events',
    icon: <FarmIcon />,
    component: FarmMonitoringTab,
    description: 'Staking, rewards, and farm management',
    color: 'purple'
  },
  {
    id: 'emission',
    label: 'Emission Events',
    icon: <GlobalEmissionIcon />,
    component: GlobalEmissionMonitoringTab,
    badge: 'New',
    description: 'Global emission system and allocation events',
    color: 'orange'
  }
]

export default function CommonMonitoringTab() {
  const [activeTab, setActiveTab] = useState<MonitoringTabType>('pool')

  const activeTabConfig = MONITORING_TABS.find(tab => tab.id === activeTab)
  const ActiveComponent = activeTabConfig?.component || PoolMonitoringTab

  const getTabColorClasses = (color: string, isActive: boolean) => {
    const colorMap = {
      blue: isActive ? 'from-blue-600/20 to-blue-500/20 border-blue-500/30 text-blue-300' : 'hover:bg-blue-600/10',
      green: isActive ? 'from-green-600/20 to-green-500/20 border-green-500/30 text-green-300' : 'hover:bg-green-600/10',
      purple: isActive ? 'from-purple-600/20 to-purple-500/20 border-purple-500/30 text-purple-300' : 'hover:bg-purple-600/10',
      orange: isActive ? 'from-orange-600/20 to-orange-500/20 border-orange-500/30 text-orange-300' : 'hover:bg-orange-600/10'
    }
    return colorMap[color as keyof typeof colorMap] || colorMap.blue
  }

  const getIconColor = (color: string, isActive: boolean) => {
    if (!isActive) return ''
    const colorMap = {
      blue: 'text-blue-400',
      green: 'text-green-400', 
      purple: 'text-purple-400',
      orange: 'text-orange-400'
    }
    return colorMap[color as keyof typeof colorMap] || 'text-blue-400'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">System Monitoring Dashboard</h2>
          <p className="text-slate-400">Comprehensive real-time monitoring across all protocol components</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <MonitorIcon className="w-5 h-5 text-purple-400" />
          <span className="text-slate-300 text-sm">Live monitoring</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
        <div className="flex flex-col space-y-4">
          {/* Tab Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {MONITORING_TABS.map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex flex-col items-center p-4 rounded-xl transition-all duration-200 border ${
                    isActive
                      ? `bg-gradient-to-br ${getTabColorClasses(tab.color, true)} border`
                      : `text-slate-400 hover:text-white border-slate-600/30 ${getTabColorClasses(tab.color, false)}`
                  }`}
                >
                  <div className={`w-8 h-8 mb-2 ${getIconColor(tab.color, isActive)}`}>
                    {tab.icon}
                  </div>
                  <span className="font-medium text-sm mb-1">{tab.label}</span>
                  <span className="text-xs text-slate-400 text-center leading-tight">
                    {tab.description}
                  </span>
                  {tab.badge && (
                    <span className="absolute -top-1 -right-1 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
                      {tab.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
          
          {/* Active Tab Info */}
          {activeTabConfig && (
            <div className={`p-4 bg-gradient-to-r ${getTabColorClasses(activeTabConfig.color, true)} rounded-lg border`}>
              <div className="flex items-center space-x-3">
                <div className={`w-6 h-6 ${getIconColor(activeTabConfig.color, true)}`}>
                  {activeTabConfig.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-white">{activeTabConfig.label}</h3>
                  <p className="text-sm opacity-90">{activeTabConfig.description}</p>
                </div>
              </div>
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
        <div className="flex flex-col md:flex-row md:items-center justify-between space-y-2 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-slate-300 text-sm">Live monitoring active</span>
            </div>
            <div className="text-slate-400 text-sm">
              Auto-refresh every 30 seconds
            </div>
            <div className="text-slate-400 text-sm">
              {MONITORING_TABS.length} monitoring modules
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-slate-400 text-sm">
              Network: Sui Testnet
            </div>
            <div className="text-slate-400 text-sm">
              Status: <span className="text-green-400">Operational</span>
            </div>
          </div>
        </div>
      </div>

    
    </div>
  )
}