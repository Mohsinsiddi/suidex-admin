// components/FarmMonitoringTab.tsx
import React, { useState, useEffect } from 'react'
import { FarmEventService, type FarmEvent, type FarmEventResponse, type FarmEventFilters } from '../services/farmEventService'
import { 
  LoadingSpinner, 
  RefreshIcon,
  FilterIcon,
  ExternalLinkIcon,
  EyeIcon,
  ClockIcon,
  ActivityIcon
} from './icons'

// Farm-specific icons
export const StakeIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
  </svg>
)

export const UnstakeIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
  </svg>
)

export const RewardIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
  </svg>
)

export const FeeIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
)

export const PoolIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
)

export const AdminIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
)

export default function FarmMonitoringTab() {
  const [eventResponse, setEventResponse] = useState<FarmEventResponse>({ events: [], hasNextPage: false, totalCount: 0 })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<FarmEventFilters>({
    eventType: 'all',
    userAddress: '',
    poolType: '',
    dateRange: '1d',
    searchTerm: '',
    limit: 100
  })
  const [showFilters, setShowFilters] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<FarmEvent | null>(null)
  const [showEventDetails, setShowEventDetails] = useState(false)

  useEffect(() => {
    fetchAllEvents()
  }, [])

  const fetchAllEvents = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🚀 FarmMonitoringTab: Starting fetch with filters:', filters)
      
      const response = await FarmEventService.fetchAllFarmEvents(filters)
      setEventResponse(response)
      
      console.log(`✅ FarmMonitoringTab: Loaded ${response.events.length} events`)
      
    } catch (error) {
      console.error('❌ FarmMonitoringTab: Error fetching events:', error)
      setError(`Failed to load Farm events: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const refreshEvents = async () => {
    setRefreshing(true)
    await fetchAllEvents()
    setRefreshing(false)
  }

  const updateFilters = (newFilters: Partial<FarmEventFilters>) => {
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
      case 'Staked':
        return <StakeIcon className="w-4 h-4" />
      case 'Unstaked':
        return <UnstakeIcon className="w-4 h-4" />
      case 'RewardClaimed':
        return <RewardIcon className="w-4 h-4" />
      case 'FeesCollected':
        return <FeeIcon className="w-4 h-4" />
      case 'PoolCreated':
      case 'PoolConfigUpdated':
      case 'LPTypeAllowed':
        return <PoolIcon className="w-4 h-4" />
      case 'FarmPauseStateChanged':
      case 'AdminAddressesUpdated':
      case 'VaultDeposit':
      case 'AdminVaultSweep':
      case 'FarmInitialized':
        return <AdminIcon className="w-4 h-4" />
      default:
        return <ActivityIcon className="w-4 h-4" />
    }
  }

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'Staked':
        return 'text-green-400 bg-green-500/20'
      case 'Unstaked':
        return 'text-red-400 bg-red-500/20'
      case 'RewardClaimed':
        return 'text-yellow-400 bg-yellow-500/20'
      case 'FeesCollected':
        return 'text-orange-400 bg-orange-500/20'
      case 'PoolCreated':
      case 'PoolConfigUpdated':
      case 'LPTypeAllowed':
        return 'text-blue-400 bg-blue-500/20'
      case 'FarmPauseStateChanged':
      case 'AdminAddressesUpdated':
      case 'VaultDeposit':
      case 'AdminVaultSweep':
      case 'FarmInitialized':
        return 'text-purple-400 bg-purple-500/20'
      default:
        return 'text-slate-400 bg-slate-500/20'
    }
  }

  const openEventDetails = (event: FarmEvent) => {
    setSelectedEvent(event)
    setShowEventDetails(true)
  }

  const getSuiExplorerUrl = (txDigest: string) => {
    return `https://suiexplorer.com/txblock/${txDigest}?network=testnet`
  }

  const eventStats = FarmEventService.getEventStats(eventResponse.events)

  if (loading) {
    return (
      <div className="text-center py-12">
        <LoadingSpinner className="w-12 h-12 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Loading Farm Events</h3>
        <p className="text-slate-400">Fetching farm staking and management events from the blockchain...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <ExternalLinkIcon className="w-8 h-8 text-red-400" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Error Loading Farm Events</h3>
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
          <h3 className="text-xl font-bold text-white mb-2">Farm Activity Monitor</h3>
          <p className="text-slate-400">Track staking, rewards, pool management, and administrative events</p>
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
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Event Type</label>
              <select
                value={filters.eventType}
                onChange={(e) => updateFilters({ eventType: e.target.value })}
                className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-white"
              >
                <option value="all">All Events</option>
                <option value="Staked">Staked</option>
                <option value="Unstaked">Unstaked</option>
                <option value="RewardClaimed">Rewards Claimed</option>
                <option value="FeesCollected">Fees Collected</option>
                <option value="PoolCreated">Pool Created</option>
                <option value="PoolConfigUpdated">Pool Updated</option>
                <option value="Admin">Admin Events</option>
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
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-4">
          <div className="text-slate-400 text-sm">Total Events</div>
          <div className="text-2xl font-bold text-white mt-1">{eventStats.total}</div>
          <div className="text-blue-400 text-sm mt-1">All farm activity</div>
        </div>
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-4">
          <div className="text-slate-400 text-sm">Staked</div>
          <div className="text-2xl font-bold text-white mt-1">{eventStats.Staked}</div>
          <div className="text-green-400 text-sm mt-1">Stake events</div>
        </div>
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-4">
          <div className="text-slate-400 text-sm">Unstaked</div>
          <div className="text-2xl font-bold text-white mt-1">{eventStats.Unstaked}</div>
          <div className="text-red-400 text-sm mt-1">Unstake events</div>
        </div>
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-4">
          <div className="text-slate-400 text-sm">Rewards</div>
          <div className="text-2xl font-bold text-white mt-1">{eventStats.RewardClaimed}</div>
          <div className="text-yellow-400 text-sm mt-1">Claims made</div>
        </div>
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-4">
          <div className="text-slate-400 text-sm">Unique Users</div>
          <div className="text-2xl font-bold text-white mt-1">{eventStats.uniqueUsers}</div>
          <div className="text-purple-400 text-sm mt-1">Active users</div>
        </div>
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-4">
          <div className="text-slate-400 text-sm">Unique Pools</div>
          <div className="text-2xl font-bold text-white mt-1">{eventStats.uniquePools}</div>
          <div className="text-cyan-400 text-sm mt-1">Active pools</div>
        </div>
      </div>

      {/* Events Timeline */}
      <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700/30">
          <h4 className="text-lg font-semibold text-white">Farm Events Timeline</h4>
          <p className="text-slate-400 text-sm">
            Showing {displayEvents.length} events
            {filters.eventType !== 'all' && ` (${filters.eventType})`}
            {filters.dateRange !== 'all' && ` (${filters.dateRange})`}
            {filters.searchTerm && ` matching "${filters.searchTerm}"`}
            {filters.userAddress && ` for user ${filters.userAddress.slice(0, 8)}...`}
          </p>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {displayEvents.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-slate-400">No events found matching your filters</p>
              <button 
                onClick={() => updateFilters({ eventType: 'all', dateRange: 'all', searchTerm: '', userAddress: '' })}
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
                            {event.poolName && (
                              <>
                                <span className="text-slate-400">•</span>
                                <span className="text-slate-300">{event.poolName}</span>
                              </>
                            )}
                          </div>
                          <div className="text-sm text-slate-400 mt-1">
                            {event.type === 'Staked' && (
                              <>
                                Amount: {FarmEventService.formatAmount(event.amount || '0')} • 
                                User: {event.user?.slice(0, 8)}...
                              </>
                            )}
                            {event.type === 'Unstaked' && (
                              <>
                                Amount: {FarmEventService.formatAmount(event.amount || '0')} • 
                                User: {event.user?.slice(0, 8)}...
                              </>
                            )}
                            {event.type === 'RewardClaimed' && (
                              <>
                                Reward: {FarmEventService.formatAmount(event.amount || '0')} Victory • 
                                User: {event.user?.slice(0, 8)}...
                              </>
                            )}
                            {event.type === 'FeesCollected' && (
                              <>
                                Amount: {FarmEventService.formatAmount(event.amount || '0')} • 
                                Type: {event.data.feeType}
                              </>
                            )}
                            {event.type === 'PoolCreated' && (
                              <>
                                Allocation: {event.data.allocationPoints} • 
                                Deposit Fee: {event.data.depositFee}bp • 
                                LP Token: {event.data.isLpToken ? 'Yes' : 'No'}
                              </>
                            )}
                            {event.type === 'PoolConfigUpdated' && (
                              <>
                                Allocation: {event.data.oldAllocationPoints} → {event.data.newAllocationPoints} • 
                                Status: {event.data.newActive ? 'Active' : 'Inactive'}
                              </>
                            )}
                            {(['FarmPauseStateChanged', 'AdminAddressesUpdated', 'VaultDeposit', 'AdminVaultSweep', 'FarmInitialized'].includes(event.type)) && (
                              <>
                                Admin action: {event.eventName}
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
                <h3 className="text-lg font-semibold text-white">Farm Event Details</h3>
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
                  <label className="text-sm text-slate-400">Pool</label>
                  <div className="text-white font-medium">{selectedEvent.poolName || 'N/A'}</div>
                </div>
                <div>
                  <label className="text-sm text-slate-400">Timestamp</label>
                  <div className="text-white">{formatTimestamp(selectedEvent.timestamp).date} {formatTimestamp(selectedEvent.timestamp).time}</div>
                </div>
                <div>
                  <label className="text-sm text-slate-400">User/Sender</label>
                  <div className="text-white font-mono text-sm">{selectedEvent.user || selectedEvent.sender}</div>
                </div>
                {selectedEvent.amount && (
                  <div>
                    <label className="text-sm text-slate-400">Amount</label>
                    <div className="text-white font-medium">{FarmEventService.formatAmount(selectedEvent.amount)}</div>
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