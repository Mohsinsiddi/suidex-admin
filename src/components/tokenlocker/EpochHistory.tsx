// components/tokenlocker/EpochHistory.tsx - COMPLETE VERSION WITH FUND FEATURE
import React, { useState, useMemo } from 'react'
import { 
  Calendar, BarChart3, Hash, ExternalLink, ChevronDown, ChevronUp, 
  Filter, Search, Clock, CheckCircle, ChevronLeft, ChevronRight, 
  AlertTriangle, Play, Pause, DollarSign, TrendingUp, Layers
} from 'lucide-react'
import { TokenLockerService, type EpochInfo } from '../../services/tokenLockerService'
import LoadingSkeleton from './LoadingSkeleton'
import { useWallet } from '@suiet/wallet-kit'
import { ZapIcon } from '../icons'

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
  const { account, signAndExecuteTransaction } = useWallet()
  const [expandedEpoch, setExpandedEpoch] = useState<number | null>(null)
  const [filterStatus, setFilterStatus] = useState<'all' | 'created' | 'claimable' | 'pending' | 'multi-funded'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentSlide, setCurrentSlide] = useState(0)
  const [itemsPerPage] = useState(6)
  
  // 🆕 NEW: Fund modal states
  const [fundingEpochId, setFundingEpochId] = useState<number | null>(null)
  const [fundAmount, setFundAmount] = useState('')
  const [isFunding, setIsFunding] = useState(false)

  // Get epochs from dashboard data
  const allEpochs = useMemo<EpochInfo[]>(() => {
    if (!dashboardData?.epochs) return []
    return dashboardData.epochs
  }, [dashboardData?.epochs])

  // Calculate statistics
  const epochStats = useMemo(() => {
    const totalRevenue = allEpochs.reduce((sum, epoch) => {
      const amount = parseFloat(epoch.totalRevenue.replace(/[^\d.-]/g, '')) || 0
      return sum + amount
    }, 0)
    
    const multiFunded = allEpochs.filter(e => e.fundingCount && e.fundingCount > 1)
    const totalFundingEvents = allEpochs.reduce((sum, e) => sum + (e.fundingCount || 0), 0)
    
    return {
      totalRevenue,
      multiFunded: multiFunded.length,
      totalFundingEvents,
      averagePerEpoch: allEpochs.length > 0 ? totalRevenue / allEpochs.length : 0
    }
  }, [allEpochs])

  // Filter epochs
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
        if (filterStatus === 'multi-funded') return epoch.fundingCount && epoch.fundingCount > 1
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

  const handleCreateNextEpoch = async () => {
    if (!account) {
      alert('Please connect wallet')
      return
    }

    try {
      const currentId = dashboardData?.timing?.current?.id || 0
      const nextId = currentId + 1
      
      if (!confirm(`Create Epoch #${nextId}? (Next in sequence)`)) return

      const tx = TokenLockerService.buildCreateNextEpochTransaction()
      
      const result = await signAndExecuteTransaction({
        transaction: tx,
        options: {
          showEffects: true,
          showEvents: true
        }
      })

      if (result?.digest) {
        alert(`Epoch #${nextId} created successfully!`)
        onRefresh()
      } else {
        throw new Error('Transaction failed')
      }
    } catch (error) {
      console.error('Failed to create epoch:', error)
      alert('Failed to create epoch: ' + (error as Error).message)
    }
  }

  // 🆕 NEW: Handle fund epoch
  const handleFundEpoch = async (epochId: number) => {
    if (!account) {
      alert('Please connect wallet')
      return
    }

    const amount = parseFloat(fundAmount)
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount')
      return
    }

    try {
      setIsFunding(true)
      
      const amountInMist = Math.floor(amount * 1_000_000_000)
      
      const epoch = allEpochs.find(e => e.epochId === epochId)
      const confirmMessage = 
        `Fund Epoch #${epochId} with ${amount} SUI?\n\n` +
        `This will ${epoch?.fundingCount ? 'ADD to existing' : 'set initial'} revenue.\n` +
        `Current revenue: ${epoch?.totalRevenue || '0 SUI'}`
      
      if (!confirm(confirmMessage)) {
        setIsFunding(false)
        return
      }

      console.log('Building fund transaction for epoch', epochId)
      
      const tx = TokenLockerService.buildFundSpecificEpochTransaction(
        epochId,
        amountInMist.toString()
      )
      
      console.log('Executing transaction...')
      const result = await signAndExecuteTransaction({
        transaction: tx,
        options: {
          showEffects: true,
          showEvents: true
        }
      })

      if (result?.digest) {
        console.log('Transaction successful:', result.digest)
        alert(
          `✅ Epoch #${epochId} funded successfully!\n\n` +
          `Amount: ${amount} SUI\n` +
          `TX: ${result.digest.slice(0, 8)}...${result.digest.slice(-6)}`
        )
        setFundingEpochId(null)
        setFundAmount('')
        onRefresh()
      } else {
        throw new Error('Transaction failed - no digest returned')
      }
    } catch (error: any) {
      console.error('Failed to fund epoch:', error)
      
      let errorMessage = 'Failed to fund epoch'
      
      if (error.message?.includes('No SUI coins found')) {
        errorMessage = 
          '❌ No SUI coins found!\n\n' +
          'Please mint SUI first using the mint button in the dashboard.'
      } else if (error.message?.includes('Insufficient SUI balance')) {
        errorMessage = 
          '❌ Insufficient SUI balance!\n\n' +
          error.message
      } else {
        errorMessage = `❌ ${error.message || 'Unknown error occurred'}`
      }
      
      alert(errorMessage)
    } finally {
      setIsFunding(false)
    }
  }

  const getCurrentEpochInfo = () => dashboardData?.timing?.current || null
  const getProtocolInfo = () => dashboardData?.timing?.protocol || null

  const currentEpoch = getCurrentEpochInfo()
  const protocolInfo = getProtocolInfo()

  // 🆕 NEW: Fund Modal Component
  const FundModal = ({ epochId }: { epochId: number }) => {
    const epoch = allEpochs.find(e => e.epochId === epochId)
    if (!epoch) return null

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-green-400" />
              Fund Epoch #{epochId}
            </h3>
            <button
              onClick={() => {
                setFundingEpochId(null)
                setFundAmount('')
              }}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-4">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-300">
                <span className="font-semibold">Testing Mode:</span> Using SUI tokens.
                Make sure you have SUI minted first.
              </div>
            </div>
          </div>

          <div className="bg-slate-700/30 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-slate-400">Status</div>
                <div className="text-white font-medium">{epoch.status}</div>
              </div>
              <div>
                <div className="text-slate-400">Week</div>
                <div className="text-white font-medium">#{epoch.weekNumber}</div>
              </div>
              <div>
                <div className="text-slate-400">Current Revenue</div>
                <div className="text-green-400 font-semibold">{epoch.totalRevenue}</div>
              </div>
              <div>
                <div className="text-slate-400">Times Funded</div>
                <div className="text-blue-400 font-semibold">
                  {epoch.fundingCount || 0}x
                </div>
              </div>
            </div>
          </div>

          {epoch.fundingCount && epoch.fundingCount > 0 && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-4">
              <div className="flex items-start space-x-2">
                <Layers className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-300">
                  This epoch was already funded <span className="font-semibold">{epoch.fundingCount} time{epoch.fundingCount > 1 ? 's' : ''}</span>.
                  Your amount will be <span className="font-semibold">added cumulatively</span> to existing revenue.
                </div>
              </div>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Amount (SUI)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={fundAmount}
              onChange={(e) => setFundAmount(e.target.value)}
              placeholder="Enter SUI amount (e.g., 100)"
              className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:border-green-500 focus:outline-none"
              disabled={isFunding}
            />
            <div className="flex justify-between mt-2">
              <span className="text-xs text-slate-400">Minimum: 0.1 SUI</span>
              {fundAmount && (
                <span className="text-xs text-green-400">
                  = {(parseFloat(fundAmount) * 1_000_000_000).toLocaleString()} MIST
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-6">
            {[10, 50, 100, 500].map((amount) => (
              <button
                key={amount}
                onClick={() => setFundAmount(amount.toString())}
                className="bg-slate-700/50 hover:bg-slate-700 text-white px-3 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
                disabled={isFunding}
              >
                {amount}
              </button>
            ))}
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => {
                setFundingEpochId(null)
                setFundAmount('')
              }}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-3 rounded-lg transition-colors disabled:opacity-50"
              disabled={isFunding}
            >
              Cancel
            </button>
            <button
              onClick={() => handleFundEpoch(epochId)}
              disabled={isFunding || !fundAmount || parseFloat(fundAmount) <= 0}
              className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-slate-700 disabled:text-slate-500 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              {isFunding ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Funding...</span>
                </>
              ) : (
                <>
                  <DollarSign className="w-4 h-4" />
                  <span>Fund with SUI</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

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

      {/* Quick Actions Bar */}
      {protocolInfo?.initialized && (() => {
        const currentId = dashboardData?.timing?.current?.id || 0
        const nextEpochExists = allEpochs.some(e => e.epochId === currentId + 1)
        
        return !nextEpochExists && (
          <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-semibold flex items-center">
                  <ZapIcon className="w-4 h-4 mr-2 text-yellow-400" />
                  Next Epoch Needs Creation
                </h3>
                <p className="text-slate-400 text-sm">Epoch #{currentId + 1} hasn't been created yet</p>
              </div>
              <button
                onClick={handleCreateNextEpoch}
                className="flex items-center space-x-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-4 py-2 rounded-lg transition-all"
              >
                <Play className="w-4 h-4" />
                <span>Create Epoch #{currentId + 1}</span>
              </button>
            </div>
          </div>
        )
      })()}

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
                />
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

      {/* Epoch Timeline Section */}
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
              <option value="multi-funded">Multi-Funded</option>
            </select>
          </div>
        </div>

        {/* Enhanced Statistics Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
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
            <div className="text-slate-400 text-sm">Multi-Funded</div>
            <div className="text-2xl font-bold text-purple-400">
              {epochStats.multiFunded}
            </div>
            <div className="text-purple-400 text-sm">2+ fundings</div>
          </div>
          <div className="bg-slate-700/30 rounded-lg p-4">
            <div className="text-slate-400 text-sm">Total Revenue</div>
            <div className="text-xl font-bold text-white">
              {epochStats.totalRevenue.toFixed(2)} SUI
            </div>
            <div className="text-yellow-400 text-sm">All time</div>
          </div>
          <div className="bg-slate-700/30 rounded-lg p-4">
            <div className="text-slate-400 text-sm">Avg/Epoch</div>
            <div className="text-xl font-bold text-cyan-400">
              {epochStats.averagePerEpoch.toFixed(2)} SUI
            </div>
            <div className="text-cyan-400 text-sm">Average funding</div>
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
                <div key={epoch.epochId} className="bg-slate-700/20 border border-slate-600/30 rounded-lg overflow-hidden hover:border-purple-500/30 transition-all">
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
                          <span>Current Progress</span>
                          <span>{epoch.progress}%</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2">
                          <div 
                            className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, epoch.progress)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      {/* Create Epoch button for pending epochs */}
                      {epoch.status === 'pending' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleCreateNextEpoch()
                          }}
                          className="w-full mt-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 px-3 py-2 rounded-lg transition-all flex items-center justify-center space-x-2 text-sm font-medium"
                        >
                          <Play className="w-4 h-4" />
                          <span>Create Epoch #{epoch.epochId}</span>
                        </button>
                      )}

                      {/* 🆕 NEW: Fund button for created/claimable epochs */}
                      {(epoch.status === 'created') && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setFundingEpochId(epoch.epochId)
                          }}
                          className="w-full mt-3 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-400 px-3 py-2 rounded-lg transition-all flex items-center justify-center space-x-2 text-sm font-medium"
                        >
                          <DollarSign className="w-4 h-4" />
                          <span>
                            {epoch.fundingCount && epoch.fundingCount > 0 
                              ? `Add SUI (${epoch.fundingCount}x funded)`
                              : 'Fund with SUI'
                            }
                          </span>
                        </button>
                      )}

                      <div className="flex justify-between">
                        <span className="text-slate-400 text-sm">Total Revenue:</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-white font-semibold text-sm">{epoch.totalRevenue}</span>
                          {epoch.fundingCount && epoch.fundingCount > 1 && (
                            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center space-x-1">
                              <Layers className="w-3 h-3" />
                              <span>{epoch.fundingCount}x</span>
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 text-sm">Status:</span>
                        <span className="text-white text-sm">
                          {epoch.status === 'claimable' ? (
                            <span className="text-green-400 flex items-center space-x-1">
                              <CheckCircle className="w-3 h-3" />
                              <span>Can add more</span>
                            </span>
                          ) : (
                            epoch.timestamp
                          )}
                        </span>
                      </div>
                      {epoch.fundingCount && epoch.fundingCount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-400 text-sm">Funding Events:</span>
                          <span className="text-blue-400 text-sm font-semibold">
                            {epoch.fundingCount} transaction{epoch.fundingCount > 1 ? 's' : ''}
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
                        {/* Funding Summary */}
                        {epoch.fundingCount && epoch.fundingCount > 0 && (
                          <div>
                            <h5 className="text-white font-medium mb-3 flex items-center">
                              <DollarSign className="w-4 h-4 mr-2 text-green-400" />
                              Funding Details
                            </h5>
                            <div className="bg-slate-700/30 rounded-lg p-3">
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Total Funded:</span>
                                <span className="text-green-400 font-semibold">{epoch.totalRevenue}</span>
                              </div>
                              <div className="flex justify-between text-sm mt-1">
                                <span className="text-slate-400">Funding Count:</span>
                                <span className="text-white">{epoch.fundingCount} times</span>
                              </div>
                              <div className="flex justify-between text-sm mt-1">
                                <span className="text-slate-400">Can Add More:</span>
                                <span className="text-green-400">Yes, always</span>
                              </div>
                            </div>
                          </div>
                        )}

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
                                  <div className={`w-2 h-2 rounded-full ${color}`} />
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
                            <div className="p-2 bg-slate-700/30 rounded text-sm">
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400">TX Hash:</span>
                                <div className="flex items-center space-x-2">
                                  <span className="text-white font-mono text-xs">
                                    {epoch.txDigest.slice(0, 8)}...{epoch.txDigest.slice(-6)}
                                  </span>
                                  <button
                                    onClick={() => window.open(`https://suiscan.xyz/mainnet/tx/${epoch.txDigest}`, '_blank')}
                                    className="text-green-400 hover:text-green-300"
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

            {/* Page Info */}
            {totalSlides > 1 && (
              <div className="text-center text-slate-400 text-sm">
                Page {currentSlide + 1} of {totalSlides} • Showing {currentEpochs.length} of {filteredEpochs.length} epochs
                {epochStats.multiFunded > 0 && (
                  <span className="ml-2 text-purple-400">
                    • {epochStats.multiFunded} multi-funded epochs
                  </span>
                )}
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

      {/* 🆕 NEW: Fund Modal */}
      {fundingEpochId && <FundModal epochId={fundingEpochId} />}
    </div>
  )
}