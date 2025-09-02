// components/overview/SystemStats.tsx
import React from 'react'
import { 
  CheckCircleIcon,
  AlertTriangleIcon,
  UsersIcon,
  ActivityIcon,
  ClockIcon,
  DatabaseIcon
} from '../icons'
import type { SystemTVL } from '../../services/tvlAprService'

interface SystemStatsProps {
  systemTVL: SystemTVL
}

export function SystemStats({ systemTVL }: SystemStatsProps) {
  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  const getStatusColor = (errors: string[], warnings: string[]) => {
    if (errors.length > 0) return 'text-red-400'
    if (warnings.length > 0) return 'text-yellow-400'
    return 'text-green-400'
  }

  const getStatusIcon = (errors: string[], warnings: string[]) => {
    if (errors.length > 0) return <AlertTriangleIcon className="w-6 h-6 text-red-400" />
    if (warnings.length > 0) return <AlertTriangleIcon className="w-6 h-6 text-yellow-400" />
    return <CheckCircleIcon className="w-6 h-6 text-green-400" />
  }

  const getStatusText = (errors: string[], warnings: string[]) => {
    if (errors.length > 0) return 'Errors Detected'
    if (warnings.length > 0) return 'Minor Issues'
    return 'Healthy'
  }

  return (
    <div className="space-y-6">
      {/* System Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Active Pools */}
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
          <div className="flex items-center space-x-2 mb-2">
            <UsersIcon className="w-5 h-5 text-blue-400" />
            <div className="text-slate-400 text-sm">Active Pools</div>
          </div>
          <div className="text-2xl font-bold text-white">
            {systemTVL.metadata.poolsProcessed}
          </div>
          <div className="text-blue-400 text-sm mt-1">
            {systemTVL.farmTVL.lpPools.length} LP + {systemTVL.farmTVL.singlePools.length} Single
          </div>
        </div>

        {/* Price Sources */}
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
          <div className="flex items-center space-x-2 mb-2">
            <DatabaseIcon className="w-5 h-5 text-purple-400" />
            <div className="text-slate-400 text-sm">Price Sources</div>
          </div>
          <div className="text-2xl font-bold text-white">
            {systemTVL.metadata.pricesUpdated}
          </div>
          <div className="text-purple-400 text-sm mt-1">
            Updated tokens
          </div>
        </div>

        {/* Update Performance */}
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
          <div className="flex items-center space-x-2 mb-2">
            <ClockIcon className="w-5 h-5 text-green-400" />
            <div className="text-slate-400 text-sm">Update Time</div>
          </div>
          <div className="text-2xl font-bold text-white">
            {formatDuration(systemTVL.metadata.updateDuration)}
          </div>
          <div className="text-green-400 text-sm mt-1">
            Last calculation
          </div>
        </div>

        {/* System Status */}
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
          <div className="flex items-center space-x-2 mb-2">
            <ActivityIcon className="w-5 h-5 text-slate-400" />
            <div className="text-slate-400 text-sm">System Status</div>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusIcon(systemTVL.metadata.errors, systemTVL.metadata.warnings)}
            <span className={`text-xl font-bold ${getStatusColor(systemTVL.metadata.errors, systemTVL.metadata.warnings)}`}>
              {getStatusText(systemTVL.metadata.errors, systemTVL.metadata.warnings)}
            </span>
          </div>
          <div className={`text-sm mt-1 ${getStatusColor(systemTVL.metadata.errors, systemTVL.metadata.warnings)}`}>
            {systemTVL.metadata.errors.length === 0 && systemTVL.metadata.warnings.length === 0 
              ? 'All systems operational' 
              : `${systemTVL.metadata.errors.length} errors, ${systemTVL.metadata.warnings.length} warnings`
            }
          </div>
        </div>
      </div>

      {/* System Health Details */}
      {(systemTVL.metadata.errors.length > 0 || systemTVL.metadata.warnings.length > 0) && (
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <AlertTriangleIcon className="w-5 h-5 text-yellow-400" />
            <span>System Notifications</span>
          </h3>
          
          {systemTVL.metadata.errors.length > 0 && (
            <div className="mb-4">
              <h4 className="text-red-400 font-medium mb-2 flex items-center space-x-2">
                <AlertTriangleIcon className="w-4 h-4" />
                <span>Errors ({systemTVL.metadata.errors.length})</span>
              </h4>
              <div className="space-y-2">
                {systemTVL.metadata.errors.map((error, index) => (
                  <div key={index} className="text-red-300 text-sm bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
                    {error}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {systemTVL.metadata.warnings.length > 0 && (
            <div>
              <h4 className="text-yellow-400 font-medium mb-2 flex items-center space-x-2">
                <AlertTriangleIcon className="w-4 h-4" />
                <span>Warnings ({systemTVL.metadata.warnings.length})</span>
              </h4>
              <div className="space-y-2">
                {systemTVL.metadata.warnings.map((warning, index) => (
                  <div key={index} className="text-yellow-300 text-sm bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg">
                    {warning}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TVL Distribution */}
      <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">TVL Distribution</h3>
        
        <div className="space-y-4">
          {/* Farm vs Locker Distribution */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-300">Farm TVL</span>
              <span className="text-green-400 font-medium">
                {systemTVL.systemTVL.farmPercentage.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${systemTVL.systemTVL.farmPercentage}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-300">Locker TVL</span>
              <span className="text-orange-400 font-medium">
                {systemTVL.systemTVL.lockerPercentage.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${systemTVL.systemTVL.lockerPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* LP vs Single Distribution within Farm */}
          <div className="pt-3 border-t border-slate-700/30">
            <h4 className="text-slate-400 text-sm mb-3">Farm Pool Types</h4>
            
            <div className="mb-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-300 text-sm">LP Pools</span>
                <span className="text-green-400 text-sm">
                  {((systemTVL.farmTVL.totalLPTVL / systemTVL.farmTVL.totalFarmTVL) * 100 || 0).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-1.5">
                <div 
                  className="bg-green-400 h-1.5 rounded-full"
                  style={{ 
                    width: `${systemTVL.farmTVL.totalFarmTVL > 0 ? (systemTVL.farmTVL.totalLPTVL / systemTVL.farmTVL.totalFarmTVL) * 100 : 0}%` 
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-300 text-sm">Single Asset Pools</span>
                <span className="text-blue-400 text-sm">
                  {((systemTVL.farmTVL.totalSingleTVL / systemTVL.farmTVL.totalFarmTVL) * 100 || 0).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-1.5">
                <div 
                  className="bg-blue-400 h-1.5 rounded-full"
                  style={{ 
                    width: `${systemTVL.farmTVL.totalFarmTVL > 0 ? (systemTVL.farmTVL.totalSingleTVL / systemTVL.farmTVL.totalFarmTVL) * 100 : 0}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}