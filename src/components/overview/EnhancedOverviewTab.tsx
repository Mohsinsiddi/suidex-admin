// components/overview/EnhancedOverviewTab.tsx
import React, { useState, useEffect } from 'react'
import { TVLAPRService, type SystemTVL } from '../../services/tvlAprService'
import { SystemMetrics } from './SystemMetrics'
import { PoolsDisplay } from './PoolsDisplay'
import { SystemStats } from './SystemStats'
import { 
  LoadingSpinner, 
  RefreshIcon,
  AlertTriangleIcon
} from '../icons'

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
        poolsProcessed: systemTVL.metadata.poolsProcessed,
        lpPools: systemTVL.farmTVL.lpPools.length,
        singlePools: systemTVL.farmTVL.singlePools.length,
        lockerPools: systemTVL.lockerTVL.pools.length
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

  const getTimeAgo = (timestamp: number): string => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return 'Just now'
  }

  const handleRetry = () => {
    fetchTVLData()
  }

  // Loading State
  if (state.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center py-12">
          <LoadingSpinner className="w-12 h-12 mx-auto mb-6 text-purple-400" />
          <h3 className="text-xl font-semibold text-white mb-2">Loading System Overview</h3>
          <p className="text-slate-400 mb-4">
            Fetching TVL data from farm pools and victory locker...
          </p>
          <div className="space-y-2 text-slate-500 text-sm">
            <div>• Discovering active pools</div>
            <div>• Updating token prices</div>
            <div>• Calculating APR rates</div>
            <div>• Aggregating TVL data</div>
          </div>
        </div>
      </div>
    )
  }

  // Error State
  if (state.error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center py-12 max-w-md">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangleIcon className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Failed to Load Overview</h3>
          <p className="text-slate-400 mb-6 text-sm leading-relaxed">{state.error}</p>
          <div className="space-y-3">
            <button
              onClick={handleRetry}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
            >
              Retry Loading
            </button>
            <p className="text-slate-500 text-xs">
              If the problem persists, check your network connection or try refreshing the page.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const { systemTVL } = state

  if (!systemTVL) return null

  return (
    <div className="space-y-8 pb-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">System Overview</h2>
          <p className="text-slate-400">
            Real-time TVL, APR rates, and system metrics • Last updated: {getTimeAgo(state.lastRefresh)}
          </p>
        </div>
        <button
          onClick={fetchTVLData}
          disabled={state.refreshing}
          className="flex items-center space-x-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshIcon className={`w-4 h-4 ${state.refreshing ? 'animate-spin' : ''}`} />
          <span>{state.refreshing ? 'Updating...' : 'Refresh'}</span>
        </button>
      </div>

      {/* System Metrics - Top Level TVL Cards */}
      <SystemMetrics 
        totalTVL={state.metrics.totalTVL}
        farmTVL={state.metrics.farmTVL}
        lockerTVL={state.metrics.lockerTVL}
      />

      {/* System Statistics and Health */}
      <SystemStats systemTVL={systemTVL} />

      {/* Detailed Pools Display */}
      <div>
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-white mb-2">All Pools & APR Rates</h3>
          <p className="text-slate-400">
            Complete overview of all farm pools and victory staking with real-time APR calculations
          </p>
        </div>
        <PoolsDisplay systemTVL={systemTVL} />
      </div>

      {/* Footer Info */}
      <div className="text-center pt-6 border-t border-slate-700/30">
        <p className="text-slate-500 text-sm">
          Data refreshes automatically every 5 minutes • 
          Update took {systemTVL.metadata.updateDuration}ms • 
          {systemTVL.metadata.poolsProcessed} pools processed • 
          {systemTVL.metadata.pricesUpdated} prices updated
        </p>
        {systemTVL.metadata.errors.length > 0 && (
          <p className="text-red-400 text-xs mt-1">
            ⚠️ {systemTVL.metadata.errors.length} system errors detected
          </p>
        )}
        {systemTVL.metadata.warnings.length > 0 && (
          <p className="text-yellow-400 text-xs mt-1">
            ⚠️ {systemTVL.metadata.warnings.length} system warnings
          </p>
        )}
      </div>
    </div>
  )
}