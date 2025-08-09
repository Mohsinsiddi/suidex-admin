// components/GlobalEmissionMonitoringTab.tsx
import React, { useState, useEffect } from 'react'
import { GlobalEmissionEventService, type GlobalEmissionEvent, type GlobalEmissionEventResponse, type GlobalEmissionEventFilters } from '../services/globalEmissionEventService'
import { 
  LoadingSpinner, 
  RefreshIcon,
  FilterIcon,
  ExternalLinkIcon,
  EyeIcon,
  ClockIcon,
  ActivityIcon
} from './icons'

// Global Emission specific icons
export const EmissionIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
)

export const PauseIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

export const PlayIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1M9 16h1m4 0h1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

export const ResetIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
)

export const AllocationIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
)

export default function GlobalEmissionMonitoringTab() {
  const [eventResponse, setEventResponse] = useState<GlobalEmissionEventResponse>({ events: [], hasNextPage: false, totalCount: 0 })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<GlobalEmissionEventFilters>({
    eventType: 'all',
    contractType: 'all',
    dateRange: '7d',
    searchTerm: '',
    limit: 100
  })
  const [showFilters, setShowFilters] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<GlobalEmissionEvent | null>(null)
  const [showEventDetails, setShowEventDetails] = useState(false)

  useEffect(() => {
    fetchAllEvents()
  }, [])

  const fetchAllEvents = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🚀 GlobalEmissionMonitoringTab: Starting fetch with filters:', filters)
      
      const response = await GlobalEmissionEventService.fetchAllGlobalEmissionEvents(filters)
      setEventResponse(response)
      
      console.log(`✅ GlobalEmissionMonitoringTab: Loaded ${response.events.length} events`)
      
    } catch (error) {
      console.error('❌ GlobalEmissionMonitoringTab: Error fetching events:', error)
      setError(`Failed to load Global Emission events: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const refreshEvents = async () => {
    setRefreshing(true)
    await fetchAllEvents()
    setRefreshing(false)
  }

  const updateFilters = (newFilters: Partial<GlobalEmissionEventFilters>) => {
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
      case 'EmissionScheduleStarted':
        return <EmissionIcon className="w-4 h-4" />
      case 'SystemPaused':
      case 'EmissionPaused':
        return <PauseIcon className="w-4 h-4" />
      case 'SystemUnpaused':
        return <PlayIcon className="w-4 h-4" />
      case 'WeekReset':
      case 'TimingAdjusted':
        return <ResetIcon className="w-4 h-4" />
      case 'ContractAllocationRequested':
        return <AllocationIcon className="w-4 h-4" />
      default:
        return <ActivityIcon className="w-4 h-4" />
    }
  }

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'EmissionScheduleStarted':
        return 'text-green-400 bg-green-500/20'
      case 'SystemPaused':
      case 'EmissionPaused':
        return 'text-red-400 bg-red-500/20'
      case 'SystemUnpaused':
        return 'text-green-400 bg-green-500/20'
      case 'WeekReset':
      case 'TimingAdjusted':
        return 'text-orange-400 bg-orange-500/20'
      case 'ContractAllocationRequested':
        return 'text-blue-400 bg-blue-500/20'
      default:
        return 'text-slate-400 bg-slate-500/20'
    }
  }

  const openEventDetails = (event: GlobalEmissionEvent) => {
    setSelectedEvent(event)
    setShowEventDetails(true)
  }

  const getSuiExplorerUrl = (txDigest: string) => {
    return `https://suiexplorer.com/txblock/${txDigest}?network=testnet`
  }

  const eventStats = GlobalEmissionEventService.getEventStats(eventResponse.events)

  if (loading) {
    return (
      <div className="text-center py-12">
        <LoadingSpinner className="w-12 h-12 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Loading Global Emission Events</h3>
        <p className="text-slate-400">Fetching emission system events from the blockchain...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <ExternalLinkIcon className="w-8 h-8 text-red-400" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Error Loading Emission Events</h3>
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
          <h3 className="text-xl font-bold text-white mb-2">Global Emission Monitor</h3>
          <p className="text-slate-400">Track emission system events, allocations, and administrative actions</p>
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
                <option value="EmissionScheduleStarted">Schedule Started</option>
                <option value="SystemPaused">System Paused</option>
                <option value="SystemUnpaused">System Unpaused</option>
                <option value="WeekReset">Week Reset</option>
                <option value="TimingAdjusted">Timing Adjusted</option>
                <option value="ContractAllocationRequested">Allocations</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Contract Type</label>
              <select
                value={filters.contractType || 'all'}
                onChange={(e) => updateFilters({ contractType: e.target.value })}
                className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-white"
              >
                <option value="all">All Contracts</option>
                <option value="farm">Farm Contract</option>
                <option value="victory_staking">Victory Staking</option>
                <option value="dev_treasury">Dev Treasury</option>
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
          <div className="text-blue-400 text-sm mt-1">All emission events</div>
        </div>
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-4">
          <div className="text-slate-400 text-sm">Allocations</div>
          <div className="text-2xl font-bold text-white mt-1">{eventStats.ContractAllocationRequested}</div>
          <div className="text-blue-400 text-sm mt-1">Requests made</div>
        </div>
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-4">
          <div className="text-slate-400 text-sm">System Pauses</div>
          <div className="text-2xl font-bold text-white mt-1">{eventStats.SystemPaused}</div>
          <div className="text-red-400 text-sm mt-1">Emergency stops</div>
        </div>
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-4">
          <div className="text-slate-400 text-sm">Recoveries</div>
          <div className="text-2xl font-bold text-white mt-1">{eventStats.WeekReset + eventStats.TimingAdjusted}</div>
          <div className="text-orange-400 text-sm mt-1">Admin fixes</div>
        </div>
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-4">
          <div className="text-slate-400 text-sm">Current Week</div>
          <div className="text-2xl font-bold text-white mt-1">{eventStats.currentWeek || 'N/A'}</div>
          <div className="text-purple-400 text-sm mt-1">Emission week</div>
        </div>
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-4">
          <div className="text-slate-400 text-sm">Unique Contracts</div>
          <div className="text-2xl font-bold text-white mt-1">{eventStats.uniqueContracts}</div>
          <div className="text-cyan-400 text-sm mt-1">Active contracts</div>
        </div>
      </div>

      {/* Events Timeline */}
      <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700/30">
          <h4 className="text-lg font-semibold text-white">Emission Events Timeline</h4>
          <p className="text-slate-400 text-sm">
            Showing {displayEvents.length} events
            {filters.eventType !== 'all' && ` (${filters.eventType})`}
            {filters.contractType !== 'all' && ` (${filters.contractType})`}
            {filters.dateRange !== 'all' && ` (${filters.dateRange})`}
            {filters.searchTerm && ` matching "${filters.searchTerm}"`}
          </p>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {displayEvents.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-slate-400">No events found matching your filters</p>
              <button 
                onClick={() => updateFilters({ eventType: 'all', contractType: 'all', dateRange: 'all', searchTerm: '' })}
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
                            {event.week && (
                              <>
                                <span className="text-slate-400">•</span>
                                <span className="text-slate-300">Week {event.week}</span>
                              </>
                            )}
                            {event.phase !== undefined && (
                              <>
                                <span className="text-slate-400">•</span>
                                <span className="text-slate-300">{GlobalEmissionEventService.getPhaseName(event.phase)}</span>
                              </>
                            )}
                          </div>
                          <div className="text-sm text-slate-400 mt-1">
                            {event.type === 'EmissionScheduleStarted' && (
                              <>
                                156-week emission schedule initialized • 
                                Started at block time {new Date(event.data.startTimestamp * 1000).toLocaleString()}
                              </>
                            )}
                            {event.type === 'ContractAllocationRequested' && (
                              <>
                                {event.data.displayName} • 
                                Amount: {GlobalEmissionEventService.formatAmount(event.amount || '0')} Victory/sec • 
                                Week {event.week}, Phase {event.phase}
                              </>
                            )}
                            {event.type === 'SystemPaused' && (
                              <>
                                Emergency system pause activated
                              </>
                            )}
                            {event.type === 'SystemUnpaused' && (
                              <>
                                System operations resumed
                              </>
                            )}
                            {event.type === 'WeekReset' && (
                              <>
                                Reset to week {event.data.targetWeek} • 
                                Timeline adjusted for recovery
                              </>
                            )}
                            {event.type === 'TimingAdjusted' && (
                              <>
                                {event.data.subtract ? 'Extended' : 'Shortened'} by {event.data.hoursAdjusted} hours • 
                                Fine-tuning emission schedule
                              </>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                            <span className="flex items-center space-x-1">
                              <ClockIcon className="w-3 h-3" />
                              <span>{timeData.relative}</span>
                            </span>
                            <span>{timeData.date} {timeData.time}</span>
                            {event.contractType && (
                              <span>Contract: {event.contractType}</span>
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
                <h3 className="text-lg font-semibold text-white">Emission Event Details</h3>
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
                  <label className="text-sm text-slate-400">Contract Type</label>
                  <div className="text-white font-medium">{selectedEvent.contractType || 'N/A'}</div>
                </div>
                <div>
                  <label className="text-sm text-slate-400">Timestamp</label>
                  <div className="text-white">{formatTimestamp(selectedEvent.timestamp).date} {formatTimestamp(selectedEvent.timestamp).time}</div>
                </div>
                <div>
                  <label className="text-sm text-slate-400">Sender</label>
                  <div className="text-white font-mono text-sm">{selectedEvent.sender}</div>
                </div>
                {selectedEvent.week && (
                  <div>
                    <label className="text-sm text-slate-400">Emission Week</label>
                    <div className="text-white font-medium">{selectedEvent.week}</div>
                  </div>
                )}
                {selectedEvent.phase !== undefined && (
                  <div>
                    <label className="text-sm text-slate-400">Phase</label>
                    <div className="text-white font-medium">{GlobalEmissionEventService.getPhaseName(selectedEvent.phase)}</div>
                  </div>
                )}
                {selectedEvent.amount && (
                  <div>
                    <label className="text-sm text-slate-400">Amount</label>
                    <div className="text-white font-medium">{GlobalEmissionEventService.formatAmount(selectedEvent.amount)} Victory/sec</div>
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