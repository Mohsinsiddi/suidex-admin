// components/TokenLockerMonitoringTab.tsx
import React, { useState, useEffect } from 'react'
import { TokenLockerEventService, type TokenLockerEvent, type TokenLockerEventResponse, type TokenLockerEventFilters } from '../services/tokenLockerEventService'
import { 
  LoadingSpinner, 
  RefreshIcon,
  FilterIcon,
  ExternalLinkIcon,
  EyeIcon,
  ClockIcon,
  ActivityIcon
} from './icons'

// Token Locker specific icons
export const LockIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
)

export const UnlockIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
  </svg>
)

export const ClaimIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
  </svg>
)

export const RevenueIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
)

export const VaultIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
)

export const BatchIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
)

export const WarningIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
)

export default function TokenLockerMonitoringTab() {
  const [eventResponse, setEventResponse] = useState<TokenLockerEventResponse>({ events: [], hasNextPage: false, totalCount: 0 })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<TokenLockerEventFilters>({
    eventType: 'all',
    userAddress: '',
    adminAddress: '',
    dateRange: '1d',
    searchTerm: '',
    limit: 100
  })
  const [showFilters, setShowFilters] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<TokenLockerEvent | null>(null)
  const [showEventDetails, setShowEventDetails] = useState(false)

  useEffect(() => {
    fetchAllEvents()
  }, [])

  const fetchAllEvents = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🚀 TokenLockerMonitoringTab: Starting fetch with filters:', filters)
      
      const response = await TokenLockerEventService.fetchAllTokenLockerEvents(filters)
      setEventResponse(response)
      
      console.log(`✅ TokenLockerMonitoringTab: Loaded ${response.events.length} events`)
      
    } catch (error) {
      console.error('❌ TokenLockerMonitoringTab: Error fetching events:', error)
      setError(`Failed to load Token Locker events: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const refreshEvents = async () => {
    setRefreshing(true)
    await fetchAllEvents()
    setRefreshing(false)
  }

  const updateFilters = (newFilters: Partial<TokenLockerEventFilters>) => {
    console.log('🔄 Filter update:', newFilters)
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchAllEvents()
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [filters])

  const displayEvents = eventResponse.events

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(parseInt(timestamp))
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString(),
      relative: getRelativeTime(date)
    }
  }

  const getRelativeTime = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor(diffMs / (1000 * 60))

    if (diffDays > 0) return `${diffDays}d ago`
    if (diffHours > 0) return `${diffHours}h ago`
    if (diffMinutes > 0) return `${diffMinutes}m ago`
    return 'Just now'
  }

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'TokensLocked':
        return <LockIcon className="w-4 h-4" />
      case 'TokensUnlocked':
        return <UnlockIcon className="w-4 h-4" />
      case 'VictoryRewardsClaimed':
      case 'PoolSUIClaimed':
        return <ClaimIcon className="w-4 h-4" />
      case 'WeeklyRevenueAdded':
      case 'VictoryAllocationsUpdated':
      case 'SUIAllocationsUpdated':
        return <RevenueIcon className="w-4 h-4" />
      case 'VaultDeposit':
        return <VaultIcon className="w-4 h-4" />
      case 'AdminPresaleLockCreated':
        return <LockIcon className="w-4 h-4" />
      case 'BatchClaimCompleted':
      case 'UltimateBatchClaimCompleted':
      case 'SmartClaimResult':
      case 'SUIAutoClaimSummary':
        return <BatchIcon className="w-4 h-4" />
      case 'EpochCreated':
        return <ClockIcon className="w-4 h-4" />
      case 'EmissionWarning':
      case 'FundingDeferred':
        return <WarningIcon className="w-4 h-4" />
      default:
        return <ActivityIcon className="w-4 h-4" />
    }
  }

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'TokensLocked':
      case 'AdminPresaleLockCreated':
        return 'text-green-400 bg-green-500/20'
      case 'TokensUnlocked':
        return 'text-orange-400 bg-orange-500/20'
      case 'VictoryRewardsClaimed':
        return 'text-yellow-400 bg-yellow-500/20'
      case 'PoolSUIClaimed':
        return 'text-blue-400 bg-blue-500/20'
      case 'WeeklyRevenueAdded':
        return 'text-emerald-400 bg-emerald-500/20'
      case 'VictoryAllocationsUpdated':
      case 'SUIAllocationsUpdated':
        return 'text-cyan-400 bg-cyan-500/20'
      case 'VaultDeposit':
        return 'text-indigo-400 bg-indigo-500/20'
      case 'BatchClaimCompleted':
      case 'UltimateBatchClaimCompleted':
      case 'SmartClaimResult':
      case 'SUIAutoClaimSummary':
        return 'text-violet-400 bg-violet-500/20'
      case 'EpochCreated':
        return 'text-teal-400 bg-teal-500/20'
      case 'EmissionWarning':
      case 'FundingDeferred':
        return 'text-red-400 bg-red-500/20'
      default:
        return 'text-slate-400 bg-slate-500/20'
    }
  }

  const openEventDetails = (event: TokenLockerEvent) => {
    setSelectedEvent(event)
    setShowEventDetails(true)
  }

  const getSuiExplorerUrl = (txDigest: string) => {
    return `https://suiexplorer.com/txblock/${txDigest}?network=testnet`
  }

  const eventStats = TokenLockerEventService.getEventStats(eventResponse.events)

  if (loading) {
    return (
      <div className="text-center py-12">
        <LoadingSpinner className="w-12 h-12 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Loading Token Locker Events</h3>
        <p className="text-slate-400">Fetching token locking, rewards, and administrative events from the blockchain...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <ExternalLinkIcon className="w-8 h-8 text-red-400" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Error Loading Token Locker Events</h3>
        <p className="text-slate-400 mb-4">{error}</p>
        <button
          onClick={fetchAllEvents}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-white mb-2">Token Locker Activity Monitor</h3>
          <p className="text-slate-400">Track token locking, unlocking, rewards, revenue distribution, and administrative events</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
              showFilters 
                ? 'bg-purple-600/20 border-purple-500/30 text-purple-300' 
                : 'border-slate-600 text-slate-300 hover:bg-slate-700/50'
            }`}
          >
            <FilterIcon className="w-4 h-4" />
            <span>Filters</span>
          </button>
          <button
            onClick={refreshEvents}
            disabled={refreshing}
            className="flex items-center space-x-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
          >
            <RefreshIcon className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Event Type</label>
              <select
                value={filters.eventType}
                onChange={(e) => updateFilters({ eventType: e.target.value })}
                className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-white"
              >
                <option value="all">All Events</option>
                <option value="TokensLocked">Tokens Locked</option>
                <option value="TokensUnlocked">Tokens Unlocked</option>
                <option value="VictoryRewardsClaimed">Victory Claimed</option>
                <option value="PoolSUIClaimed">SUI Claimed</option>
                <option value="Revenue">Revenue & Allocations</option>
                <option value="Admin">Admin Events</option>
                <option value="BatchClaim">Batch Claims</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Limit</label>
              <select
                value={filters.limit}
                onChange={(e) => updateFilters({ limit: parseInt(e.target.value) })}
                className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-white"
              >
                <option value={50}>50 Events</option>
                <option value={100}>100 Events</option>
                <option value={150}>150 Events</option>
                <option value={200}>200 Events</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Time Range</label>
              <select
                value={filters.dateRange}
                onChange={(e) => updateFilters({ dateRange: e.target.value })}
                className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-white"
              >
                <option value="1d">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="all">All Time</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">User Address</label>
              <input
                type="text"
                placeholder="0x1234..."
                value={filters.userAddress || ''}
                onChange={(e) => updateFilters({ userAddress: e.target.value })}
                className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Admin Address</label>
              <input
                type="text"
                placeholder="0x1234..."
                value={filters.adminAddress || ''}
                onChange={(e) => updateFilters({ adminAddress: e.target.value })}
                className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Search</label>
              <input
                type="text"
                placeholder="Search events..."
                value={filters.searchTerm}
                onChange={(e) => updateFilters({ searchTerm: e.target.value })}
                className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400"
              />
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-4">
          <div className="text-slate-400 text-sm">Total Events</div>
          <div className="text-2xl font-bold text-white mt-1">{eventStats.total}</div>
          <div className="text-blue-400 text-sm mt-1">All activity</div>
        </div>
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-4">
          <div className="text-slate-400 text-sm">Locked</div>
          <div className="text-2xl font-bold text-white mt-1">{eventStats.TokensLocked}</div>
          <div className="text-green-400 text-sm mt-1">Lock events</div>
        </div>
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-4">
          <div className="text-slate-400 text-sm">Unlocked</div>
          <div className="text-2xl font-bold text-white mt-1">{eventStats.TokensUnlocked}</div>
          <div className="text-orange-400 text-sm mt-1">Unlock events</div>
        </div>
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-4">
          <div className="text-slate-400 text-sm">Victory Claims</div>
          <div className="text-2xl font-bold text-white mt-1">{eventStats.VictoryRewardsClaimed}</div>
          <div className="text-yellow-400 text-sm mt-1">Reward claims</div>
        </div>
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-4">
          <div className="text-slate-400 text-sm">SUI Claims</div>
          <div className="text-2xl font-bold text-white mt-1">{eventStats.PoolSUIClaimed}</div>
          <div className="text-blue-400 text-sm mt-1">SUI claims</div>
        </div>
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-4">
          <div className="text-slate-400 text-sm">Unique Users</div>
          <div className="text-2xl font-bold text-white mt-1">{eventStats.uniqueUsers}</div>
          <div className="text-purple-400 text-sm mt-1">Active users</div>
        </div>
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-4">
          <div className="text-slate-400 text-sm">Admin Events</div>
          <div className="text-2xl font-bold text-white mt-1">{eventStats.Admin}</div>
          <div className="text-red-400 text-sm mt-1">Admin actions</div>
        </div>
      </div>

      {/* Events Timeline */}
      <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700/30">
          <h4 className="text-lg font-semibold text-white">Token Locker Events Timeline</h4>
          <p className="text-slate-400 text-sm">
            Showing {displayEvents.length} events
            {filters.eventType !== 'all' && ` (${filters.eventType})`}
            {filters.dateRange !== 'all' && ` (${filters.dateRange})`}
            {filters.searchTerm && ` matching "${filters.searchTerm}"`}
            {filters.userAddress && ` for user ${filters.userAddress.slice(0, 8)}...`}
            {filters.adminAddress && ` for admin ${filters.adminAddress.slice(0, 8)}...`}
          </p>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {displayEvents.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-slate-400">No events found matching your filters</p>
              <button 
                onClick={() => updateFilters({ eventType: 'all', dateRange: 'all', searchTerm: '', userAddress: '', adminAddress: '' })}
                className="mt-2 text-purple-400 hover:text-purple-300"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/30">
              {displayEvents.map((event) => {
                const timeData = formatTimestamp(event.timestamp)
                
                return (
                  <div key={event.id} className="p-4 hover:bg-slate-700/20 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getEventColor(event.type)}`}>
                          {getEventIcon(event.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-white font-medium">{event.eventName}</span>
                            {event.data.lockPeriodName && (
                              <>
                                <span className="text-slate-400">•</span>
                                <span className="text-slate-300">{event.data.lockPeriodName}</span>
                              </>
                            )}
                          </div>
                          <div className="text-sm text-slate-400 mt-1">
                            {event.type === 'TokensLocked' && (
                              <>
                                Amount: {TokenLockerEventService.formatAmount(event.amount || '0')} Victory • 
                                Lock ID: {event.data.lockId} • 
                                User: {event.user?.slice(0, 8)}...
                              </>
                            )}
                            {event.type === 'TokensUnlocked' && (
                              <>
                                Amount: {TokenLockerEventService.formatAmount(event.amount || '0')} Victory • 
                                Victory Rewards: {TokenLockerEventService.formatAmount(event.data.victoryRewards || '0')} • 
                                SUI Rewards: {TokenLockerEventService.formatAmount(event.data.suiRewards || '0')} • 
                                User: {event.user?.slice(0, 8)}...
                              </>
                            )}
                            {event.type === 'VictoryRewardsClaimed' && (
                              <>
                                Reward: {TokenLockerEventService.formatAmount(event.amount || '0')} Victory • 
                                Lock ID: {event.data.lockId} • 
                                Total Claimed: {TokenLockerEventService.formatAmount(event.data.totalClaimedForLock || '0')} • 
                                User: {event.user?.slice(0, 8)}...
                              </>
                            )}
                            {event.type === 'PoolSUIClaimed' && (
                              <>
                                SUI: {TokenLockerEventService.formatAmount(event.amount || '0')} SUI • 
                                Epoch: {event.data.epochId} • 
                                Lock ID: {event.data.lockId} • 
                                Staked: {TokenLockerEventService.formatAmount(event.data.amountStaked || '0')} • 
                                User: {event.user?.slice(0, 8)}...
                              </>
                            )}
                            {event.type === 'WeeklyRevenueAdded' && (
                              <>
                                Epoch: {event.data.epochId} • 
                                Amount: {TokenLockerEventService.formatAmount(event.amount || '0')} SUI • 
                                Total Revenue: {TokenLockerEventService.formatAmount(event.data.totalWeekRevenue || '0')} SUI
                              </>
                            )}
                            {event.type === 'VictoryAllocationsUpdated' && (
                              <>
                                Week: {(event.data.weekAllocation / 100).toFixed(1)}% • 
                                3-Month: {(event.data.threeMonthAllocation / 100).toFixed(1)}% • 
                                Year: {(event.data.yearAllocation / 100).toFixed(1)}% • 
                                3-Year: {(event.data.threeYearAllocation / 100).toFixed(1)}%
                              </>
                            )}
                            {event.type === 'SUIAllocationsUpdated' && (
                              <>
                                Week: {(event.data.weekAllocation / 100).toFixed(1)}% • 
                                3-Month: {(event.data.threeMonthAllocation / 100).toFixed(1)}% • 
                                Year: {(event.data.yearAllocation / 100).toFixed(1)}% • 
                                3-Year: {(event.data.threeYearAllocation / 100).toFixed(1)}%
                              </>
                            )}
                            {event.type === 'VaultDeposit' && (
                              <>
                                Vault: {event.data.vaultType} • 
                                Amount: {TokenLockerEventService.formatAmount(event.amount || '0')} • 
                                Total Balance: {TokenLockerEventService.formatAmount(event.data.totalBalance || '0')}
                              </>
                            )}
                            {event.type === 'AdminPresaleLockCreated' && (
                              <>
                                Amount: {TokenLockerEventService.formatAmount(event.amount || '0')} Victory • 
                                Lock ID: {event.data.lockId} • 
                                User: {event.user?.slice(0, 8)}... • 
                                Admin: {event.admin?.slice(0, 8)}...
                              </>
                            )}
                            {event.type === 'BatchClaimCompleted' && (
                              <>
                                Lock ID: {event.data.lockId} • 
                                Epochs: {event.data.epochsClaimed} • 
                                SUI: {TokenLockerEventService.formatAmount(event.amount || '0')} • 
                                User: {event.user?.slice(0, 8)}...
                              </>
                            )}
                            {event.type === 'UltimateBatchClaimCompleted' && (
                              <>
                                Locks: {event.data.locksProcessed} • 
                                Epochs: {event.data.totalEpochsClaimed} • 
                                SUI: {TokenLockerEventService.formatAmount(event.amount || '0')} • 
                                User: {event.user?.slice(0, 8)}...
                              </>
                            )}
                            {event.type === 'SmartClaimResult' && (
                              <>
                                Strategy: {event.data.strategyUsed} • 
                                Locks: {event.data.locksProcessed} • 
                                Epochs: {event.data.epochsClaimed} • 
                                SUI: {TokenLockerEventService.formatAmount(event.amount || '0')} • 
                                User: {event.user?.slice(0, 8)}...
                              </>
                            )}
                            {event.type === 'SUIAutoClaimSummary' && (
                              <>
                                Lock ID: {event.data.lockId} • 
                                SUI: {TokenLockerEventService.formatAmount(event.amount || '0')} • 
                                User: {event.user?.slice(0, 8)}...
                              </>
                            )}
                            {event.type === 'EpochCreated' && (
                              <>
                                Epoch: {event.data.epochId} • 
                                Week Start: {new Date(event.data.weekStart * 1000).toLocaleDateString()} • 
                                Week End: {new Date(event.data.weekEnd * 1000).toLocaleDateString()}
                              </>
                            )}
                            {event.type === 'EmissionWarning' && (
                              <>
                                Message: {event.data.message} • 
                                {event.data.lockId && `Lock ID: ${event.data.lockId}`}
                              </>
                            )}
                            {event.type === 'FundingDeferred' && (
                              <>
                                Reason: {event.data.reason} • 
                                Required: {TokenLockerEventService.formatAmount(event.data.required?.toString() || '0')} • 
                                Current: {TokenLockerEventService.formatAmount(event.data.current?.toString() || '0')}
                              </>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                            <span className="flex items-center space-x-1">
                              <ClockIcon className="w-3 h-3" />
                              <span>{timeData.relative}</span>
                            </span>
                            <span>{timeData.date} {timeData.time}</span>
                            {event.user && event.user !== 'unknown' && (
                              <span>User: {event.user.slice(0, 8)}...</span>
                            )}
                            {event.admin && event.admin !== 'unknown' && (
                              <span>Admin: {event.admin.slice(0, 8)}...</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openEventDetails(event)}
                          className="text-slate-400 hover:text-white p-1"
                          title="View Details"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <a
                          href={getSuiExplorerUrl(event.txDigest)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-400 hover:text-white p-1"
                          title="View on Sui Explorer"
                        >
                          <ExternalLinkIcon className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Event Details Modal */}
      {showEventDetails && selectedEvent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Token Locker Event Details</h3>
                <button 
                  onClick={() => setShowEventDetails(false)} 
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-400">Event Type</label>
                  <div className="text-white font-medium">{selectedEvent.eventName}</div>
                </div>
                <div>
                  <label className="text-sm text-slate-400">Event Category</label>
                  <div className="text-white font-medium">{selectedEvent.type}</div>
                </div>
                <div>
                  <label className="text-sm text-slate-400">Timestamp</label>
                  <div className="text-white">{formatTimestamp(selectedEvent.timestamp).date} {formatTimestamp(selectedEvent.timestamp).time}</div>
                </div>
                <div>
                  <label className="text-sm text-slate-400">User/Sender</label>
                  <div className="text-white font-mono text-sm">{selectedEvent.user || selectedEvent.sender}</div>
                </div>
                {selectedEvent.admin && (
                  <div>
                    <label className="text-sm text-slate-400">Admin</label>
                    <div className="text-white font-mono text-sm">{selectedEvent.admin}</div>
                  </div>
                )}
                {selectedEvent.amount && (
                  <div>
                    <label className="text-sm text-slate-400">Amount</label>
                    <div className="text-white font-medium">{TokenLockerEventService.formatAmount(selectedEvent.amount)}</div>
                  </div>
                )}
                <div className="col-span-2">
                  <label className="text-sm text-slate-400">Transaction</label>
                  <div className="text-blue-400 font-mono text-sm break-all">
                    <a href={getSuiExplorerUrl(selectedEvent.txDigest)} target="_blank" rel="noopener noreferrer">
                      {selectedEvent.txDigest}
                    </a>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="text-sm text-slate-400">Event Data</label>
                <pre className="bg-slate-900/50 border border-slate-600 rounded-lg p-4 text-sm text-slate-300 overflow-x-auto">
                  {JSON.stringify(selectedEvent.data, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}