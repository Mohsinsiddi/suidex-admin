// components/VaultMonitoringTab.tsx
import React, { useState, useEffect } from 'react'
import { VaultEventService, type VaultEvent, type VaultEventResponse, type VaultEventFilters } from '../services/vaultEventService'
import { 
  LoadingSpinner, 
  RefreshIcon,
  FilterIcon,
  ExternalLinkIcon,
  EyeIcon,
  ClockIcon,
  ActivityIcon
} from './icons'

// Vault-specific icons
export const VaultCreateIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
)

export const VaultDepositIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
  </svg>
)

export const VaultWithdrawIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
  </svg>
)

export const VaultIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
)

export const FarmIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
  </svg>
)

export const LockerIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
)

export default function VaultMonitoringTab() {
  const [eventResponse, setEventResponse] = useState<VaultEventResponse>({ events: [], hasNextPage: false, totalCount: 0 })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<VaultEventFilters>({
    eventType: 'all',
    adminAddress: '',
    vaultType: '',
    module: '',
    dateRange: '1d',
    searchTerm: '',
    limit: 100
  })
  const [showFilters, setShowFilters] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<VaultEvent | null>(null)
  const [showEventDetails, setShowEventDetails] = useState(false)

  useEffect(() => {
    fetchAllEvents()
  }, [])

  const fetchAllEvents = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🚀 VaultMonitoringTab: Starting fetch with filters:', filters)
      
      const response = await VaultEventService.fetchAllVaultEvents(filters)
      setEventResponse(response)
      
      console.log(`✅ VaultMonitoringTab: Loaded ${response.events.length} vault events`)
      
    } catch (error) {
      console.error('❌ VaultMonitoringTab: Error fetching events:', error)
      setError(`Failed to load Vault events: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const refreshEvents = async () => {
    setRefreshing(true)
    await fetchAllEvents()
    setRefreshing(false)
  }

  const updateFilters = (newFilters: Partial<VaultEventFilters>) => {
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
      case 'RewardVaultCreated':
      case 'LockedTokenVaultCreated':
      case 'VictoryRewardVaultCreated':
      case 'SUIRewardVaultCreated':
        return <VaultCreateIcon className="w-4 h-4" />
      case 'VaultDeposit':
      case 'VictoryTokensDeposited':
        return <VaultDepositIcon className="w-4 h-4" />
      case 'AdminVaultSweep':
        return <VaultWithdrawIcon className="w-4 h-4" />
      default:
        return <VaultIcon className="w-4 h-4" />
    }
  }

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'RewardVaultCreated':
      case 'LockedTokenVaultCreated':
      case 'VictoryRewardVaultCreated':
      case 'SUIRewardVaultCreated':
        return 'text-green-400 bg-green-500/20'
      case 'VaultDeposit':
      case 'VictoryTokensDeposited':
        return 'text-blue-400 bg-blue-500/20'
      case 'AdminVaultSweep':
        return 'text-orange-400 bg-orange-500/20'
      default:
        return 'text-slate-400 bg-slate-500/20'
    }
  }

  const getModuleColor = (module: string) => {
    switch (module) {
      case 'farm':
        return 'text-emerald-400 bg-emerald-500/20'
      case 'token_locker':
        return 'text-indigo-400 bg-indigo-500/20'
      default:
        return 'text-slate-400 bg-slate-500/20'
    }
  }

  const getModuleIcon = (module: string) => {
    switch (module) {
      case 'farm':
        return <FarmIcon className="w-3 h-3" />
      case 'token_locker':
        return <LockerIcon className="w-3 h-3" />
      default:
        return <ActivityIcon className="w-3 h-3" />
    }
  }

  const openEventDetails = (event: VaultEvent) => {
    setSelectedEvent(event)
    setShowEventDetails(true)
  }

  const getSuiExplorerUrl = (txDigest: string) => {
    return `https://suiexplorer.com/txblock/${txDigest}?network=testnet`
  }

  const eventStats = VaultEventService.getEventStats(eventResponse.events)

  if (loading) {
    return (
      <div className="text-center py-12">
        <LoadingSpinner className="w-12 h-12 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Loading Vault Events</h3>
        <p className="text-slate-400">Fetching vault creation, deposit, and management events from the blockchain...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <ExternalLinkIcon className="w-8 h-8 text-red-400" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Error Loading Vault Events</h3>
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
          <h3 className="text-xl font-bold text-white mb-2">Vault Activity Monitor</h3>
          <p className="text-slate-400">Track vault creation, deposits, withdrawals, and management across Farm and Token Locker modules</p>
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

      {/* Enhanced Debug Section */}
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
                <option value="RewardVaultCreated">Vault Created</option>
                <option value="VaultDeposit">Vault Deposit</option>
                <option value="AdminVaultSweep">Admin Sweep</option>
                <option value="VaultCreation">All Creations</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Module</label>
              <select
                value={filters.module || ''}
                onChange={(e) => updateFilters({ module: e.target.value })}
                className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-white"
              >
                <option value="">All Modules</option>
                <option value="farm">Farm</option>
                <option value="token_locker">Token Locker</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Vault Type</label>
              <input
                type="text"
                placeholder="Victory Rewards, SUI..."
                value={filters.vaultType || ''}
                onChange={(e) => updateFilters({ vaultType: e.target.value })}
                className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Admin Address</label>
              <input
                type="text"
                placeholder="0x9b15ba... (Default)"
                value={filters.adminAddress || ''}
                onChange={(e) => updateFilters({ adminAddress: e.target.value })}
                className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400"
              />
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
          
          {/* 🆕 Debug Tools */}
          <div className="mt-4 pt-4 border-t border-slate-600/30">
            <div className="flex items-center space-x-4">
              <button
                onClick={async () => {
                  console.log('🔍 Fetching vault objects...')
                  const vaults = await VaultEventService.fetchVaultObjectsWithState(
                    filters.adminAddress || '0x980a970a8bb90b5a9c63e550c4ef06161b0376c297fb3e35a9b710004cc1aac9'
                  )
                  console.log('📊 Vault objects:', vaults)
                  alert(`Found ${vaults.length} vault objects - check console for details`)
                }}
                className="px-3 py-1 bg-blue-600/20 border border-blue-500/30 text-blue-300 rounded text-sm hover:bg-blue-600/30"
              >
                Fetch Vault Objects
              </button>
              <button
                onClick={() => {
                  updateFilters({ 
                    adminAddress: '0x980a970a8bb90b5a9c63e550c4ef06161b0376c297fb3e35a9b710004cc1aac9',
                    eventType: 'RewardVaultCreated'
                  })
                }}
                className="px-3 py-1 bg-green-600/20 border border-green-500/30 text-green-300 rounded text-sm hover:bg-green-600/30"
              >
                Filter Your Admin
              </button>
              <div className="text-xs text-slate-400">
                Debug: {eventStats.total} events loaded | Duplicates filtered
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-4">
          <div className="text-slate-400 text-sm">Total Events</div>
          <div className="text-2xl font-bold text-white mt-1">{eventStats.total}</div>
          <div className="text-blue-400 text-sm mt-1">All vault activity</div>
        </div>
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-4">
          <div className="text-slate-400 text-sm">Vault Created</div>
          <div className="text-2xl font-bold text-white mt-1">{eventStats.RewardVaultCreated + eventStats.VictoryRewardVaultCreated + eventStats.SUIRewardVaultCreated + eventStats.LockedTokenVaultCreated}</div>
          <div className="text-green-400 text-sm mt-1">New vaults</div>
        </div>
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-4">
          <div className="text-slate-400 text-sm">Deposits</div>
          <div className="text-2xl font-bold text-white mt-1">{eventStats.VaultDeposit}</div>
          <div className="text-blue-400 text-sm mt-1">Deposit events</div>
        </div>
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-4">
          <div className="text-slate-400 text-sm">Admin Sweeps</div>
          <div className="text-2xl font-bold text-white mt-1">{eventStats.AdminVaultSweep}</div>
          <div className="text-orange-400 text-sm mt-1">Withdrawals</div>
        </div>
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-4">
          <div className="text-slate-400 text-sm">Farm Events</div>
          <div className="text-2xl font-bold text-white mt-1">{eventStats.farmEvents}</div>
          <div className="text-emerald-400 text-sm mt-1">Farm module</div>
        </div>
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-4">
          <div className="text-slate-400 text-sm">Locker Events</div>
          <div className="text-2xl font-bold text-white mt-1">{eventStats.lockerEvents}</div>
          <div className="text-indigo-400 text-sm mt-1">Token locker</div>
        </div>
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-4">
          <div className="text-slate-400 text-sm">Vault Types</div>
          <div className="text-2xl font-bold text-white mt-1">{eventStats.uniqueVaultTypes}</div>
          <div className="text-purple-400 text-sm mt-1">Unique types</div>
        </div>
      </div>

      {/* Events Timeline */}
      <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700/30">
          <h4 className="text-lg font-semibold text-white">Vault Events Timeline</h4>
          <p className="text-slate-400 text-sm">
            Showing {displayEvents.length} events
            {filters.eventType !== 'all' && ` (${filters.eventType})`}
            {filters.module && ` (${VaultEventService.getModuleDisplayName(filters.module)})`}
            {filters.vaultType && ` (${filters.vaultType})`}
            {filters.dateRange !== 'all' && ` (${filters.dateRange})`}
            {filters.searchTerm && ` matching "${filters.searchTerm}"`}
            {filters.adminAddress && ` for admin ${filters.adminAddress.slice(0, 8)}...`}
          </p>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {displayEvents.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-slate-400">No vault events found matching your filters</p>
              <button 
                onClick={() => updateFilters({ eventType: 'all', dateRange: 'all', searchTerm: '', adminAddress: '', vaultType: '', module: '' })}
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
                            <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${getModuleColor(event.module)}`}>
                              {getModuleIcon(event.module)}
                              <span>{VaultEventService.getModuleDisplayName(event.module)}</span>
                            </div>
                            {(event.vaultType || event.data.vaultType) && (
                              <>
                                <span className="text-slate-400">•</span>
                                <span className="text-slate-300">{VaultEventService.getVaultTypeDisplayName(event.vaultType || event.data.vaultType)}</span>
                              </>
                            )}
                          </div>
                          <div className="text-sm text-slate-400 mt-1">
                            {event.type === 'RewardVaultCreated' && (
                              <>
                                Vault ID: {event.data.vaultId?.slice(0, 8)}... • 
                                Admin: {event.admin?.slice(0, 8)}...
                              </>
                            )}
                            {event.type === 'VaultDeposit' && (
                              <>
                                Amount: {VaultEventService.formatVictoryAmount(event.amount || '0')} Victory • 
                                {event.data.totalBalance && `Total Balance: ${VaultEventService.formatVictoryAmount(event.data.totalBalance)} Victory`}
                                {event.data.vaultType && ` • Type: ${event.data.vaultType}`}
                              </>
                            )}
                            {event.type === 'AdminVaultSweep' && (
                              <>
                                Amount: {VaultEventService.formatVictoryAmount(event.amount || '0')} Victory • 
                                Recipient: {event.recipient?.slice(0, 8)}... • 
                                Remaining: {VaultEventService.formatVictoryAmount(event.data.remainingVaultBalance || '0')} Victory
                              </>
                            )}
                            {(event.type === 'VictoryRewardVaultCreated' || event.type === 'SUIRewardVaultCreated' || event.type === 'LockedTokenVaultCreated') && (
                              <>
                                Inferred from first deposit • 
                                Amount: {VaultEventService.formatVictoryAmount(event.data.firstDepositAmount || '0')} Victory
                              </>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                            <span className="flex items-center space-x-1">
                              <ClockIcon className="w-3 h-3" />
                              <span>{timeData.relative}</span>
                            </span>
                            <span>{timeData.date} {timeData.time}</span>
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
                <h3 className="text-lg font-semibold text-white">Vault Event Details</h3>
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
                  <label className="text-sm text-slate-400">Module</label>
                  <div className="text-white font-medium">{VaultEventService.getModuleDisplayName(selectedEvent.module)}</div>
                </div>
                <div>
                  <label className="text-sm text-slate-400">Timestamp</label>
                  <div className="text-white">{formatTimestamp(selectedEvent.timestamp).date} {formatTimestamp(selectedEvent.timestamp).time}</div>
                </div>
                <div>
                  <label className="text-sm text-slate-400">Admin/Sender</label>
                  <div className="text-white font-mono text-sm">{selectedEvent.admin || selectedEvent.sender}</div>
                </div>
                {selectedEvent.vaultType && (
                  <div>
                    <label className="text-sm text-slate-400">Vault Type</label>
                    <div className="text-white font-medium">{VaultEventService.getVaultTypeDisplayName(selectedEvent.vaultType)}</div>
                  </div>
                )}
                {selectedEvent.amount && (
                  <div>
                    <label className="text-sm text-slate-400">Amount</label>
                    <div className="text-white font-medium">{VaultEventService.formatVictoryAmount(selectedEvent.amount)} Victory</div>
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