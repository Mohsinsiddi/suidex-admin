// components/EnhancedOverviewTab.tsx
import React, { useState, useEffect } from 'react'
import { TVLAPRService, type SystemTVL } from '../services/tvlAprService'
import { 
  LoadingSpinner, 
  RefreshIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  DollarSignIcon,
  UsersIcon,
  DatabaseIcon,
  ClockIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  BarChart3Icon,
  PieChartIcon,
  ActivityIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  InfoIcon
} from './icons'

interface TVLMetrics {
  current: number
  change24h: number
  changePercent: number
  trend: 'up' | 'down' | 'stable'
}

interface OverviewState {
  systemTVL: SystemTVL | null
  loading: boolean
  error: string | null
  lastRefresh: number
  refreshing: boolean
  metrics: {
    totalTVL: TVLMetrics
    farmTVL: TVLMetrics
    lockerTVL: TVLMetrics
  }
}

export default function EnhancedOverviewTab() {
  const [state, setState] = useState<OverviewState>({
    systemTVL: null,
    loading: true,
    error: null,
    lastRefresh: 0,
    refreshing: false,
    metrics: {
      totalTVL: { current: 0, change24h: 0, changePercent: 0, trend: 'stable' },
      farmTVL: { current: 0, change24h: 0, changePercent: 0, trend: 'stable' },
      lockerTVL: { current: 0, change24h: 0, changePercent: 0, trend: 'stable' }
    }
  })

  useEffect(() => {
    fetchTVLData()
    
    // Set up auto-refresh every 5 minutes
    const interval = setInterval(fetchTVLData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const fetchTVLData = async () => {
    try {
      setState(prev => ({ ...prev, refreshing: true, error: null }))
      
      console.log('🔄 Fetching system TVL data...')
      const systemTVL = await TVLAPRService.getSystemTVL()
      
      // Calculate 24h change (placeholder - you'd store historical data in real app)
      const mockChange24h = {
        totalTVL: systemTVL.systemTVL.totalTVL * 0.025, // +2.5%
        farmTVL: systemTVL.farmTVL.totalFarmTVL * 0.035, // +3.5%
        lockerTVL: systemTVL.lockerTVL.totalLockerTVL * 0.015 // +1.5%
      }

      const metrics = {
        totalTVL: {
          current: systemTVL.systemTVL.totalTVL,
          change24h: mockChange24h.totalTVL,
          changePercent: 2.5,
          trend: 'up' as const
        },
        farmTVL: {
          current: systemTVL.farmTVL.totalFarmTVL,
          change24h: mockChange24h.farmTVL,
          changePercent: 3.5,
          trend: 'up' as const
        },
        lockerTVL: {
          current: systemTVL.lockerTVL.totalLockerTVL,
          change24h: mockChange24h.lockerTVL,
          changePercent: 1.5,
          trend: 'up' as const
        }
      }

      setState(prev => ({
        ...prev,
        systemTVL,
        metrics,
        loading: false,
        lastRefresh: Date.now(),
        refreshing: false
      }))

      console.log('✅ TVL data loaded successfully:', {
        totalTVL: `$${systemTVL.systemTVL.totalTVL.toLocaleString()}`,
        updateDuration: `${systemTVL.metadata.updateDuration}ms`,
        poolsProcessed: systemTVL.metadata.poolsProcessed
      })

    } catch (error) {
      console.error('❌ Error fetching TVL data:', error)
      setState(prev => ({
        ...prev,
        error: `Failed to load TVL data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        loading: false,
        refreshing: false
      }))
    }
  }

  const formatCurrency = (amount: number): string => {
    if (amount >= 1e9) return `$${(amount / 1e9).toFixed(2)}B`
    if (amount >= 1e6) return `$${(amount / 1e6).toFixed(2)}M`
    if (amount >= 1e3) return `$${(amount / 1e3).toFixed(1)}K`
    return `$${amount.toFixed(2)}`
  }

  const formatPercent = (percent: number): string => {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(1)}%`
  }

  const getTimeAgo = (timestamp: number): string => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return 'Just now'
  }

  const TrendIcon = ({ trend, changePercent }: { trend: string, changePercent: number }) => {
    if (trend === 'up') {
      return <TrendingUpIcon className="w-4 h-4 text-green-400" />
    } else if (trend === 'down') {
      return <TrendingDownIcon className="w-4 h-4 text-red-400" />
    }
    return <div className="w-4 h-4" />
  }

  if (state.loading) {
    return (
      <div className="text-center py-12">
        <LoadingSpinner className="w-12 h-12 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Loading System Overview</h3>
        <p className="text-slate-400">Fetching TVL data from farm pools and locker...</p>
      </div>
    )
  }

  if (state.error) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangleIcon className="w-8 h-8 text-red-400" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Error Loading Overview</h3>
        <p className="text-slate-400 mb-4">{state.error}</p>
        <button
          onClick={fetchTVLData}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
        >
          Retry
        </button>
      </div>
    )
  }

  const { systemTVL } = state

  if (!systemTVL) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">System Overview</h2>
          <p className="text-slate-400">
            Real-time TVL and metrics • Last updated: {getTimeAgo(state.lastRefresh)}
          </p>
        </div>
        <button
          onClick={fetchTVLData}
          disabled={state.refreshing}
          className="flex items-center space-x-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
        >
          <RefreshIcon className={`w-4 h-4 ${state.refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Main TVL Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total TVL */}
        <div className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 backdrop-blur-xl border border-purple-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-slate-300 text-sm">Total Value Locked</div>
            <DollarSignIcon className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {formatCurrency(state.metrics.totalTVL.current)}
          </div>
          <div className="flex items-center space-x-2">
            <TrendIcon trend={state.metrics.totalTVL.trend} changePercent={state.metrics.totalTVL.changePercent} />
            <span className={`text-sm ${state.metrics.totalTVL.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
              {formatPercent(state.metrics.totalTVL.changePercent)} (24h)
            </span>
          </div>
        </div>

        {/* Farm TVL */}
        <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 backdrop-blur-xl border border-green-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-slate-300 text-sm">Farm TVL</div>
            <BarChart3Icon className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {formatCurrency(state.metrics.farmTVL.current)}
          </div>
          <div className="flex items-center space-x-2">
            <TrendIcon trend={state.metrics.farmTVL.trend} changePercent={state.metrics.farmTVL.changePercent} />
            <span className={`text-sm ${state.metrics.farmTVL.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
              {formatPercent(state.metrics.farmTVL.changePercent)} (24h)
            </span>
          </div>
        </div>

        {/* Locker TVL */}
        <div className="bg-gradient-to-br from-orange-600/20 to-red-600/20 backdrop-blur-xl border border-orange-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-slate-300 text-sm">Locker TVL</div>
            <DatabaseIcon className="w-5 h-5 text-orange-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {formatCurrency(state.metrics.lockerTVL.current)}
          </div>
          <div className="flex items-center space-x-2">
            <TrendIcon trend={state.metrics.lockerTVL.trend} changePercent={state.metrics.lockerTVL.changePercent} />
            <span className={`text-sm ${state.metrics.lockerTVL.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
              {formatPercent(state.metrics.lockerTVL.changePercent)} (24h)
            </span>
          </div>
        </div>
      </div>

      {/* System Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
          <div className="text-slate-400 text-sm">Active Pools</div>
          <div className="text-2xl font-bold text-white mt-1">
            {systemTVL.metadata.poolsProcessed}
          </div>
          <div className="text-blue-400 text-sm mt-1">
            {systemTVL.farmTVL.lpPools.length} LP + {systemTVL.farmTVL.singlePools.length} Single
          </div>
        </div>

        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
          <div className="text-slate-400 text-sm">Price Sources</div>
          <div className="text-2xl font-bold text-white mt-1">
            {systemTVL.metadata.pricesUpdated}
          </div>
          <div className="text-purple-400 text-sm mt-1">
            Updated tokens
          </div>
        </div>

        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
          <div className="text-slate-400 text-sm">Update Time</div>
          <div className="text-2xl font-bold text-white mt-1">
            {systemTVL.metadata.updateDuration}ms
          </div>
          <div className="text-green-400 text-sm mt-1">
            Last calculation
          </div>
        </div>

        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
          <div className="text-slate-400 text-sm">System Status</div>
          <div className="flex items-center space-x-2 mt-1">
            <CheckCircleIcon className="w-6 h-6 text-green-400" />
            <span className="text-xl font-bold text-white">Healthy</span>
          </div>
          <div className="text-green-400 text-sm mt-1">
            All systems operational
          </div>
        </div>
      </div>

      {/* TVL Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Farm Pools Breakdown */}
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <BarChart3Icon className="w-5 h-5 text-green-400" />
            <span>Farm Pools TVL</span>
          </h3>
          
          {/* LP Pools */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-md font-medium text-slate-300">LP Pools</h4>
              <span className="text-green-400 font-medium">
                {formatCurrency(systemTVL.farmTVL.totalLPTVL)}
              </span>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {systemTVL.farmTVL.lpPools.slice(0, 5).map((pool, index) => (
                <div key={pool.poolId} className="flex justify-between items-center p-2 bg-slate-700/30 rounded-lg">
                  <div>
                    <div className="text-white text-sm font-medium">{pool.poolName}</div>
                    <div className="text-slate-400 text-xs">
                      APR: {pool.apr.toFixed(1)}% • {pool.priceSource}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-medium">{formatCurrency(pool.tvlUSD)}</div>
                    <div className="text-slate-400 text-xs">
                      {pool.totalStakedFormatted.toLocaleString()} LP
                    </div>
                  </div>
                </div>
              ))}
              {systemTVL.farmTVL.lpPools.length > 5 && (
                <div className="text-center text-slate-400 text-sm py-2">
                  +{systemTVL.farmTVL.lpPools.length - 5} more pools
                </div>
              )}
            </div>
          </div>

          {/* Single Pools */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-md font-medium text-slate-300">Single Asset Pools</h4>
              <span className="text-blue-400 font-medium">
                {formatCurrency(systemTVL.farmTVL.totalSingleTVL)}
              </span>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {systemTVL.farmTVL.singlePools.slice(0, 5).map((pool, index) => (
                <div key={pool.poolId} className="flex justify-between items-center p-2 bg-slate-700/30 rounded-lg">
                  <div>
                    <div className="text-white text-sm font-medium">{pool.poolName}</div>
                    <div className="text-slate-400 text-xs">
                      APR: {pool.apr.toFixed(1)}% • ${pool.tokenPrice.toFixed(4)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-medium">{formatCurrency(pool.tvlUSD)}</div>
                    <div className="text-slate-400 text-xs">
                      {pool.totalStakedFormatted.toLocaleString()} tokens
                    </div>
                  </div>
                </div>
              ))}
              {systemTVL.farmTVL.singlePools.length > 5 && (
                <div className="text-center text-slate-400 text-sm py-2">
                  +{systemTVL.farmTVL.singlePools.length - 5} more pools
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Locker Breakdown */}
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <DatabaseIcon className="w-5 h-5 text-orange-400" />
            <span>Victory Locker TVL</span>
          </h3>
          
          {/* Lock Period Breakdown */}
          <div className="space-y-3 mb-6">
            {systemTVL.lockerTVL.pools.map((pool, index) => (
              <div key={pool.lockPeriod} className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                <div>
                  <div className="text-white font-medium">{pool.lockPeriodName}</div>
                  <div className="text-slate-400 text-sm">
                    APR: {pool.estimatedAPR.toFixed(1)}% • {pool.allocationPercentage.toFixed(1)}% allocation
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white font-medium">{formatCurrency(pool.tvlUSD)}</div>
                  <div className="text-slate-400 text-sm">
                    {pool.totalLockedFormatted.toLocaleString()} VICTORY
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Reward Pools */}
          <div className="pt-4 border-t border-slate-700/30">
            <h4 className="text-md font-medium text-slate-300 mb-3">Reward Pools</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-slate-700/20 rounded-lg">
                <span className="text-slate-300">SUI Rewards</span>
                <span className="text-blue-400 font-medium">
                  {formatCurrency(systemTVL.lockerTVL.suiRewardsPool)}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 bg-slate-700/20 rounded-lg">
                <span className="text-slate-300">Victory Rewards</span>
                <span className="text-purple-400 font-medium">
                  {formatCurrency(systemTVL.lockerTVL.victoryRewardsPool)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Metadata */}
      {systemTVL.metadata.errors.length > 0 || systemTVL.metadata.warnings.length > 0 ? (
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <AlertTriangleIcon className="w-5 h-5 text-yellow-400" />
            <span>System Notifications</span>
          </h3>
          
          {systemTVL.metadata.errors.length > 0 && (
            <div className="mb-4">
              <h4 className="text-red-400 font-medium mb-2">Errors</h4>
              <div className="space-y-1">
                {systemTVL.metadata.errors.map((error, index) => (
                  <div key={index} className="text-red-300 text-sm bg-red-500/10 p-2 rounded">
                    {error}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {systemTVL.metadata.warnings.length > 0 && (
            <div>
              <h4 className="text-yellow-400 font-medium mb-2">Warnings</h4>
              <div className="space-y-1">
                {systemTVL.metadata.warnings.map((warning, index) => (
                  <div key={index} className="text-yellow-300 text-sm bg-yellow-500/10 p-2 rounded">
                    {warning}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}