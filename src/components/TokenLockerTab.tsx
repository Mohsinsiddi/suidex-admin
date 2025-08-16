import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useWallet } from '@suiet/wallet-kit'
import { useAuth } from '../contexts/AuthContext'
import { TokenLockerService, type TokenLockerConfig, type TokenLockerStats, type LockerAdminEvent } from '../services/tokenLockerService'
import { CONSTANTS } from '../constants'
import { Lock, TrendingUp, Users, Coins, Settings, AlertTriangle, CheckCircle, Clock, Percent, DollarSign, Calendar, Activity, Eye, Wrench, Zap, RefreshCw, Play, Pause, BarChart3 } from 'lucide-react'

// Loading skeleton component
function LoadingSkeleton({ className = "h-4 bg-slate-700/50 rounded animate-pulse" }: { className?: string }) {
  return <div className={className}></div>
}

export default function TokenLockerTab() {
  const [activeTab, setActiveTab] = useState<'monitor' | 'admin' | 'epoch'>('monitor')
  
  // Core data states
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loadingStates, setLoadingStates] = useState({
    dashboard: true,
    events: true
  })
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  // Form states for admin operations
  const [victoryAllocations, setVictoryAllocations] = useState({
    week: 200, threeMonth: 800, year: 2500, threeYear: 6500
  })
  const [suiAllocations, setSuiAllocations] = useState({
    week: 1000, threeMonth: 2000, year: 3000, threeYear: 4000
  })
  const [revenueAmount, setRevenueAmount] = useState('')
  const [victoryDepositAmount, setVictoryDepositAmount] = useState('')
  
  const [confirmAction, setConfirmAction] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const { connected, account, signAndExecuteTransaction } = useWallet()
  const { authMethod } = useAuth()

  const canPerformAction = useMemo(() => 
    connected && (authMethod === 'secret' || account?.address === CONSTANTS.ADMIN),
    [connected, authMethod, account?.address]
  )

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    try {
      setError(null)
      setLoadingStates(prev => ({ ...prev, dashboard: true }))
      
      const data = await TokenLockerService.fetchAdminDashboardData()
      setDashboardData(data)
      
      // Update form states with current allocations
      if (data.config) {
        setVictoryAllocations(data.config.allocations.victory)
        setSuiAllocations(data.config.allocations.sui)
      }
      
      setLastUpdate(new Date())
    } catch (err) {
      console.error('Error loading dashboard data:', err)
      setError('Failed to load token locker data')
    } finally {
      setLoadingStates(prev => ({ ...prev, dashboard: false }))
    }
  }, [])

  // Initial load
  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  // Handle transaction execution
  const handleTransaction = async (
    txBuilder: () => any,
    action: string,
    onSuccess?: () => void
  ) => {
    if (!connected || !account) {
      alert('Please connect your wallet')
      return
    }

    try {
      setActionLoading(true)
      const tx = txBuilder()
      
      const result = await signAndExecuteTransaction({
        transaction: tx,
        options: {
          showEffects: true,
          showEvents: true
        }
      })

      if (result?.effects?.status?.status === 'success') {
        alert(`${action} successful!`)
        onSuccess?.()
        loadDashboardData()
        setConfirmAction(null)
      } else {
        throw new Error('Transaction failed')
      }
    } catch (error) {
      console.error(`Error ${action}:`, error)
      alert(`Error ${action}: ${TokenLockerService.getTokenLockerOperationErrorMessage(error)}`)
    } finally {
      setActionLoading(false)
    }
  }

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  if (error && !dashboardData) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <span className="text-red-400 font-medium">Error loading token locker data</span>
        </div>
        <p className="text-red-300 mt-2">{error}</p>
        <button
          onClick={loadDashboardData}
          className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">Token Locker Control</h2>
          <p className="text-slate-400 mt-1">Manage token locks, rewards, and SUI revenue distribution</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={loadDashboardData}
            disabled={loadingStates.dashboard}
            className="flex items-center space-x-2 bg-slate-700/50 hover:bg-slate-700/70 text-slate-300 hover:text-white px-3 py-2 rounded-lg transition-all duration-200 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loadingStates.dashboard ? 'animate-spin' : ''}`} />
            <span className="text-sm">Refresh</span>
          </button>

          {lastUpdate && (
            <div className="text-xs text-slate-500">
              Last update: {lastUpdate.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-1">
        {[
          { id: 'monitor', label: 'Monitor', icon: Eye },
          { id: 'admin', label: 'Admin Controls', icon: Wrench },
          { id: 'epoch', label: 'Epoch & SUI Distribution', icon: Zap }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              activeTab === id
                ? 'bg-purple-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Monitor Tab */}
      {activeTab === 'monitor' && (
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
              <div className="text-slate-400 text-sm">Total Value Locked</div>
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
              <div className="text-slate-400 text-sm">Active Locks</div>
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
              <div className="text-slate-400 text-sm">SUI Revenue</div>
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
              <div className="text-slate-400 text-sm">Victory Rewards</div>
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

          {/* Vault Balances */}
          <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Vault Balances</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {dashboardData?.config && [
                { label: 'Locked Tokens Vault', amount: dashboardData.config.vaultBalances.lockedTokens, format: 'victory', color: 'purple' },
                { label: 'Victory Rewards Vault', amount: dashboardData.config.vaultBalances.victoryRewards, format: 'victory', color: 'blue' },
                { label: 'SUI Rewards Vault', amount: dashboardData.config.vaultBalances.suiRewards, format: 'sui', color: 'green' }
              ].map(({ label, amount, format, color }) => (
                <div key={label} className="border border-slate-600/30 rounded-lg p-4">
                  <div className="text-slate-400 text-sm mb-2">{label}</div>
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
          </div>

          {/* Pool Statistics */}
          <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Lock Period Distribution</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {dashboardData?.config && [
                { period: '1 Week', amount: dashboardData.config.poolStats.weekLocked, alloc: dashboardData.config.allocations.victory.week },
                { period: '3 Months', amount: dashboardData.config.poolStats.threeMonthLocked, alloc: dashboardData.config.allocations.victory.threeMonth },
                { period: '1 Year', amount: dashboardData.config.poolStats.yearLocked, alloc: dashboardData.config.allocations.victory.year },
                { period: '3 Years', amount: dashboardData.config.poolStats.threeYearLocked, alloc: dashboardData.config.allocations.victory.threeYear }
              ].map(({ period, amount, alloc }) => (
                <div key={period} className="border border-slate-600/30 rounded-lg p-4">
                  <div className="text-slate-400 text-sm">{period}</div>
                  <div className="text-white font-bold">
                    {TokenLockerService.formatVictoryAmount(amount)}
                  </div>
                  <div className="text-purple-400 text-xs">
                    {TokenLockerService.formatAllocationPercentage(alloc)} allocation
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Events */}
          <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Recent Admin Events</h3>
            <div className="space-y-3">
              {dashboardData?.events?.length > 0 ? (
                dashboardData.events.slice(0, 5).map((event: LockerAdminEvent) => (
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
          </div>
        </div>
      )}

      {/* Admin Controls Tab */}
      {activeTab === 'admin' && (
        <div className="space-y-6">
          {!canPerformAction && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                <span className="text-yellow-400 font-medium">
                  Admin authentication required for control operations
                </span>
              </div>
            </div>
          )}

          {/* Victory Token Deposit */}
          <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Victory Token Management</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 font-medium mb-2">Deposit Victory Tokens (Reward Vault)</label>
                <input
                  type="text"
                  value={victoryDepositAmount}
                  onChange={(e) => setVictoryDepositAmount(e.target.value)}
                  placeholder="Amount in smallest units (e.g., 1000000)"
                  disabled={!canPerformAction}
                  className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:border-purple-500 focus:outline-none disabled:opacity-50"
                />
                <p className="text-slate-400 text-sm mt-1">
                  Current balance: {dashboardData?.config ? TokenLockerService.formatVictoryAmount(dashboardData.config.vaultBalances.victoryRewards) : '0 VICTORY'}
                </p>
              </div>
              <button
                onClick={() => {
                  const validation = TokenLockerService.validateAmount(victoryDepositAmount)
                  if (!validation.isValid) {
                    alert(validation.error)
                    return
                  }
                  setConfirmAction('depositVictory')
                }}
                disabled={!canPerformAction || !victoryDepositAmount || actionLoading}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:opacity-50 text-white font-semibold px-4 py-3 rounded-lg transition-all duration-200"
              >
                Deposit Victory Tokens
              </button>
            </div>
          </div>

          {/* Allocation Management */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Victory Allocations */}
            <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Victory Token Allocations</h3>
              <div className="space-y-4">
                {Object.entries(victoryAllocations).filter(([key]) => key !== 'total').map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-slate-300 font-medium mb-2 capitalize">
                      {TokenLockerService.getLockPeriodDisplayName(
                        key === 'week' ? 7 : key === 'threeMonth' ? 90 : key === 'year' ? 365 : 1095
                      )} ({(value / 100).toFixed(1)}%)
                    </label>
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => setVictoryAllocations(prev => ({ 
                        ...prev, 
                        [key]: parseInt(e.target.value) || 0 
                      }))}
                      min="0"
                      max="10000"
                      disabled={!canPerformAction}
                      className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:border-purple-500 focus:outline-none disabled:opacity-50"
                    />
                  </div>
                ))}
                <div className="text-sm text-slate-400">
                  Total: {Object.values(victoryAllocations).filter((_, i) => i < 4).reduce((a, b) => a + b, 0) / 100}%
                  {Object.values(victoryAllocations).filter((_, i) => i < 4).reduce((a, b) => a + b, 0) !== 10000 && (
                    <span className="text-red-400 ml-2">Must equal 100%</span>
                  )}
                </div>
                <button
                  onClick={() => {
                    const validation = TokenLockerService.validateAllocations(victoryAllocations)
                    if (!validation.isValid) {
                      alert('Validation errors:\n' + validation.errors.join('\n'))
                      return
                    }
                    setConfirmAction('updateVictoryAllocations')
                  }}
                  disabled={!canPerformAction || actionLoading}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:opacity-50 text-white font-semibold px-4 py-3 rounded-lg transition-all duration-200"
                >
                  Update Victory Allocations
                </button>
              </div>
            </div>

            {/* SUI Allocations */}
            <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">SUI Revenue Allocations</h3>
              <div className="space-y-4">
                {Object.entries(suiAllocations).filter(([key]) => key !== 'total').map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-slate-300 font-medium mb-2 capitalize">
                      {TokenLockerService.getLockPeriodDisplayName(
                        key === 'week' ? 7 : key === 'threeMonth' ? 90 : key === 'year' ? 365 : 1095
                      )} ({(value / 100).toFixed(1)}%)
                    </label>
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => setSuiAllocations(prev => ({ 
                        ...prev, 
                        [key]: parseInt(e.target.value) || 0 
                      }))}
                      min="0"
                      max="10000"
                      disabled={!canPerformAction}
                      className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:border-purple-500 focus:outline-none disabled:opacity-50"
                    />
                  </div>
                ))}
                <div className="text-sm text-slate-400">
                  Total: {Object.values(suiAllocations).filter((_, i) => i < 4).reduce((a, b) => a + b, 0) / 100}%
                  {Object.values(suiAllocations).filter((_, i) => i < 4).reduce((a, b) => a + b, 0) !== 10000 && (
                    <span className="text-red-400 ml-2">Must equal 100%</span>
                  )}
                </div>
                <button
                  onClick={() => {
                    const validation = TokenLockerService.validateAllocations(suiAllocations)
                    if (!validation.isValid) {
                      alert('Validation errors:\n' + validation.errors.join('\n'))
                      return
                    }
                    setConfirmAction('updateSUIAllocations')
                  }}
                  disabled={!canPerformAction || actionLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:opacity-50 text-white font-semibold px-4 py-3 rounded-lg transition-all duration-200"
                >
                  Update SUI Allocations
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Epoch & SUI Distribution Tab */}
      {activeTab === 'epoch' && (
        <div className="space-y-6">
          {/* Current Epoch Status */}
          {dashboardData?.timing && (
            <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Current Epoch Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="border border-slate-600/30 rounded-lg p-4">
                  <div className="text-slate-400 text-sm">Epoch ID</div>
                  <div className="text-2xl font-bold text-white">
                    #{dashboardData.timing.current.id}
                  </div>
                  <div className="text-purple-400 text-sm mt-1">Current period</div>
                </div>
                
                <div className="border border-slate-600/30 rounded-lg p-4">
                  <div className="text-slate-400 text-sm">Progress</div>
                  <div className="text-2xl font-bold text-white">
                    {dashboardData.timing.current.progress.toFixed(1)}%
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, dashboardData.timing.current.progress)}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="border border-slate-600/30 rounded-lg p-4">
                  <div className="text-slate-400 text-sm">Time Remaining</div>
                  <div className="text-2xl font-bold text-white">
                    {dashboardData.timing.current.timeRemaining}
                  </div>
                  <div className="text-blue-400 text-sm mt-1">Until next epoch</div>
                </div>
                
                <div className="border border-slate-600/30 rounded-lg p-4">
                  <div className="text-slate-400 text-sm">Status</div>
                  <div className={`text-2xl font-bold ${
                    dashboardData.timing.current.status === 'Claimable' ? 'text-green-400' :
                    dashboardData.timing.current.status === 'Finalized' ? 'text-blue-400' :
                    'text-orange-400'
                  }`}>
                    {dashboardData.timing.current.status}
                  </div>
                  <div className="text-slate-400 text-sm mt-1">Epoch state</div>
                </div>
              </div>
            </div>
          )}

          {/* Weekly SUI Revenue Management */}
          <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Weekly SUI Revenue Distribution</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Current SUI Balance */}
              <div className="border border-slate-600/30 rounded-lg p-4">
                <h4 className="text-white font-medium mb-3">Current SUI Vault Balance</h4>
                <div className="text-3xl font-bold text-green-400 mb-2">
                  {dashboardData?.config ? TokenLockerService.formatSUIAmount(dashboardData.config.vaultBalances.suiRewards) : '0 SUI'}
                </div>
                <div className="text-slate-400 text-sm">Available for distribution</div>
                
                {dashboardData?.config?.currentEpoch && (
                  <div className="mt-4 p-3 bg-slate-700/30 rounded-lg">
                    <div className="text-slate-300 text-sm">Epoch Information:</div>
                    <div className="text-xs text-slate-400 mt-1">
                      Claimable: {dashboardData.config.currentEpoch.isClaimable ? 'Yes' : 'No'} • 
                      Finalized: {dashboardData.config.currentEpoch.allocationsFinalized ? 'Yes' : 'No'}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Add Revenue */}
              <div className="border border-slate-600/30 rounded-lg p-4">
                <h4 className="text-white font-medium mb-3">Add Weekly Revenue</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-slate-300 font-medium mb-2">SUI Amount</label>
                    <input
                      type="text"
                      value={revenueAmount}
                      onChange={(e) => setRevenueAmount(e.target.value)}
                      placeholder="Amount in MIST (e.g., 1000000000)"
                      disabled={!canPerformAction}
                      className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:border-green-500 focus:outline-none disabled:opacity-50"
                    />
                    <p className="text-slate-400 text-xs mt-1">
                      1 SUI = 1,000,000,000 MIST
                    </p>
                  </div>
                  
                  <button
                    onClick={() => {
                      const validation = TokenLockerService.validateAmount(revenueAmount, '1000000000') // Min 1 SUI
                      if (!validation.isValid) {
                        alert(validation.error)
                        return
                      }
                      setConfirmAction('addWeeklyRevenue')
                    }}
                    disabled={!canPerformAction || !revenueAmount || actionLoading}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:opacity-50 text-white font-semibold px-4 py-3 rounded-lg transition-all duration-200"
                  >
                    Add Weekly SUI Revenue
                  </button>
                  
                  <div className="text-xs text-slate-400">
                    This will distribute SUI to all lock periods based on current allocations and finalize the current epoch.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Allocation Preview */}
          <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Revenue Distribution Preview</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {dashboardData?.config && [
                { period: '1 Week', allocation: dashboardData.config.allocations.sui.week, locks: dashboardData.config.poolStats.weekLocked },
                { period: '3 Months', allocation: dashboardData.config.allocations.sui.threeMonth, locks: dashboardData.config.poolStats.threeMonthLocked },
                { period: '1 Year', allocation: dashboardData.config.allocations.sui.year, locks: dashboardData.config.poolStats.yearLocked },
                { period: '3 Years', allocation: dashboardData.config.allocations.sui.threeYear, locks: dashboardData.config.poolStats.threeYearLocked }
              ].map(({ period, allocation, locks }) => {
                const revenueNum = parseFloat(revenueAmount) || 0
                const expectedAmount = (revenueNum * allocation) / 10000
                
                return (
                  <div key={period} className="border border-slate-600/30 rounded-lg p-4">
                    <div className="text-slate-400 text-sm">{period}</div>
                    <div className="text-white font-bold">
                      {TokenLockerService.formatAllocationPercentage(allocation)}
                    </div>
                    <div className="text-green-400 text-sm">
                      ~{(expectedAmount / 1e9).toFixed(2)} SUI
                    </div>
                    <div className="text-slate-500 text-xs mt-1">
                      {TokenLockerService.formatVictoryAmount(locks)} locked
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={loadDashboardData}
              disabled={loadingStates.dashboard}
              className="flex items-center justify-center space-x-2 bg-slate-700/50 hover:bg-slate-700/70 text-slate-300 hover:text-white px-4 py-3 rounded-lg transition-all duration-200 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loadingStates.dashboard ? 'animate-spin' : ''}`} />
              <span>Refresh Data</span>
            </button>
            
            <button
              onClick={() => {
                if (dashboardData?.config) {
                  const info = `Current Epoch: ${dashboardData.config.currentEpoch.id}\nSUI Balance: ${TokenLockerService.formatSUIAmount(dashboardData.config.vaultBalances.suiRewards)}\nClaimable: ${dashboardData.config.currentEpoch.isClaimable}\nFinalized: ${dashboardData.config.currentEpoch.allocationsFinalized}`
                  alert(info)
                }
              }}
              className="flex items-center justify-center space-x-2 bg-blue-600/50 hover:bg-blue-600/70 text-blue-300 hover:text-white px-4 py-3 rounded-lg transition-all duration-200"
            >
              <Eye className="w-4 h-4" />
              <span>View Epoch Info</span>
            </button>
            
            <button
              onClick={() => {
                if (dashboardData?.config) {
                  const allocInfo = Object.entries(dashboardData.config.allocations.sui)
                    .filter(([key]) => key !== 'total')
                    .map(([key, value]) => `${TokenLockerService.getLockPeriodDisplayName(
                      key === 'week' ? 7 : key === 'threeMonth' ? 90 : key === 'year' ? 365 : 1095
                    )}: ${TokenLockerService.formatAllocationPercentage(value as number)}`)
                    .join('\n')
                  alert(`Current SUI Allocations:\n${allocInfo}`)
                }
              }}
              className="flex items-center justify-center space-x-2 bg-purple-600/50 hover:bg-purple-600/70 text-purple-300 hover:text-white px-4 py-3 rounded-lg transition-all duration-200"
            >
              <BarChart3 className="w-4 h-4" />
              <span>View Allocations</span>
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmAction && (
        <ConfirmationModal
          action={confirmAction}
          dashboardData={dashboardData}
          victoryAllocations={victoryAllocations}
          suiAllocations={suiAllocations}
          revenueAmount={revenueAmount}
          victoryDepositAmount={victoryDepositAmount}
          onConfirm={(action) => {
            switch (action) {
              case 'depositVictory':
                handleTransaction(
                  () => TokenLockerService.buildDepositVictoryTokensTransaction(victoryDepositAmount),
                  'Deposit Victory tokens',
                  () => setVictoryDepositAmount('')
                )
                break
              case 'updateVictoryAllocations':
                handleTransaction(
                  () => TokenLockerService.buildConfigureVictoryAllocationsTransaction(victoryAllocations),
                  'Update Victory allocations'
                )
                break
              case 'updateSUIAllocations':
                handleTransaction(
                  () => TokenLockerService.buildConfigureSUIAllocationsTransaction(suiAllocations),
                  'Update SUI allocations'
                )
                break
              case 'addWeeklyRevenue':
                handleTransaction(
                  () => TokenLockerService.buildAddWeeklySUIRevenueTransaction(revenueAmount),
                  'Add weekly SUI revenue',
                  () => setRevenueAmount('')
                )
                break
            }
          }}
          onCancel={() => setConfirmAction(null)}
          loading={actionLoading}
        />
      )}
    </div>
  )
}

// Confirmation Modal Component
function ConfirmationModal({ 
  action, 
  dashboardData, 
  victoryAllocations,
  suiAllocations,
  revenueAmount,
  victoryDepositAmount,
  onConfirm, 
  onCancel, 
  loading 
}: {
  action: string
  dashboardData: any
  victoryAllocations: any
  suiAllocations: any
  revenueAmount: string
  victoryDepositAmount: string
  onConfirm: (action: string) => void
  onCancel: () => void
  loading: boolean
}) {
  const getActionDetails = () => {
    switch (action) {
      case 'depositVictory':
        return {
          title: 'Deposit Victory Tokens',
          description: `Deposit ${TokenLockerService.formatVictoryAmount(victoryDepositAmount)} into the reward vault.`,
          warning: 'This will transfer Victory tokens from your wallet to the reward vault.',
          buttonText: 'Deposit Tokens',
          buttonColor: 'bg-purple-600 hover:bg-purple-700'
        }
      case 'updateVictoryAllocations':
        const victoryTotal = Object.values(victoryAllocations).filter((_, i) => i < 4).reduce((a: any, b: any) => a + b, 0)
        return {
          title: 'Update Victory Allocations',
          description: `Update Victory token reward distribution across lock periods.`,
          warning: `Total allocation: ${victoryTotal / 100}%. This affects future Victory token distributions.`,
          buttonText: 'Update Allocations',
          buttonColor: 'bg-purple-600 hover:bg-purple-700'
        }
      case 'updateSUIAllocations':
        const suiTotal = Object.values(suiAllocations).filter((_, i) => i < 4).reduce((a: any, b: any) => a + b, 0)
        return {
          title: 'Update SUI Allocations',
          description: `Update SUI revenue distribution across lock periods.`,
          warning: `Total allocation: ${suiTotal / 100}%. This affects future SUI revenue distributions.`,
          buttonText: 'Update Allocations',
          buttonColor: 'bg-blue-600 hover:bg-blue-700'
        }
      case 'addWeeklyRevenue':
        return {
          title: 'Add Weekly SUI Revenue',
          description: `Add ${TokenLockerService.formatSUIAmount(revenueAmount)} to the SUI reward vault.`,
          warning: 'This will distribute SUI to all lock periods and finalize the current epoch.',
          buttonText: 'Add Revenue',
          buttonColor: 'bg-green-600 hover:bg-green-700'
        }
      default:
        return {
          title: 'Confirm Action',
          description: 'Are you sure you want to proceed?',
          warning: 'This action may have significant effects.',
          buttonText: 'Confirm',
          buttonColor: 'bg-gray-600 hover:bg-gray-700'
        }
    }
  }

  const details = getActionDetails()

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-white mb-3">{details.title}</h3>
        <p className="text-slate-300 mb-4">{details.description}</p>
        
        {/* Show allocation details for allocation updates */}
        {(action === 'updateVictoryAllocations' || action === 'updateSUIAllocations') && (
          <div className="bg-slate-700/30 rounded-lg p-3 mb-4">
            <div className="text-slate-300 text-sm mb-2">New allocations:</div>
            {Object.entries(action === 'updateVictoryAllocations' ? victoryAllocations : suiAllocations)
              .filter(([key]) => key !== 'total')
              .map(([key, value]) => (
                <div key={key} className="text-xs text-slate-400 mb-1">
                  {TokenLockerService.getLockPeriodDisplayName(
                    key === 'week' ? 7 : key === 'threeMonth' ? 90 : key === 'year' ? 365 : 1095
                  )}: {TokenLockerService.formatAllocationPercentage(value as number)}
                </div>
              ))}
          </div>
        )}

        {/* Show revenue distribution preview */}
        {action === 'addWeeklyRevenue' && dashboardData?.config && (
          <div className="bg-slate-700/30 rounded-lg p-3 mb-4">
            <div className="text-slate-300 text-sm mb-2">Distribution preview:</div>
            {[
              { period: '1 Week', allocation: dashboardData.config.allocations.sui.week },
              { period: '3 Months', allocation: dashboardData.config.allocations.sui.threeMonth },
              { period: '1 Year', allocation: dashboardData.config.allocations.sui.year },
              { period: '3 Years', allocation: dashboardData.config.allocations.sui.threeYear }
            ].map(({ period, allocation }) => {
              const amount = (parseFloat(revenueAmount) * allocation) / 10000
              return (
                <div key={period} className="text-xs text-slate-400 mb-1">
                  {period}: {(amount / 1e9).toFixed(2)} SUI ({TokenLockerService.formatAllocationPercentage(allocation)})
                </div>
              )
            })}
          </div>
        )}
        
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-400 text-sm font-medium">Warning</span>
          </div>
          <p className="text-yellow-300 text-sm mt-1">{details.warning}</p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(action)}
            disabled={loading}
            className={`flex-1 ${details.buttonColor} disabled:opacity-50 text-white font-medium px-4 py-2 rounded-lg transition-colors`}
          >
            {loading ? 'Processing...' : details.buttonText}
          </button>
        </div>
      </div>
    </div>
  )
}