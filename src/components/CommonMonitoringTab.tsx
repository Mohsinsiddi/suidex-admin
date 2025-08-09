// components/CommonMonitoringTab.tsx
import React, { useState } from 'react'
import PoolMonitoringTab from './PoolMonitoringTab'
import DexMonitoringTab from './DexMonitoringTab'
import { 
  MonitorIcon,
  PoolIcon,
  ActivityIcon,
  DexIcon
} from './icons'



type MonitoringTabType = 'pool' | 'dex'

interface MonitoringTabConfig {
  id: MonitoringTabType
  label: string
  icon: React.ReactNode
  component: React.ComponentType
  badge?: string
}

const MONITORING_TABS: MonitoringTabConfig[] = [
  {
    id: 'pool',
    label: 'Pool Events',
    icon: <PoolIcon />,
    component: PoolMonitoringTab
  },
  {
    id: 'dex',
    label: 'DEX Events',
    icon: <DexIcon />,
    component: DexMonitoringTab,
    badge: 'New'
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
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        <ActiveComponent />
      </div>
    </div>
  )
}