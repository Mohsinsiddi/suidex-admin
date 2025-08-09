// components/DexMonitoringTab.tsx
import React, { useState, useEffect } from 'react'
import { DexEventService, type DexEvent, type DexEventResponse, type DexEventFilters } from '../services/dexEventService'
import { 
  LoadingSpinner, 
  RefreshIcon,
  FilterIcon,
  ExternalLinkIcon,
  EyeIcon,
  ClockIcon,
  ActivityIcon
} from './icons'

// DEX-specific icons
export const SwapIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
  </svg>
)

export const LiquidityIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
)

export const BurnIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 1-4 4-4 2.207 0 4 1.793 4 4 0 .601-.065 1.187-.184 1.75.415.168.786.397 1.09.684A8 8 0 0117.657 18.657z" />
  </svg>
)

export const PairIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
  </svg>
)

export default function DexMonitoringTab() {
  const [eventResponse, setEventResponse] = useState<DexEventResponse>({ events: [], hasNextPage: false, totalCount: 0 })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<DexEventFilters>({
    eventType: 'all',
    pairType: 'all',
    dateRange: '7d',
    searchTerm: '',
    limit: 150
  })
  const [showFilters, setShowFilters] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<DexEvent | null>(null)
  const [showEventDetails, setShowEventDetails] = useState(false)

  useEffect(() => {
    fetchAllEvents()
  }, [])

  const fetchAllEvents = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🚀 DexMonitoringTab: Starting fetch with filters:', filters)
      
      const response = await DexEventService.fetchAllDexEvents(filters)
      setEventResponse(response)
      
      console.log(`✅ DexMonitoringTab: Loaded ${response.events.length} events`)
      
    } catch (error) {
      console.error('❌ DexMonitoringTab: Error fetching events:', error)
      setError(`Failed to load DEX events: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const refreshEvents = async () => {
    setRefreshing(true)
    await fetchAllEvents()
    setRefreshing(false)
  }

  // Update filters and refetch when filters change
  const updateFilters = (newFilters: Partial<DexEventFilters>) => {
    console.log('🔄 Filter update:', newFilters)
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  // Refetch when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchAllEvents()
    }, 300) // Debounce filter changes

    return () => clearTimeout(timeoutId)
  }, [filters])

  // Remove redundant filtering since service handles it now
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
      case 'PairCreated':
        return <PairIcon className="w-4 h-4" />
      case 'Swap':
        return <SwapIcon className="w-4 h-4" />
      case 'LPMint':
        return <LiquidityIcon className="w-4 h-4" />
      case 'LPBurn':
        return <BurnIcon className="w-4 h-4" />
      default:
        return <ActivityIcon className="w-4 h-4" />
    }
  }

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'PairCreated':
        return 'text-blue-400 bg-blue-500/20'
      case 'Swap':
        return 'text-green-400 bg-green-500/20'
      case 'LPMint':
        return 'text-purple-400 bg-purple-500/20'
      case 'LPBurn':
        return 'text-red-400 bg-red-500/20'
      default:
        return 'text-slate-400 bg-slate-500/20'
    }
  }

  const openEventDetails = (event: DexEvent) => {
    setSelectedEvent(event)
    setShowEventDetails(true)
  }

  const getSuiExplorerUrl = (txDigest: string) => {
    return `https://suiexplorer.com/txblock/${txDigest}?network=testnet`
  }

  const eventStats = DexEventService.getEventStats(eventResponse.events)

  if (loading) {
    return (
      <div className="text-center py-12">
        <LoadingSpinner className="w-12 h-12 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Loading DEX Events</h3>
        <p className="text-slate-400">Fetching trading and liquidity events from the blockchain...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <ExternalLinkIcon className="w-8 h-8 text-red-400" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Error Loading DEX Events</h3>
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
          <h3 className="text-xl font-bold text-white mb-2">DEX Activity Monitor</h3>
          <p className="text-slate-400">Track swaps, liquidity changes, and pair creation events</p>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Event Type</label>
              <select
                value={filters.eventType}
                onChange={(e) => updateFilters({ eventType: e.target.value })}
                className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-white"
              >
                <option value="all">All Events</option>
                <option value="PairCreated">Pair Created</option>
                <option value="Swap">Swaps</option>
                <option value="LPMint">LP Mint</option>
                <option value="LPBurn">LP Burn</option>
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
                <option value={200}>200 Events</option>
                <option value={300}>300 Events</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Time Range</label>
              <select
                value={filters.dateRange}
                onChange={(e) => updateFilters({ dateRange: e.target.value })}
                className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-white"
              >
                <option value="all">All Time</option>
                <option value="1d">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-4">
          <div className="text-slate-400 text-sm">Total Events</div>
          <div className="text-2xl font-bold text-white mt-1">{eventStats.total}</div>
          <div className="text-blue-400 text-sm mt-1">All DEX activity</div>
        </div>
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-4">
          <div className="text-slate-400 text-sm">Swaps</div>
          <div className="text-2xl font-bold text-white mt-1">{eventStats.Swap}</div>
          <div className="text-green-400 text-sm mt-1">Trading activity</div>
        </div>
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-4">
          <div className="text-slate-400 text-sm">LP Mints</div>
          <div className="text-2xl font-bold text-white mt-1">{eventStats.LPMint}</div>
          <div className="text-purple-400 text-sm mt-1">Liquidity added</div>
        </div>
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-4">
          <div className="text-slate-400 text-sm">LP Burns</div>
          <div className="text-2xl font-bold text-white mt-1">{eventStats.LPBurn}</div>
          <div className="text-red-400 text-sm mt-1">Liquidity removed</div>
        </div>
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-4">
          <div className="text-slate-400 text-sm">Unique Pairs</div>
          <div className="text-2xl font-bold text-white mt-1">{eventStats.uniquePairs}</div>
          <div className="text-yellow-400 text-sm mt-1">Active pairs</div>
        </div>
      </div>

      {/* Events Timeline */}
      <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700/30">
          <h4 className="text-lg font-semibold text-white">DEX Events Timeline</h4>
          <p className="text-slate-400 text-sm">
            Showing {displayEvents.length} events
            {filters.eventType !== 'all' && ` (${filters.eventType})`}
            {filters.dateRange !== 'all' && ` (${filters.dateRange})`}
            {filters.searchTerm && ` matching "${filters.searchTerm}"`}
          </p>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {displayEvents.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-slate-400">No events found matching your filters</p>
              <button 
                onClick={() => updateFilters({ eventType: 'all', dateRange: 'all', searchTerm: '' })}
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
                            {event.pairName && (
                              <>
                                <span className="text-slate-400">•</span>
                                <span className="text-slate-300">{event.pairName}</span>
                              </>
                            )}
                          </div>
                          <div className="text-sm text-slate-400 mt-1">
                            {event.type === 'Swap' && (
                              <>
                                Amount In: {event.data.rawAmountIn} • 
                                Amount Out: {event.data.rawAmountOut}
                              </>
                            )}
                            {event.type === 'LPMint' && (
                              <>
                                Liquidity: {event.data.rawLiquidity} • 
                                Amount0: {event.data.rawAmount0} • 
                                Amount1: {event.data.rawAmount1}
                              </>
                            )}
                            {event.type === 'LPBurn' && (
                              <>
                                Liquidity: {event.data.rawLiquidity} • 
                                Amount0: {event.data.rawAmount0} • 
                                Amount1: {event.data.rawAmount1}
                              </>
                            )}
                            {event.type === 'PairCreated' && (
                              <>
                                New trading pair created • 
                                Pair #{event.data.pairLength}
                              </>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                            <span className="flex items-center space-x-1">
                              <ClockIcon className="w-3 h-3" />
                              <span>{timeData.relative}</span>
                            </span>
                            <span>{timeData.date} {timeData.time}</span>
                            {event.sender !== 'factory' && event.sender !== 'unknown' && (
                              <span>User: {event.sender.slice(0, 8)}...</span>
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
                <h3 className="text-lg font-semibold text-white">DEX Event Details</h3>
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
                  <label className="text-sm text-slate-400">Pair</label>
                  <div className="text-white font-medium">{selectedEvent.pairName || 'N/A'}</div>
                </div>
                <div>
                  <label className="text-sm text-slate-400">Timestamp</label>
                  <div className="text-white">{formatTimestamp(selectedEvent.timestamp).date} {formatTimestamp(selectedEvent.timestamp).time}</div>
                </div>
                <div>
                  <label className="text-sm text-slate-400">Sender</label>
                  <div className="text-white font-mono text-sm">{selectedEvent.sender}</div>
                </div>
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