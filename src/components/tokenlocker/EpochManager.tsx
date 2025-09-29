// components/tokenlocker/EpochManager.tsx - COMPLETE ENHANCED VERSION
import React, { useState, useMemo } from 'react'
import { 
  Clock, DollarSign, BarChart3, Zap, AlertTriangle, CheckCircle, 
  Eye, RefreshCw, TrendingUp, Plus, Calendar, PlayCircle, 
  Activity, Settings, Info, ChevronRight, Hash
} from 'lucide-react'
import { TokenLockerService } from '../../services/tokenLockerService'
import LoadingSkeleton from './LoadingSkeleton'

interface EpochManagerProps {
  dashboardData: any
  loadingStates: {
    dashboard: boolean
    events: boolean
  }
  canPerformAction: boolean
  revenueAmount: string
  setRevenueAmount: React.Dispatch<React.SetStateAction<string>>
  onConfirmAction: (action: string) => void
  onRefresh: () => void
  actionLoading: boolean
}

export default function EpochManager({
  dashboardData,
  loadingStates,
  canPerformAction,
  revenueAmount,
  setRevenueAmount,
  onConfirmAction,
  onRefresh,
  actionLoading
}: EpochManagerProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'revenue' | 'management'>('overview')

  const getCurrentEpochInfo = () => {
    if (!dashboardData?.timing?.current) return null
    return dashboardData.timing.current
  }

  const getProtocolInfo = () => {
    if (!dashboardData?.timing?.protocol) return null
    return dashboardData.timing.protocol
  }

  // Calculate epoch management info
  const epochManagementInfo = useMemo(() => {
    if (!dashboardData?.epochs || !dashboardData?.timing?.protocol?.initialized) {
      return {
        totalEpochs: 0,
        createdEpochs: 0,
        pendingEpochs: 0,
        claimableEpochs: 0,
        fundedEpochs: 0,
        totalRevenue: 0,
        nextEpochId: 1,
        canCreateNext: false,
        currentEpochId: 0
      }
    }

    const epochs = dashboardData.epochs
    const totalEpochs = epochs.length
    const createdEpochs = epochs.filter((e: any) => e.status === 'created' || e.status === 'claimable').length
    const pendingEpochs = epochs.filter((e: any) => e.status === 'pending').length
    const claimableEpochs = epochs.filter((e: any) => e.status === 'claimable').length
    const fundedEpochs = epochs.filter((e: any) => parseFloat(e.totalRevenue.replace(/[^\d.-]/g, '')) > 0).length
    
    // Calculate total revenue across all epochs
    const totalRevenue = epochs.reduce((sum: number, e: any) => {
      const amount = parseFloat(e.totalRevenue.replace(/[^\d.-]/g, '')) || 0
      return sum + amount
    }, 0)
    
    const nextPendingEpoch = epochs.find((e: any) => e.status === 'pending')
    const nextEpochId = nextPendingEpoch ? nextPendingEpoch.epochId : createdEpochs + 1
    const currentEpochId = dashboardData?.timing?.current?.id || 0
    const canCreateNext = pendingEpochs > 0

    return {
      totalEpochs,
      createdEpochs,
      pendingEpochs,
      claimableEpochs,
      fundedEpochs,
      totalRevenue,
      nextEpochId,
      canCreateNext,
      currentEpochId
    }
  }, [dashboardData?.epochs, dashboardData?.timing])

  // Get current epoch funding info
  const currentEpochFunding = useMemo(() => {
    if (!dashboardData?.epochs || !epochManagementInfo.currentEpochId) {
      return { totalFunded: '0 SUI', fundingCount: 0, canAddMore: false }
    }
    
    const currentEpoch = dashboardData.epochs.find((e: any) => e.epochId === epochManagementInfo.currentEpochId)
    if (!currentEpoch) {
      return { totalFunded: '0 SUI', fundingCount: 0, canAddMore: false }
    }
    
    // Count funding events for this epoch
    const fundingEvents = dashboardData?.events?.filter((e: any) => 
      e.type === 'WeeklyRevenueAdded' && 
      e.data?.epoch_id === epochManagementInfo.currentEpochId
    ) || []
    
    return {
      totalFunded: currentEpoch.totalRevenue,
      fundingCount: fundingEvents.length || (currentEpoch.status === 'claimable' ? 1 : 0),
      canAddMore: true // Always true based on contract analysis
    }
  }, [dashboardData?.epochs, dashboardData?.events, epochManagementInfo.currentEpochId])

  const currentEpoch = getCurrentEpochInfo()
  console.log('Current Epoch:', currentEpoch)
  const protocolInfo = getProtocolInfo()

  const getRevenuePreview = (amount: string) => {
    if (!dashboardData?.config || !amount) return null

    const amountNum = parseFloat(amount) || 0
    if (amountNum <= 0) return null

    return [
      { period: '1 Week', key: 'week', allocation: dashboardData.config.allocations.sui.week, color: 'blue' },
      { period: '3 Months', key: 'threeMonth', allocation: dashboardData.config.allocations.sui.threeMonth, color: 'green' },
      { period: '1 Year', key: 'year', allocation: dashboardData.config.allocations.sui.year, color: 'yellow' },
      { period: '3 Years', key: 'threeYear', allocation: dashboardData.config.allocations.sui.threeYear, color: 'purple' }
    ].map(({ period, key, allocation, color }) => ({
      period,
      key,
      allocation,
      color,
      amount: (amountNum * allocation) / 10000,
      formatted: ((amountNum * allocation) / 10000 / 1e9).toFixed(4)
    }))
  }

  const revenuePreview = getRevenuePreview(revenueAmount)

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-slate-800/30 rounded-lg p-1">
        {[
          { id: 'overview', label: 'Overview', icon: Activity },
          { id: 'revenue', label: 'Revenue Management', icon: DollarSign },
          { id: 'management', label: 'Epoch Management', icon: Settings }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-all duration-200 ${
              activeTab === id
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Protocol Status Alert */}
      {!protocolInfo?.initialized && (
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
            <div>
              <h3 className="font-semibold text-orange-400">Protocol Not Initialized</h3>
              <p className="text-sm text-orange-300">
                Initialize protocol timing or add the first SUI revenue to start.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-4">
              <div className="text-slate-400 text-sm">Total Revenue</div>
              <div className="text-2xl font-bold text-green-400">
                {epochManagementInfo.totalRevenue.toFixed(2)} SUI
              </div>
              <div className="text-green-300 text-xs mt-1">All epochs combined</div>
            </div>
            
            <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-4">
              <div className="text-slate-400 text-sm">Funded Epochs</div>
              <div className="text-2xl font-bold text-blue-400">
                {epochManagementInfo.fundedEpochs} / {epochManagementInfo.totalEpochs}
              </div>
              <div className="text-blue-300 text-xs mt-1">With revenue</div>
            </div>
            
            <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-4">
              <div className="text-slate-400 text-sm">Claimable</div>
              <div className="text-2xl font-bold text-purple-400">
                {epochManagementInfo.claimableEpochs}
              </div>
              <div className="text-purple-300 text-xs mt-1">Ready for users</div>
            </div>
            
            <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-4">
              <div className="text-slate-400 text-sm">Pending</div>
              <div className="text-2xl font-bold text-orange-400">
                {epochManagementInfo.pendingEpochs}
              </div>
              <div className="text-orange-300 text-xs mt-1">Need creation</div>
            </div>
          </div>

          {/* Current Epoch Status */}
          {currentEpoch && (
            <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-purple-400" />
                Current Epoch #{currentEpoch.id}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-slate-800/30 rounded-lg p-4">
                  <div className="text-slate-400 text-sm">Progress</div>
                  <div className="text-2xl font-bold text-white">
                    {currentEpoch.progress?.toFixed(1) || '0'}%
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, currentEpoch.progress || 0)}%` }}
                    />
                  </div>
                </div>
                
                <div className="bg-slate-800/30 rounded-lg p-4">
                  <div className="text-slate-400 text-sm">Time Remaining</div>
                  <div className="text-xl font-bold text-white">
                    {currentEpoch.timeRemaining || 'N/A'}
                  </div>
                </div>
                
                <div className="bg-slate-800/30 rounded-lg p-4">
                  <div className="text-slate-400 text-sm">Total Funded</div>
                  <div className="text-xl font-bold text-green-400">
                    {currentEpochFunding.totalFunded}
                  </div>
                  {currentEpochFunding.fundingCount > 1 && (
                    <div className="text-green-300 text-xs mt-1">
                      {currentEpochFunding.fundingCount}x funded
                    </div>
                  )}
                </div>
                
                <div className="bg-slate-800/30 rounded-lg p-4">
                  <div className="text-slate-400 text-sm">Status</div>
                  <div className={`text-lg font-bold flex items-center space-x-1 ${
                    currentEpoch.status === 'Claimable' ? 'text-green-400' :
                    currentEpoch.status === 'Finalized' ? 'text-blue-400' :
                    'text-orange-400'
                  }`}>
                    {currentEpoch.status === 'Claimable' ? <CheckCircle className="w-5 h-5" /> :
                     currentEpoch.status === 'Finalized' ? <CheckCircle className="w-5 h-5" /> :
                     <Clock className="w-5 h-5" />}
                    <span>{currentEpoch.status}</span>
                  </div>
                </div>

                <div className="bg-slate-800/30 rounded-lg p-4">
                  <div className="text-slate-400 text-sm">Action</div>
                  {currentEpochFunding.canAddMore ? (
                    <button
                      onClick={() => setActiveTab('revenue')}
                      className="text-green-400 hover:text-green-300 text-sm font-medium"
                    >
                      Add More Revenue →
                    </button>
                  ) : (
                    <span className="text-slate-300 text-sm">No action needed</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Revenue Management Tab */}
      {activeTab === 'revenue' && (
        <div className="space-y-6">
          {/* Funding Overview */}
          <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-green-400" />
              Epoch Funding Overview
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-800/30 rounded-lg p-4">
                <div className="text-slate-400 text-sm">Current Epoch</div>
                <div className="text-2xl font-bold text-white">#{currentEpoch?.id || 0}</div>
                <div className="text-green-400 text-xs mt-1">Active Now</div>
              </div>
              
              <div className="bg-slate-800/30 rounded-lg p-4">
                <div className="text-slate-400 text-sm">Total Funded</div>
                <div className="text-2xl font-bold text-green-400">
                  {currentEpochFunding.totalFunded}
                </div>
                <div className="text-green-300 text-xs mt-1">
                  {currentEpochFunding.fundingCount > 0 
                    ? `${currentEpochFunding.fundingCount}x funded`
                    : 'Not funded yet'}
                </div>
              </div>
              
              <div className="bg-slate-800/30 rounded-lg p-4">
                <div className="text-slate-400 text-sm">All-Time Revenue</div>
                <div className="text-2xl font-bold text-blue-400">
                  {epochManagementInfo.totalRevenue.toFixed(2)} SUI
                </div>
                <div className="text-blue-300 text-xs mt-1">
                  {epochManagementInfo.fundedEpochs} epochs funded
                </div>
              </div>
              
              <div className="bg-slate-800/30 rounded-lg p-4">
                <div className="text-slate-400 text-sm">Claim Status</div>
                <div className={`text-lg font-bold flex items-center space-x-1 ${
                  currentEpoch?.isClaimable ? 'text-green-400' : 'text-orange-400'
                }`}>
                  {currentEpoch?.isClaimable ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>Claimable</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-5 h-5" />
                      <span>Not Ready</span>
                    </>
                  )}
                </div>
                <div className="text-slate-300 text-xs mt-1">
                  {currentEpoch?.isClaimable ? 'Can add more' : 'Add revenue'}
                </div>
              </div>
            </div>
          </div>

          {/* Current Epoch Funding Details */}
          {currentEpoch && (
            <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <DollarSign className="w-5 h-5 mr-2 text-green-400" />
                  Epoch #{currentEpoch.id} Funding Status
                </h3>
                {currentEpoch.allocationsFinalized && (
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                    ✓ Finalized - Can Add More
                  </span>
                )}
              </div>
              
              {/* Pool Distribution */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {dashboardData?.epochs?.find((e: any) => e.epochId === currentEpoch.id) && [
                  { period: '1 Week', key: 'weekPoolSui', color: 'blue' },
                  { period: '3 Months', key: 'threeMonthPoolSui', color: 'green' },
                  { period: '1 Year', key: 'yearPoolSui', color: 'yellow' },
                  { period: '3 Years', key: 'threeYearPoolSui', color: 'purple' }
                ].map(({ period, key, color }) => {
                  const epochData = dashboardData.epochs.find((e: any) => e.epochId === currentEpoch.id)
                  const poolAmount = epochData?.poolDistribution?.[key] || '0 SUI'
                  
                  return (
                    <div key={period} className="bg-slate-700/30 rounded-lg p-3">
                      <div className="text-slate-400 text-xs">{period}</div>
                      <div className={`text-${color}-400 font-bold text-sm`}>
                        {poolAmount}
                      </div>
                    </div>
                  )
                })}
              </div>
              
              {/* Important Notice */}
              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Info className="w-4 h-4 text-blue-400 mt-0.5" />
                  <div className="text-xs">
                    <div className="text-blue-400 font-medium mb-1">Multiple Funding Supported</div>
                    <div className="text-blue-300">
                      You can add SUI revenue multiple times to the same epoch. Each addition increases 
                      the total distribution pool proportionally.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Add Revenue Form */}
          <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Zap className="w-5 h-5 mr-2 text-orange-400" />
              Add SUI Revenue
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Info Panel */}
              <div className="space-y-4">
                <div className="border border-slate-600/30 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-3">Current State</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400 text-sm">SUI Vault:</span>
                      <span className="text-white font-semibold">
                        {TokenLockerService.formatSUIAmount(
                          dashboardData?.config?.vaultBalances?.suiRewards || '0'
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 text-sm">Current Epoch:</span>
                      <span className="text-white font-semibold">#{currentEpoch?.id || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 text-sm">Already Funded:</span>
                      <span className="text-green-400 font-semibold">
                        {currentEpochFunding.totalFunded}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 text-sm">Status:</span>
                      <span className={`font-semibold ${
                        currentEpoch?.allocationsFinalized ? 'text-green-400' : 'text-orange-400'
                      }`}>
                        {currentEpoch?.allocationsFinalized ? 'Finalized' : 'Not Finalized'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Quick Amounts */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setRevenueAmount('1000000000')}
                    className="bg-slate-700/50 hover:bg-slate-700/70 text-slate-300 px-3 py-2 rounded-lg text-sm"
                  >
                    1 SUI
                  </button>
                  <button
                    onClick={() => setRevenueAmount('10000000000')}
                    className="bg-slate-700/50 hover:bg-slate-700/70 text-slate-300 px-3 py-2 rounded-lg text-sm"
                  >
                    10 SUI
                  </button>
                  <button
                    onClick={() => setRevenueAmount('100000000000')}
                    className="bg-slate-700/50 hover:bg-slate-700/70 text-slate-300 px-3 py-2 rounded-lg text-sm"
                  >
                    100 SUI
                  </button>
                  <button
                    onClick={() => setRevenueAmount('1000000000000')}
                    className="bg-slate-700/50 hover:bg-slate-700/70 text-slate-300 px-3 py-2 rounded-lg text-sm"
                  >
                    1000 SUI
                  </button>
                </div>
              </div>
              
              {/* Form */}
              <div className="border border-slate-600/30 rounded-lg p-4">
                <h4 className="text-white font-medium mb-3">Revenue Amount</h4>
                <div className="space-y-4">
                  <div>
                    <input
                      type="text"
                      value={revenueAmount}
                      onChange={(e) => setRevenueAmount(e.target.value)}
                      placeholder="Amount in MIST"
                      disabled={!canPerformAction}
                      className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-white"
                    />
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-slate-400 text-xs">1 SUI = 1,000,000,000 MIST</span>
                      {revenueAmount && (
                        <span className="text-green-400 text-xs">
                          = {(parseFloat(revenueAmount) / 1e9).toFixed(4)} SUI
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Distribution Preview */}
                  {revenuePreview && (
                    <div className="bg-slate-700/30 rounded-lg p-3">
                      <div className="text-slate-400 text-xs mb-2">Distribution Preview:</div>
                      <div className="space-y-1">
                        {revenuePreview.map(({ period, formatted, color }) => (
                          <div key={period} className="flex justify-between text-xs">
                            <span className={`text-${color}-400`}>{period}:</span>
                            <span className="text-white">{formatted} SUI</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {currentEpoch?.allocationsFinalized ? (
                    // Epoch is finalized - need to create new epoch
                    <>
                      <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 mb-3">
                        <div className="flex items-start space-x-2">
                          <AlertTriangle className="w-4 h-4 text-orange-400 mt-0.5" />
                          <div>
                            <p className="text-orange-400 text-sm font-medium">Epoch Already Finalized</p>
                            <p className="text-orange-300 text-xs mt-1">
                              Epoch #{currentEpoch.id} has been finalized. Create the next epoch to add more revenue.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => onConfirmAction('createNextEpoch')}
                        disabled={!canPerformAction || actionLoading}
                        className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white font-semibold px-4 py-3 rounded-lg flex items-center justify-center space-x-2"
                      >
                        {actionLoading ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Processing...</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            <span>Create Next Epoch First</span>
                          </>
                        )}
                      </button>
                      
                      <div className="text-xs text-slate-400 mt-2">
                        💡 After creating the next epoch, you can add revenue to it
                      </div>
                    </>
                  ) : (
                    // Epoch not finalized - can add revenue
                    <>
                      <button
                        onClick={() => onConfirmAction('addWeeklyRevenue')}
                        disabled={!canPerformAction || !revenueAmount || actionLoading}
                        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-semibold px-4 py-3 rounded-lg"
                      >
                        {actionLoading ? (
                          <div className="flex items-center justify-center space-x-2">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Processing...</span>
                          </div>
                        ) : (
                          'Add Revenue & Finalize Epoch'
                        )}
                      </button>
                      
                      <div className="text-xs text-slate-400 mt-2">
                        {!protocolInfo?.initialized 
                          ? '⚡ First revenue will initialize protocol'
                          : '🎯 This will finalize epoch #{currentEpoch?.id || 0} and enable claims'}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Epoch Management Tab */}
      {activeTab === 'management' && (
        <div className="space-y-6">
          {/* Initialization Card */}
          {!protocolInfo?.initialized && (
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-orange-400 mb-4">
                Initialize Protocol First
              </h3>
              <p className="text-orange-300 mb-4">
                The protocol timing system needs to be initialized.
              </p>
              <button
                onClick={() => onConfirmAction('initializeProtocol')}
                disabled={!canPerformAction || actionLoading}
                className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white font-semibold px-4 py-3 rounded-lg"
              >
                {actionLoading ? 'Initializing...' : 'Initialize Protocol Timing'}
              </button>
            </div>
          )}

          {/* Epoch Management */}
          {protocolInfo?.initialized && (
            <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-blue-400" />
                Epoch Creation Management
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-slate-700/30 rounded-lg p-4">
                  <div className="text-slate-400 text-sm">Total Expected</div>
                  <div className="text-2xl font-bold text-white">{epochManagementInfo.totalEpochs}</div>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-4">
                  <div className="text-slate-400 text-sm">Created</div>
                  <div className="text-2xl font-bold text-blue-400">{epochManagementInfo.createdEpochs}</div>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-4">
                  <div className="text-slate-400 text-sm">Pending</div>
                  <div className="text-2xl font-bold text-orange-400">{epochManagementInfo.pendingEpochs}</div>
                </div>
              </div>
              
              {epochManagementInfo.canCreateNext ? (
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-orange-400 font-medium">Create Next Epoch</h4>
                      <p className="text-slate-400 text-sm">
                        Epoch #{epochManagementInfo.nextEpochId} is ready
                      </p>
                    </div>
                    <button
                      onClick={() => onConfirmAction('createNextEpoch')}
                      disabled={!canPerformAction || actionLoading}
                      className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white px-4 py-3 rounded-lg"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-green-400">All epochs up to date</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}