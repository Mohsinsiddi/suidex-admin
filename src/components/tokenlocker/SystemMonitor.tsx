// components/tokenlocker/SystemMonitor.tsx
import React from 'react'
import { CheckCircle, AlertTriangle, Lock, TrendingUp, Users, Coins, Settings, Activity, Percent, DollarSign, BarChart3 } from 'lucide-react'
import { TokenLockerService } from '../../services/tokenLockerService'
import LoadingSkeleton from './LoadingSkeleton'

interface SystemMonitorProps {
  dashboardData: any
  loadingStates: {
    dashboard: boolean
    events: boolean
  }
  onRefresh: () => void
}

export default function SystemMonitor({ dashboardData, loadingStates, onRefresh }: SystemMonitorProps) {
  
  return (
    <div className="space-y-6">
      {/* System Health Status */}
      {dashboardData?.health && (
        <div className={`border rounded-xl p-6 ${
          dashboardData.health.overall === 'healthy' 
            ? 'border-green-500/30 bg-green-500/10' 
            : dashboardData.health.overall === 'warning'
            ? 'border-yellow-500/30 bg-yellow-500/10'
            : 'border-red-500/30 bg-red-500/10'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {dashboardData.health.overall === 'healthy' ? (
                <CheckCircle className="w-6 h-6 text-green-400" />
              ) : dashboardData.health.overall === 'warning' ? (
                <AlertTriangle className="w-6 h-6 text-yellow-400" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-red-400" />
              )}
              <div>
                <h3 className="text-white font-bold text-lg">
                  System Health: {dashboardData.health.overall === 'healthy' ? 'Healthy' : 
                                dashboardData.health.overall === 'warning' ? 'Warning' : 'Critical'}
                </h3>
                <p className="text-slate-300">
                  {dashboardData.health.issues.length === 0 
                    ? 'All systems operational' 
                    : `${dashboardData.health.issues.length} issue(s) detected`}
                </p>
              </div>
            </div>
            
            {dashboardData.timing && (
              <div className="text-right">
                <div className="text-white font-semibold">
                  Epoch #{dashboardData.config?.currentEpoch?.id || 0}
                </div>
                <div className="text-slate-400 text-sm">
                  {dashboardData.timing.current.status}
                </div>
              </div>
            )}
          </div>

          {/* Issues and Recommendations */}
          {dashboardData.health.issues.length > 0 && (
            <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <h4 className="text-red-300 font-medium mb-2">Issues:</h4>
                <ul className="space-y-1">
                  {dashboardData.health.issues.map((issue: string, i: number) => (
                    <li key={i} className="text-red-200 text-sm">• {issue}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-blue-300 font-medium mb-2">Recommendations:</h4>
                <ul className="space-y-1">
                  {dashboardData.health.recommendations.map((rec: string, i: number) => (
                    <li key={i} className="text-blue-200 text-sm">• {rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <Lock className="w-5 h-5 text-purple-400" />
            <div className="text-slate-400 text-sm">Total Value Locked</div>
          </div>
          {loadingStates.dashboard ? (
            <LoadingSkeleton className="w-24 h-8 mt-1" />
          ) : (
            <div className="text-2xl font-bold text-white mt-1">
              {dashboardData?.stats?.totalValueLocked || '0 VICTORY'}
            </div>
          )}
          <div className="text-purple-400 text-sm mt-1">All periods</div>
        </div>
        
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <Users className="w-5 h-5 text-blue-400" />
            <div className="text-slate-400 text-sm">Active Locks</div>
          </div>
          {loadingStates.dashboard ? (
            <LoadingSkeleton className="w-16 h-8 mt-1" />
          ) : (
            <div className="text-2xl font-bold text-white mt-1">
              {dashboardData?.stats?.activeLocks || 0}
            </div>
          )}
          <div className="text-blue-400 text-sm mt-1">User positions</div>
        </div>
        
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <Coins className="w-5 h-5 text-green-400" />
            <div className="text-slate-400 text-sm">SUI Revenue</div>
          </div>
          {loadingStates.dashboard ? (
            <LoadingSkeleton className="w-20 h-8 mt-1" />
          ) : (
            <div className="text-2xl font-bold text-white mt-1">
              {dashboardData?.stats?.suiRevenueThisWeek || '0 SUI'}
            </div>
          )}
          <div className="text-green-400 text-sm mt-1">This epoch</div>
        </div>
        
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <TrendingUp className="w-5 h-5 text-orange-400" />
            <div className="text-slate-400 text-sm">Victory Rewards</div>
          </div>
          {loadingStates.dashboard ? (
            <LoadingSkeleton className="w-24 h-8 mt-1" />
          ) : (
            <div className="text-2xl font-bold text-white mt-1">
              {dashboardData?.stats?.victoryRewardsDistributed || '0 VICTORY'}
            </div>
          )}
          <div className="text-orange-400 text-sm mt-1">Available</div>
        </div>
      </div>

      {/* Current Epoch Status */}
      {dashboardData?.timing && (
        <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Settings className="w-5 h-5 mr-2 text-purple-400" />
            Current Epoch Status
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-800/30 rounded-lg p-4">
              <div className="text-slate-400 text-sm">Epoch ID</div>
              <div className="text-2xl font-bold text-white">#{dashboardData.timing.current.id}</div>
            </div>
            <div className="bg-slate-800/30 rounded-lg p-4">
              <div className="text-slate-400 text-sm">Progress</div>
              <div className="text-2xl font-bold text-white">{dashboardData.timing.current.progress?.toFixed(1) || '0'}%</div>
              <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, dashboardData.timing.current.progress || 0)}%` }}
                ></div>
              </div>
            </div>
            <div className="bg-slate-800/30 rounded-lg p-4">
              <div className="text-slate-400 text-sm">Time Remaining</div>
              <div className="text-2xl font-bold text-white">{dashboardData.timing.current.timeRemaining || 'N/A'}</div>
            </div>
            <div className="bg-slate-800/30 rounded-lg p-4">
              <div className="text-slate-400 text-sm">Status</div>
              <div className={`text-lg font-bold ${
                dashboardData.timing.current.status === 'Claimable' ? 'text-green-400' :
                dashboardData.timing.current.status === 'Finalized' ? 'text-blue-400' :
                'text-orange-400'
              }`}>
                {dashboardData.timing.current.status}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vault Balances */}
      <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <BarChart3 className="w-5 h-5 mr-2 text-blue-400" />
          Vault Balances
        </h3>
        {loadingStates.dashboard ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <LoadingSkeleton key={i} type="stat" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {dashboardData?.config && [
              { label: 'Locked Tokens Vault', amount: dashboardData.config.vaultBalances.lockedTokens, format: 'victory', color: 'purple', icon: Lock },
              { label: 'Victory Rewards Vault', amount: dashboardData.config.vaultBalances.victoryRewards, format: 'victory', color: 'blue', icon: TrendingUp },
              { label: 'SUI Rewards Vault', amount: dashboardData.config.vaultBalances.suiRewards, format: 'sui', color: 'green', icon: Coins }
            ].map(({ label, amount, format, color, icon: Icon }) => (
              <div key={label} className="border border-slate-600/30 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <Icon className={`w-4 h-4 text-${color}-400`} />
                  <div className="text-slate-400 text-sm">{label}</div>
                </div>
                <div className={`text-xl font-bold text-${color}-400`}>
                  {format === 'victory' 
                    ? TokenLockerService.formatVictoryAmount(amount)
                    : TokenLockerService.formatSUIAmount(amount)}
                </div>
                <div className="text-slate-500 text-xs mt-1">
                  ID: {dashboardData.config.vaultIds[
                    label.includes('Locked') ? 'lockedTokenVaultId' :
                    label.includes('Victory') ? 'victoryRewardVaultId' :
                    'suiRewardVaultId'
                  ].slice(0, 8)}...
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pool Statistics */}
      <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <BarChart3 className="w-5 h-5 mr-2 text-green-400" />
          Lock Period Distribution
        </h3>
        {loadingStates.dashboard ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <LoadingSkeleton key={i} type="stat" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {dashboardData?.config && [
              { period: '1 Week', amount: dashboardData.config.poolStats.weekLocked, alloc: dashboardData.config.allocations.victory.week, color: 'blue' },
              { period: '3 Months', amount: dashboardData.config.poolStats.threeMonthLocked, alloc: dashboardData.config.allocations.victory.threeMonth, color: 'green' },
              { period: '1 Year', amount: dashboardData.config.poolStats.yearLocked, alloc: dashboardData.config.allocations.victory.year, color: 'yellow' },
              { period: '3 Years', amount: dashboardData.config.poolStats.threeYearLocked, alloc: dashboardData.config.allocations.victory.threeYear, color: 'purple' }
            ].map(({ period, amount, alloc, color }) => (
              <div key={period} className="border border-slate-600/30 rounded-lg p-4">
                <div className="text-slate-400 text-sm">{period}</div>
                <div className="text-white font-bold">
                  {TokenLockerService.formatVictoryAmount(amount)}
                </div>
                <div className={`text-${color}-400 text-xs`}>
                  {TokenLockerService.formatAllocationPercentage(alloc)} allocation
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Events */}
      <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Activity className="w-5 h-5 mr-2 text-orange-400" />
          Recent Admin Events
        </h3>
        {loadingStates.dashboard ? (
          <LoadingSkeleton type="table" />
        ) : (
          <div className="space-y-3">
            {dashboardData?.events?.length > 0 ? (
              dashboardData.events.slice(0, 5).map((event: any) => (
                <div key={event.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      event.type === 'VictoryAllocationsUpdated' ? 'bg-purple-500/20' :
                      event.type === 'SUIAllocationsUpdated' ? 'bg-blue-500/20' :
                      event.type === 'WeeklyRevenueAdded' ? 'bg-green-500/20' :
                      'bg-orange-500/20'
                    }`}>
                      {event.type === 'VictoryAllocationsUpdated' ? <Percent className="w-4 h-4 text-purple-400" /> :
                       event.type === 'SUIAllocationsUpdated' ? <BarChart3 className="w-4 h-4 text-blue-400" /> :
                       event.type === 'WeeklyRevenueAdded' ? <DollarSign className="w-4 h-4 text-green-400" /> :
                       <Activity className="w-4 h-4 text-orange-400" />}
                    </div>
                    <div>
                      <div className="text-white font-medium text-sm">{event.eventName}</div>
                      <div className="text-slate-400 text-xs">
                        By {TokenLockerService.formatAddress(event.admin)}
                      </div>
                    </div>
                  </div>
                  <div className="text-slate-500 text-xs">
                    {TokenLockerService.formatTimestamp(event.timestamp)}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-slate-400 py-8">
                <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No admin events found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}