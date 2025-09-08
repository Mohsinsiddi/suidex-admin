// components/tokenlocker/EpochHistory.tsx - UPDATED FOR NEW EPOCH SYSTEM
import React, { useState, useMemo } from 'react'
import { Calendar, BarChart3, Hash, ExternalLink, ChevronDown, ChevronUp, Filter, Search, Clock, CheckCircle, ChevronLeft, ChevronRight, AlertTriangle, Play, Pause } from 'lucide-react'
import { TokenLockerService, type EpochInfo } from '../../services/tokenLockerService'
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
  const [filterStatus, setFilterStatus] = useState<'all' | 'created' | 'claimable' | 'pending'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentSlide, setCurrentSlide] = useState(0)
  const [itemsPerPage] = useState(6) // Show 6 epochs per carousel page

  // Get epochs from dashboard data (new enhanced format)
  const allEpochs = useMemo<EpochInfo[]>(() => {
    if (!dashboardData?.epochs) return []
    return dashboardData.epochs
  }, [dashboardData?.epochs])

  // Filter epochs based on search and status
  const filteredEpochs = useMemo(() => {
    let filtered = allEpochs

    if (searchTerm) {
      filtered = filtered.filter(epoch => 
        epoch.epochId.toString().includes(searchTerm) ||
        epoch.txDigest?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        epoch.admin?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(epoch => {
        if (filterStatus === 'claimable') return epoch.status === 'claimable'
        if (filterStatus === 'created') return epoch.status === 'created'
        if (filterStatus === 'pending') return epoch.status === 'pending'
        return true
      })
    }

    return filtered
  }, [allEpochs, searchTerm, filterStatus])

  // Carousel pagination
  const totalSlides = Math.ceil(filteredEpochs.length / itemsPerPage)
  const currentEpochs = filteredEpochs.slice(
    currentSlide * itemsPerPage,
    (currentSlide + 1) * itemsPerPage
  )

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides)
  }

  const goToSlide = (slide: number) => {
    setCurrentSlide(slide)
  }

  const getEpochStatusBadge = (epoch: EpochInfo) => {
    const statusConfig = {
      'claimable': { color: 'bg-green-500/20 text-green-400', icon: CheckCircle, label: 'Claimable' },
      'created': { color: 'bg-blue-500/20 text-blue-400', icon: Clock, label: 'Created' },
      'pending': { color: 'bg-orange-500/20 text-orange-400', icon: AlertTriangle, label: 'Needs Creation' },
      'revenue_added': { color: 'bg-purple-500/20 text-purple-400', icon: CheckCircle, label: 'Revenue Added' }
    }

    const config = statusConfig[epoch.status] || statusConfig['pending']
    const Icon = config.icon

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
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

  const getProtocolInfo = () => {
    if (!dashboardData?.timing?.protocol) return null
    return dashboardData.timing.protocol
  }

  const currentEpoch = getCurrentEpochInfo()
  const protocolInfo = getProtocolInfo()

  return (
    <div className="space-y-6">
      {/* Protocol Status Banner */}
      {protocolInfo && (
        <div className={`border rounded-xl p-4 ${
          protocolInfo.initialized 
            ? 'bg-green-500/10 border-green-500/20' 
            : 'bg-orange-500/10 border-orange-500/20'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {protocolInfo.initialized ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-orange-400" />
              )}
              <div>
                <h3 className="font-semibold text-white">
                  Protocol Status: {protocolInfo.initialized ? 'Initialized' : 'Not Initialized'}
                </h3>
                <p className="text-sm text-slate-400">
                  {protocolInfo.initialized 
                    ? `Total Epochs: ${protocolInfo.totalEpochs} • Duration: ${protocolInfo.epochDuration}`
                    : 'Protocol timing needs to be initialized to enable epoch management'
                  }
                </p>
              </div>
            </div>
            <button
              onClick={onRefresh}
              disabled={loadingStates.dashboard}
              className="flex items-center space-x-2 bg-slate-700/50 hover:bg-slate-700/70 text-slate-300 hover:text-white px-3 py-2 rounded-lg transition-all duration-200 disabled:opacity-50"
            >
              <Clock className={`w-4 h-4 ${loadingStates.dashboard ? 'animate-spin' : ''}`} />
              <span className="text-sm">Refresh</span>
            </button>
          </div>
        </div>
      )}

      {/* Current Epoch Status */}
      {currentEpoch && (
        <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-purple-400" />
            Current Epoch #{currentEpoch.id}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

      {/* Epoch Carousel Section */}
      <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-blue-400" />
            Epoch Timeline ({filteredEpochs.length} Total)
          </h3>
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
              <option value="created">Created</option>
              <option value="pending">Needs Creation</option>
            </select>
          </div>
        </div>

        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-700/30 rounded-lg p-4">
            <div className="text-slate-400 text-sm">Total Epochs</div>
            <div className="text-2xl font-bold text-white">{allEpochs.length}</div>
            <div className="text-blue-400 text-sm">In system</div>
          </div>
          <div className="bg-slate-700/30 rounded-lg p-4">
            <div className="text-slate-400 text-sm">Claimable</div>
            <div className="text-2xl font-bold text-green-400">
              {allEpochs.filter(e => e.status === 'claimable').length}
            </div>
            <div className="text-green-400 text-sm">Ready for users</div>
          </div>
          <div className="bg-slate-700/30 rounded-lg p-4">
            <div className="text-slate-400 text-sm">Pending Creation</div>
            <div className="text-2xl font-bold text-orange-400">
              {allEpochs.filter(e => e.status === 'pending').length}
            </div>
            <div className="text-orange-400 text-sm">Need admin action</div>
          </div>
          <div className="bg-slate-700/30 rounded-lg p-4">
            <div className="text-slate-400 text-sm">Total SUI Revenue</div>
            <div className="text-2xl font-bold text-white">
              {allEpochs.reduce((sum, epoch) => {
                const amount = parseFloat(epoch.totalRevenue.replace(/[^\d.-]/g, '')) || 0
                return sum + amount
              }, 0).toLocaleString()} SUI
            </div>
            <div className="text-purple-400 text-sm">All time</div>
          </div>
        </div>

        {/* Epoch Carousel */}
        {loadingStates.dashboard ? (
          <LoadingSkeleton type="table" />
        ) : filteredEpochs.length > 0 ? (
          <div className="space-y-4">
            {/* Carousel Navigation */}
            {totalSlides > 1 && (
              <div className="flex items-center justify-between">
                <button
                  onClick={prevSlide}
                  className="flex items-center space-x-2 bg-slate-700/50 hover:bg-slate-700/70 text-slate-300 hover:text-white px-3 py-2 rounded-lg transition-all duration-200"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>
                
                <div className="flex items-center space-x-2">
                  {Array.from({ length: totalSlides }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => goToSlide(i)}
                      className={`w-3 h-3 rounded-full transition-all duration-200 ${
                        i === currentSlide ? 'bg-purple-500' : 'bg-slate-600 hover:bg-slate-500'
                      }`}
                    />
                  ))}
                </div>
                
                <button
                  onClick={nextSlide}
                  className="flex items-center space-x-2 bg-slate-700/50 hover:bg-slate-700/70 text-slate-300 hover:text-white px-3 py-2 rounded-lg transition-all duration-200"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Carousel Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {currentEpochs.map((epoch) => (
                <div key={epoch.epochId} className="bg-slate-700/20 border border-slate-600/30 rounded-lg overflow-hidden">
                  <div 
                    className="p-4 cursor-pointer hover:bg-slate-700/30 transition-colors"
                    onClick={() => setExpandedEpoch(expandedEpoch === epoch.epochId ? null : epoch.epochId)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="bg-purple-500/20 rounded-lg p-2">
                          <Calendar className="w-4 h-4 text-purple-400" />
                        </div>
                        <div>
                          <h4 className="text-white font-semibold">Epoch #{epoch.epochId}</h4>
                          <div className="text-slate-400 text-xs">Week {epoch.weekNumber}</div>
                        </div>
                      </div>
                      {getEpochStatusBadge(epoch)}
                    </div>

                    {/* Current epoch progress bar */}
                    {epoch.isCurrentEpoch && epoch.progress !== undefined && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                          <span>Current Epoch Progress</span>
                          <span>{epoch.progress}%</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2">
                          <div 
                            className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, epoch.progress)}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400 text-sm">Total Revenue:</span>
                        <span className="text-white font-semibold text-sm">{epoch.totalRevenue}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 text-sm">Status:</span>
                        <span className="text-white text-sm">{epoch.timestamp}</span>
                      </div>
                      {epoch.admin && epoch.admin !== 'pending' && (
                        <div className="flex justify-between">
                          <span className="text-slate-400 text-sm">Admin:</span>
                          <span className="text-white text-sm font-mono">
                            {TokenLockerService.formatAddress(epoch.admin)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-center mt-3 pt-3 border-t border-slate-600/30">
                      {expandedEpoch === epoch.epochId ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedEpoch === epoch.epochId && (
                    <div className="border-t border-slate-600/30 p-4 bg-slate-800/20">
                      <div className="grid grid-cols-1 gap-4">
                        {/* Pool Distribution */}
                        <div>
                          <h5 className="text-white font-medium mb-3 flex items-center">
                            <BarChart3 className="w-4 h-4 mr-2 text-blue-400" />
                            Pool Distribution
                          </h5>
                          <div className="space-y-2">
                            {[
                              { period: '1 Week', amount: epoch.poolDistribution.weekPoolSui, color: 'bg-blue-500' },
                              { period: '3 Months', amount: epoch.poolDistribution.threeMonthPoolSui, color: 'bg-green-500' },
                              { period: '1 Year', amount: epoch.poolDistribution.yearPoolSui, color: 'bg-yellow-500' },
                              { period: '3 Years', amount: epoch.poolDistribution.threeYearPoolSui, color: 'bg-purple-500' }
                            ].map(({ period, amount, color }) => (
                              <div key={period} className="flex items-center justify-between p-2 bg-slate-700/30 rounded text-sm">
                                <div className="flex items-center space-x-2">
                                  <div className={`w-2 h-2 rounded-full ${color}`}></div>
                                  <span className="text-white">{period}</span>
                                </div>
                                <span className="text-white font-semibold">{amount}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Transaction Details */}
                        {epoch.txDigest && (
                          <div>
                            <h5 className="text-white font-medium mb-3 flex items-center">
                              <Hash className="w-4 h-4 mr-2 text-green-400" />
                              Transaction Details
                            </h5>
                            <div className="space-y-2">
                              <div className="p-2 bg-slate-700/30 rounded text-sm">
                                <div className="text-slate-400 text-xs mb-1">Transaction Hash</div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-white font-mono text-xs">
                                    {epoch.txDigest.slice(0, 8)}...{epoch.txDigest.slice(-6)}
                                  </span>
                                  <button
                                    onClick={() => copyToClipboard(epoch.txDigest || '')}
                                    className="text-blue-400 hover:text-blue-300 p-1"
                                    title="Copy full hash"
                                  >
                                    <Hash className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => window.open(`https://suiscan.xyz/mainnet/tx/${epoch.txDigest}`, '_blank')}
                                    className="text-green-400 hover:text-green-300 p-1"
                                    title="View on Suiscan"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Timing Information */}
                        <div>
                          <h5 className="text-white font-medium mb-3 flex items-center">
                            <Clock className="w-4 h-4 mr-2 text-orange-400" />
                            Timing Information
                          </h5>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-slate-400">Week Start:</span>
                              <span className="text-white">{formatDate(epoch.weekStart)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Week End:</span>
                              <span className="text-white">{formatDate(epoch.weekEnd)}</span>
                            </div>
                            {epoch.isCurrentEpoch && (
                              <div className="text-center mt-2 p-2 bg-purple-500/20 rounded text-purple-300 text-xs">
                                🕒 Current Active Epoch
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Carousel Page Info */}
            {totalSlides > 1 && (
              <div className="text-center text-slate-400 text-sm">
                Page {currentSlide + 1} of {totalSlides} • Showing {currentEpochs.length} of {filteredEpochs.length} epochs
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-slate-400 py-12">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">No epochs found</p>
            <p className="text-sm">
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : protocolInfo?.initialized 
                  ? 'No epochs have been created yet'
                  : 'Protocol needs to be initialized first'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  )
}