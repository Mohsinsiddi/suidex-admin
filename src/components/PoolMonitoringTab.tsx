// components/PoolMonitoringTab.tsx
import React, { useState, useEffect } from 'react'
import { EventBasedPoolService } from '../services/eventBasedPoolService'
import { 
  LoadingSpinner, 
  RefreshIcon,
  CalendarIcon,
  FilterIcon,
  ExternalLinkIcon,
  CheckIcon,
  EditIcon,
  PlusIcon,
  EyeIcon,
  ClockIcon,
  ActivityIcon
} from './icons'

interface PoolEvent {
  id: string
  type: 'PoolCreated' | 'PoolConfigUpdated' | 'AdminAddressesUpdated' | 'FarmPauseStateChanged' | 'LPTypeAllowed'
  eventName: string
  poolType?: string
  poolName?: string
  data: any
  timestamp: string
  txDigest: string
  blockNumber?: string
  sender: string
}

interface EventFilters {
  eventType: string
  poolType: string
  dateRange: string
  searchTerm: string
}

export default function PoolMonitoringTab() {
  const [events, setEvents] = useState<PoolEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<EventFilters>({
    eventType: 'all',
    poolType: 'all',
    dateRange: '7d',
    searchTerm: ''
  })
  const [showFilters, setShowFilters] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<PoolEvent | null>(null)
  const [showEventDetails, setShowEventDetails] = useState(false)

  useEffect(() => {
    fetchAllEvents()
  }, [])

  const fetchAllEvents = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Fetching all pool management events...')
      
      // Fetch different types of events
      const [poolCreatedEvents, poolUpdatedEvents] = await Promise.all([
        EventBasedPoolService.fetchPoolCreatedEvents(),
        EventBasedPoolService.fetchPoolConfigUpdatedEvents()
      ])

      // Process and combine all events
      const allEvents: PoolEvent[] = []

      // Process PoolCreated events
      poolCreatedEvents.forEach((event, index) => {
        const poolTypeString = EventBasedPoolService.extractPoolTypeString(event.poolType)
        const poolInfo = EventBasedPoolService.processPoolType(poolTypeString, event.isLpToken, event.isNativePair)
        
        allEvents.push({
          id: `created-${event.txDigest}-${index}`,
          type: 'PoolCreated',
          eventName: 'Pool Created',
          poolType: poolTypeString,
          poolName: poolInfo.displayName,
          data: {
            allocationPoints: event.allocationPoints,
            depositFee: event.depositFee,
            withdrawalFee: event.withdrawalFee,
            isNativePair: event.isNativePair,
            isLpToken: event.isLpToken
          },
          timestamp: event.timestamp || '0',
          txDigest: event.txDigest || '',
          sender: 'admin' // You might want to extract this from event data
        })
      })

      // Process PoolConfigUpdated events
      poolUpdatedEvents.forEach((event, index) => {
        const poolTypeString = EventBasedPoolService.extractPoolTypeString(event.poolType)
        
        allEvents.push({
          id: `updated-${event.txDigest}-${index}`,
          type: 'PoolConfigUpdated',
          eventName: 'Pool Updated',
          poolType: poolTypeString,
          poolName: `Pool ${poolTypeString.split('::').pop()}`, // Extract token name
          data: {
            oldAllocationPoints: event.oldAllocationPoints,
            newAllocationPoints: event.newAllocationPoints,
            oldDepositFee: event.oldDepositFee,
            newDepositFee: event.newDepositFee,
            oldWithdrawalFee: event.oldWithdrawalFee,
            newWithdrawalFee: event.newWithdrawalFee,
            oldActive: event.oldActive,
            newActive: event.newActive
          },
          timestamp: event.timestamp || '0',
          txDigest: event.txDigest || '',
          sender: 'admin'
        })
      })

      // Sort by timestamp (newest first)
      allEvents.sort((a, b) => parseInt(b.timestamp) - parseInt(a.timestamp))
      
      setEvents(allEvents)
      console.log(`Loaded ${allEvents.length} events`)
      
    } catch (error) {
      console.error('Error fetching events:', error)
      setError(`Failed to load events: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const refreshEvents = async () => {
    setRefreshing(true)
    await fetchAllEvents()
    setRefreshing(false)
  }

  const filteredEvents = events.filter(event => {
    // Event type filter
    if (filters.eventType !== 'all' && event.type !== filters.eventType) {
      return false
    }

    // Pool type filter
    if (filters.poolType !== 'all') {
      if (filters.poolType === 'LP' && !event.data?.isLpToken) return false
      if (filters.poolType === 'Single' && event.data?.isLpToken) return false
    }

    // Search term filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase()
      return (
        event.poolName?.toLowerCase().includes(searchLower) ||
        event.poolType?.toLowerCase().includes(searchLower) ||
        event.txDigest.toLowerCase().includes(searchLower) ||
        event.eventName.toLowerCase().includes(searchLower)
      )
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const eventTime = parseInt(event.timestamp)
      const now = Date.now()
      const dayMs = 24 * 60 * 60 * 1000

      switch (filters.dateRange) {
        case '1d':
          return now - eventTime < dayMs
        case '7d':
          return now - eventTime < 7 * dayMs
        case '30d':
          return now - eventTime < 30 * dayMs
        default:
          return true
      }
    }

    return true
  })

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
      case 'PoolCreated':
        return <PlusIcon className="w-4 h-4" />
      case 'PoolConfigUpdated':
        return <EditIcon className="w-4 h-4" />
      default:
        return <ActivityIcon className="w-4 h-4" />
    }
  }

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'PoolCreated':
        return 'text-green-400 bg-green-500/20'
      case 'PoolConfigUpdated':
        return 'text-blue-400 bg-blue-500/20'
      default:
        return 'text-purple-400 bg-purple-500/20'
    }
  }

  const openEventDetails = (event: PoolEvent) => {
    setSelectedEvent(event)
    setShowEventDetails(true)
  }

  const getSuiExplorerUrl = (txDigest: string) => {
    return `https://suiexplorer.com/txblock/${txDigest}?network=testnet`
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <LoadingSpinner className="w-12 h-12 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Loading Events</h3>
        <p className="text-slate-400">Fetching pool management events from the blockchain...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <ExternalLinkIcon className="w-8 h-8 text-red-400" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Error Loading Events</h3>
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
          <h2 className="text-2xl font-bold text-white mb-2">Pool Monitoring</h2>
          <p className="text-slate-400">Track all pool management events and activities</p>
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
                onChange={(e) => setFilters({...filters, eventType: e.target.value})}
                className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-white"
              >
                <option value="all">All Events</option>
                <option value="PoolCreated">Pool Created</option>
                <option value="PoolConfigUpdated">Pool Updated</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Pool Type</label>
              <select
                value={filters.poolType}
                onChange={(e) => setFilters({...filters, poolType: e.target.value})}
                className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-white"
              >
                <option value="all">All Types</option>
                <option value="LP">LP Pools</option>
                <option value="Single">Single Pools</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Time Range</label>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
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
                onChange={(e) => setFilters({...filters, searchTerm: e.target.value})}
                className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400"
              />
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-4">
          <div className="text-slate-400 text-sm">Total Events</div>
          <div className="text-2xl font-bold text-white mt-1">{events.length}</div>
          <div className="text-blue-400 text-sm mt-1">All time</div>
        </div>
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-4">
          <div className="text-slate-400 text-sm">Pools Created</div>
          <div className="text-2xl font-bold text-white mt-1">
            {events.filter(e => e.type === 'PoolCreated').length}
          </div>
          <div className="text-green-400 text-sm mt-1">Creation events</div>
        </div>
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-4">
          <div className="text-slate-400 text-sm">Pool Updates</div>
          <div className="text-2xl font-bold text-white mt-1">
            {events.filter(e => e.type === 'PoolConfigUpdated').length}
          </div>
          <div className="text-blue-400 text-sm mt-1">Configuration changes</div>
        </div>
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-4">
          <div className="text-slate-400 text-sm">Last 24h</div>
          <div className="text-2xl font-bold text-white mt-1">
            {events.filter(e => {
              const eventTime = parseInt(e.timestamp)
              const dayAgo = Date.now() - (24 * 60 * 60 * 1000)
              return eventTime > dayAgo
            }).length}
          </div>
          <div className="text-purple-400 text-sm mt-1">Recent activity</div>
        </div>
      </div>

      {/* Events Timeline */}
      <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700/30">
          <h3 className="text-lg font-semibold text-white">Events Timeline</h3>
          <p className="text-slate-400 text-sm">
            Showing {filteredEvents.length} of {events.length} events
          </p>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {filteredEvents.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-slate-400">No events match your current filters</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/30">
              {filteredEvents.map((event) => {
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
                            <span className="text-slate-400">•</span>
                            <span className="text-slate-300">{event.poolName}</span>
                          </div>
                          <div className="text-sm text-slate-400 mt-1">
                            {event.type === 'PoolCreated' && (
                              <>
                                Allocation: {event.data.allocationPoints} • 
                                Deposit Fee: {event.data.depositFee}BP • 
                                Withdrawal Fee: {event.data.withdrawalFee}BP
                              </>
                            )}
                            {event.type === 'PoolConfigUpdated' && (
                              <>
                                Allocation: {event.data.oldAllocationPoints} → {event.data.newAllocationPoints} • 
                                Status: {event.data.oldActive ? 'Active' : 'Inactive'} → {event.data.newActive ? 'Active' : 'Inactive'}
                              </>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                            <span className="flex items-center space-x-1">
                              <ClockIcon className="w-3 h-3" />
                              <span>{timeData.relative}</span>
                            </span>
                            <span>{timeData.date} {timeData.time}</span>
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
                <h3 className="text-lg font-semibold text-white">Event Details</h3>
                <button 
                  onClick={() => setShowEventDetails(false)} 
                  className="text-slate-400 hover:text-white"
                >
                  <ExternalLinkIcon className="w-5 h-5" />
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
                  <label className="text-sm text-slate-400">Pool Name</label>
                  <div className="text-white font-medium">{selectedEvent.poolName}</div>
                </div>
                <div>
                  <label className="text-sm text-slate-400">Timestamp</label>
                  <div className="text-white">{formatTimestamp(selectedEvent.timestamp).date} {formatTimestamp(selectedEvent.timestamp).time}</div>
                </div>
                <div>
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