// components/tokenlocker/EpochHistory.tsx
import React, { useState, useMemo } from 'react'
import { Calendar, BarChart3, Hash, ExternalLink, ChevronDown, ChevronUp, Filter, Search, Clock, CheckCircle } from 'lucide-react'
import { TokenLockerService } from '../../services/tokenLockerService'
import LoadingSkeleton from './LoadingSkeleton'

interface EpochHistoryProps {
  dashboardData: any
  loadingStates: {
    dashboard: boolean
    events: boolean
  }
  onRefresh: () => void
}

export default function EpochHistory({ 
  dashboardData, 
  loadingStates, 
  onRefresh 
}: EpochHistoryProps) {
  const [expandedEpoch, setExpandedEpoch] = useState<number | null>(null)
  const [filterStatus, setFilterStatus] = useState<'all' | 'claimable' | 'finalized'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Enhanced epoch data from events
  const epochData = useMemo(() => {
    if (!dashboardData?.events) return []
    
    // Extract WeeklyRevenueAdded events
    const revenueEvents = dashboardData.events.filter((event: any) => 
      event.type === 'WeeklyRevenueAdded'
    ).map((event: any) => ({
      epochId: parseInt(event.data.epoch_id || '0'),
      totalRevenue: TokenLockerService.formatSUIAmount(event.data.total_week_revenue || '0'),
      weekPoolSui: TokenLockerService.formatSUIAmount(event.data.week_pool_sui || '0'),
      threeMonthPoolSui: TokenLockerService.formatSUIAmount(event.data.three_month_pool_sui || '0'),
      yearPoolSui: TokenLockerService.formatSUIAmount(event.data.year_pool_sui || '0'),
      threeYearPoolSui: TokenLockerService.formatSUIAmount(event.data.three_year_pool_sui || '0'),
      timestamp: TokenLockerService.formatTimestamp(event.timestamp),
      txDigest: event.txDigest,
      allocationsUsed: event.data.dynamic_allocations_used || false,
      isClaimable: true, // Revenue events mean epoch is claimable
      rawTimestamp: parseInt(event.timestamp),
      rawTotalRevenue: parseFloat(event.data.total_week_revenue || '0'),
      admin: event.admin
    }))

    // Sort by epoch ID descending (latest first)
    return revenueEvents.sort((a, b) => b.epochId - a.epochId)
  }, [dashboardData?.events])

  // Filter epochs based on search and status
  const filteredEpochs = useMemo(() => {
    let filtered = epochData

    if (searchTerm) {
      filtered = filtered.filter(epoch => 
        epoch.epochId.toString().includes(searchTerm) ||
        epoch.txDigest.toLowerCase().includes(searchTerm.toLowerCase()) ||
        epoch.admin.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(epoch => {
        if (filterStatus === 'claimable') return epoch.isClaimable
        if (filterStatus === 'finalized') return epoch.isClaimable // All revenue events are finalized
        return true
      })
    }

    return filtered
  }, [epochData, searchTerm, filterStatus])

  const getEpochStatusBadge = (epoch: any) => {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
        <CheckCircle className="w-3 h-3 mr-1" />
        Claimable
      </span>
    )
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getCurrentEpochInfo = () => {
    if (!dashboardData?.timing?.current) return null
    return dashboardData.timing.current
  }

  const currentEpoch = getCurrentEpochInfo()

  return (
    <div className="space-y-6">
      {/* Current Epoch Status */}
      {currentEpoch && (
        <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-purple-400" />
            Current Epoch Status
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-800/30 rounded-lg p-4">
              <div className="text-slate-400 text-sm">Epoch ID</div>
              <div className="text-2xl font-bold text-white">#{currentEpoch.id}</div>
            </div>
            <div className="bg-slate-800/30 rounded-lg p-4">
              <div className="text-slate-400 text-sm">Progress</div>
              <div className="text-2xl font-bold text-white">{currentEpoch.progress?.toFixed(1) || '0'}%</div>
              <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, currentEpoch.progress || 0)}%` }}
                ></div>
              </div>
            </div>
            <div className="bg-slate-800/30 rounded-lg p-4">
              <div className="text-slate-400 text-sm">Time Remaining</div>
              <div className="text-2xl font-bold text-white">{currentEpoch.timeRemaining || 'N/A'}</div>
            </div>
            <div className="bg-slate-800/30 rounded-lg p-4">
              <div className="text-slate-400 text-sm">Status</div>
              <div className={`text-lg font-bold ${
                currentEpoch.status === 'Claimable' ? 'text-green-400' :
                currentEpoch.status === 'Finalized' ? 'text-blue-400' :
                'text-orange-400'
              }`}>
                {currentEpoch.status}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Epoch History Section */}
      <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-blue-400" />
            Epoch Revenue History
          </h3>
          <button
            onClick={onRefresh}
            disabled={loadingStates.dashboard}
            className="flex items-center space-x-2 bg-slate-700/50 hover:bg-slate-700/70 text-slate-300 hover:text-white px-3 py-2 rounded-lg transition-all duration-200 disabled:opacity-50"
          >
            <Clock className={`w-4 h-4 ${loadingStates.dashboard ? 'animate-spin' : ''}`} />
            <span className="text-sm">Refresh</span>
          </button>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by epoch ID, transaction hash, or admin address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg pl-10 pr-4 py-2 text-white placeholder-slate-400 focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
            >
              <option value="all">All Epochs</option>
              <option value="claimable">Claimable</option>
              <option value="finalized">Finalized</option>
            </select>
          </div>
        </div>

        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-700/30 rounded-lg p-4">
            <div className="text-slate-400 text-sm">Total Epochs</div>
            <div className="text-2xl font-bold text-white">{epochData.length}</div>
            <div className="text-green-400 text-sm">Revenue distributed</div>
          </div>
          <div className="bg-slate-700/30 rounded-lg p-4">
            <div className="text-slate-400 text-sm">Total SUI Revenue</div>
            <div className="text-2xl font-bold text-white">
              {epochData.reduce((sum, epoch) => sum + epoch.rawTotalRevenue, 0).toLocaleString()} SUI
            </div>
            <div className="text-blue-400 text-sm">All time</div>
          </div>
          <div className="bg-slate-700/30 rounded-lg p-4">
            <div className="text-slate-400 text-sm">Latest Epoch</div>
            <div className="text-2xl font-bold text-white">
              #{epochData[0]?.epochId || 'N/A'}
            </div>
            <div className="text-purple-400 text-sm">Most recent</div>
          </div>
        </div>

        {/* Epochs List */}
        {loadingStates.dashboard ? (
          <LoadingSkeleton type="table" />
        ) : filteredEpochs.length > 0 ? (
          <div className="space-y-4">
            {filteredEpochs.map((epoch) => (
              <div key={epoch.epochId} className="bg-slate-700/20 border border-slate-600/30 rounded-lg overflow-hidden">
                <div 
                  className="p-4 cursor-pointer hover:bg-slate-700/30 transition-colors"
                  onClick={() => setExpandedEpoch(expandedEpoch === epoch.epochId ? null : epoch.epochId)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-purple-500/20 rounded-lg p-3">
                        <Calendar className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-3">
                          <h4 className="text-white font-semibold">Epoch #{epoch.epochId}</h4>
                          {getEpochStatusBadge(epoch)}
                        </div>
                        <div className="text-slate-400 text-sm mt-1">
                          Revenue Added: {epoch.timestamp} by {TokenLockerService.formatAddress(epoch.admin)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-white font-semibold">{epoch.totalRevenue}</div>
                        <div className="text-slate-400 text-sm">Total SUI</div>
                      </div>
                      {expandedEpoch === epoch.epochId ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedEpoch === epoch.epochId && (
                  <div className="border-t border-slate-600/30 p-4 bg-slate-800/20">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Pool Distribution */}
                      <div>
                        <h5 className="text-white font-medium mb-3 flex items-center">
                          <BarChart3 className="w-4 h-4 mr-2 text-blue-400" />
                          Pool Distribution
                        </h5>
                        <div className="space-y-3">
                          {[
                            { period: '1 Week', amount: epoch.weekPoolSui, color: 'bg-blue-500' },
                            { period: '3 Months', amount: epoch.threeMonthPoolSui, color: 'bg-green-500' },
                            { period: '1 Year', amount: epoch.yearPoolSui, color: 'bg-yellow-500' },
                            { period: '3 Years', amount: epoch.threeYearPoolSui, color: 'bg-purple-500' }
                          ].map(({ period, amount, color }) => (
                            <div key={period} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <div className={`w-3 h-3 rounded-full ${color}`}></div>
                                <span className="text-white font-medium">{period}</span>
                              </div>
                              <span className="text-white font-semibold">{amount}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Transaction Details */}
                      <div>
                        <h5 className="text-white font-medium mb-3 flex items-center">
                          <Hash className="w-4 h-4 mr-2 text-green-400" />
                          Transaction Details
                        </h5>
                        <div className="space-y-3">
                          <div className="p-3 bg-slate-700/30 rounded-lg">
                            <div className="text-slate-400 text-sm mb-1">Transaction Hash</div>
                            <div className="flex items-center space-x-2">
                              <span className="text-white font-mono text-sm">
                                {epoch.txDigest.slice(0, 8)}...{epoch.txDigest.slice(-6)}
                              </span>
                              <button
                                onClick={() => copyToClipboard(epoch.txDigest)}
                                className="text-blue-400 hover:text-blue-300 p-1"
                                title="Copy full hash"
                              >
                                <Hash className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => window.open(`https://suiscan.xyz/mainnet/tx/${epoch.txDigest}`, '_blank')}
                                className="text-green-400 hover:text-green-300 p-1"
                                title="View on Suiscan"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          
                          <div className="p-3 bg-slate-700/30 rounded-lg">
                            <div className="text-slate-400 text-sm mb-1">Added By</div>
                            <div className="text-white font-medium">
                              {TokenLockerService.formatAddress(epoch.admin)}
                            </div>
                          </div>

                          <div className="p-3 bg-slate-700/30 rounded-lg">
                            <div className="text-slate-400 text-sm mb-1">Added On</div>
                            <div className="text-white font-medium">
                              {formatDate(epoch.rawTimestamp)}
                            </div>
                          </div>

                          <div className="p-3 bg-slate-700/30 rounded-lg">
                            <div className="text-slate-400 text-sm mb-1">Allocations</div>
                            <div className="flex items-center space-x-2">
                              <span className={`text-sm font-medium ${epoch.allocationsUsed ? 'text-green-400' : 'text-yellow-400'}`}>
                                {epoch.allocationsUsed ? 'Dynamic' : 'Default'}
                              </span>
                              {epoch.allocationsUsed && (
                                <span className="text-xs text-green-300 bg-green-500/20 px-2 py-1 rounded">
                                  Custom Allocations Applied
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-600/30">
                      <div className="flex items-center space-x-2 text-sm text-slate-400">
                        <Clock className="w-4 h-4" />
                        <span>Revenue distributed {epoch.timestamp}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => copyToClipboard(JSON.stringify({
                            epochId: epoch.epochId,
                            totalRevenue: epoch.totalRevenue,
                            txDigest: epoch.txDigest,
                            timestamp: epoch.timestamp,
                            admin: epoch.admin,
                            poolDistribution: {
                              week: epoch.weekPoolSui,
                              threeMonth: epoch.threeMonthPoolSui,
                              year: epoch.yearPoolSui,
                              threeYear: epoch.threeYearPoolSui
                            }
                          }, null, 2))}
                          className="flex items-center space-x-2 bg-slate-600/50 hover:bg-slate-600/70 text-slate-300 px-3 py-1.5 rounded text-sm transition-colors"
                        >
                          <Hash className="w-3 h-3" />
                          <span>Copy Data</span>
                        </button>
                        <button
                          onClick={() => window.open(`https://suiscan.xyz/mainnet/tx/${epoch.txDigest}`, '_blank')}
                          className="flex items-center space-x-2 bg-green-600/50 hover:bg-green-600/70 text-green-300 px-3 py-1.5 rounded text-sm transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>View Transaction</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-slate-400 py-12">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">No epochs found</p>
            <p className="text-sm">
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'No revenue has been added to any epochs yet'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  )
}