// components/tokenlocker/EpochManager.tsx - LATEST VERSION FOR NEW EPOCH SYSTEM
import React, { useState, useMemo } from 'react'
import { Clock, DollarSign, BarChart3, Zap, AlertTriangle, CheckCircle, Eye, RefreshCw, TrendingUp, Plus, Calendar, PlayCircle, Activity, Settings } from 'lucide-react'
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
    
    // Find the next epoch that needs creation
    const nextPendingEpoch = epochs.find((e: any) => e.status === 'pending')
    const nextEpochId = nextPendingEpoch ? nextPendingEpoch.epochId : createdEpochs + 1
    
    // Current epoch from timing
    const currentEpochId = dashboardData?.timing?.current?.id || 0
    
    // Can create next epoch if there are pending epochs
    const canCreateNext = pendingEpochs > 0

    return {
      totalEpochs,
      createdEpochs,
      pendingEpochs,
      claimableEpochs,
      nextEpochId,
      canCreateNext,
      currentEpochId
    }
  }, [dashboardData?.epochs, dashboardData?.timing])

  const currentEpoch = getCurrentEpochInfo()
  const protocolInfo = getProtocolInfo()

  const getRevenuePreview = (amount: string) => {
    if (!dashboardData?.config || !amount) return null

    const amountNum = parseFloat(amount) || 0
    if (amountNum <= 0) return null

    return [
      { period: '1 Week', allocation: dashboardData.config.allocations.sui.week, color: 'blue' },
      { period: '3 Months', allocation: dashboardData.config.allocations.sui.threeMonth, color: 'green' },
      { period: '1 Year', allocation: dashboardData.config.allocations.sui.year, color: 'yellow' },
      { period: '3 Years', allocation: dashboardData.config.allocations.sui.threeYear, color: 'purple' }
    ].map(({ period, allocation, color }) => ({
      period,
      allocation,
      color,
      amount: (amountNum * allocation) / 10000,
      formatted: ((amountNum * allocation) / 10000 / 1e9).toFixed(2)
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
                Protocol timing will be initialized automatically when you add the first SUI revenue.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Protocol & Current Epoch Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Protocol Status */}
            <div className={`border rounded-xl p-6 ${
              protocolInfo?.initialized 
                ? 'bg-green-500/10 border-green-500/20' 
                : 'bg-orange-500/10 border-orange-500/20'
            }`}>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                {protocolInfo?.initialized ? (
                  <CheckCircle className="w-5 h-5 mr-2 text-green-400" />
                ) : (
                  <AlertTriangle className="w-5 h-5 mr-2 text-orange-400" />
                )}
                Protocol Status
              </h3>
              
              {protocolInfo?.initialized ? (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Status:</span>
                    <span className="text-green-400 font-semibold">Initialized</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Epoch Duration:</span>
                    <span className="text-white">{protocolInfo.epochDuration}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Expected Epochs:</span>
                    <span className="text-white">{protocolInfo.totalEpochs}</span>
                  </div>
                </div>
              ) : (
                <div className="text-orange-300">
                  Add the first SUI revenue to initialize the protocol timing system and enable predictable epoch scheduling.
                </div>
              )}
              
              <button
                onClick={onRefresh}
                disabled={loadingStates.dashboard}
                className="mt-4 w-full flex items-center justify-center space-x-2 bg-slate-700/50 hover:bg-slate-700/70 text-slate-300 hover:text-white px-3 py-2 rounded-lg transition-all duration-200 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loadingStates.dashboard ? 'animate-spin' : ''}`} />
                <span className="text-sm">Refresh Status</span>
              </button>
            </div>

            {/* Epoch Statistics */}
            <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-blue-400" />
                Epoch Statistics
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-700/30 rounded-lg p-3">
                  <div className="text-slate-400 text-sm">Created</div>
                  <div className="text-2xl font-bold text-blue-400">{epochManagementInfo.createdEpochs}</div>
                  <div className="text-blue-300 text-xs">Ready & Active</div>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-3">
                  <div className="text-slate-400 text-sm">Claimable</div>
                  <div className="text-2xl font-bold text-green-400">{epochManagementInfo.claimableEpochs}</div>
                  <div className="text-green-300 text-xs">With Revenue</div>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-3">
                  <div className="text-slate-400 text-sm">Pending</div>
                  <div className="text-2xl font-bold text-orange-400">{epochManagementInfo.pendingEpochs}</div>
                  <div className="text-orange-300 text-xs">Need Creation</div>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-3">
                  <div className="text-slate-400 text-sm">Current</div>
                  <div className="text-2xl font-bold text-purple-400">#{epochManagementInfo.currentEpochId}</div>
                  <div className="text-purple-300 text-xs">Active Now</div>
                </div>
              </div>
              
              {epochManagementInfo.canCreateNext && canPerformAction && (
                <div className="mt-4 bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-orange-400 font-medium">Action Required</div>
                      <div className="text-slate-400 text-sm">Epoch #{epochManagementInfo.nextEpochId} needs creation</div>
                    </div>
                    <button
                      onClick={() => onConfirmAction('createNextEpoch')}
                      disabled={actionLoading}
                      className="flex items-center space-x-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:opacity-50 text-white px-3 py-2 rounded-lg transition-all duration-200"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="text-sm">{actionLoading ? 'Creating...' : 'Create Next'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Current Epoch Progress */}
          {currentEpoch && protocolInfo?.initialized && (
            <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-purple-400" />
                Current Epoch #{currentEpoch.id} Progress
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-800/30 rounded-lg p-4">
                  <div className="text-slate-400 text-sm">Progress</div>
                  <div className="text-2xl font-bold text-white">
                    {currentEpoch.progress?.toFixed(1) || '0'}%
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, currentEpoch.progress || 0)}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="bg-slate-800/30 rounded-lg p-4">
                  <div className="text-slate-400 text-sm">Time Remaining</div>
                  <div className="text-2xl font-bold text-white">
                    {currentEpoch.timeRemaining || 'N/A'}
                  </div>
                  <div className="text-blue-400 text-sm mt-1">Until completion</div>
                </div>
                
                <div className="bg-slate-800/30 rounded-lg p-4">
                  <div className="text-slate-400 text-sm">Status</div>
                  <div className={`text-lg font-bold flex items-center space-x-2 ${
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
                  <div className="text-slate-400 text-sm">Next Action</div>
                  <div className="text-white font-semibold">
                    {currentEpoch.status === 'Claimable' ? 'Users can claim' :
                     currentEpoch.status === 'Finalized' ? 'Ready for next' :
                     'Add SUI revenue'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Revenue Management Tab */}
      {activeTab === 'revenue' && (
        <div className="space-y-6">
          {/* SUI Revenue Management */}
          <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-green-400" />
              Weekly SUI Revenue Distribution
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Current SUI Balance */}
              <div className="border border-slate-600/30 rounded-lg p-4">
                <h4 className="text-white font-medium mb-3 flex items-center">
                  <BarChart3 className="w-4 h-4 mr-2 text-green-400" />
                  Current SUI Vault Balance
                </h4>
                {loadingStates.dashboard ? (
                  <LoadingSkeleton className="w-32 h-8" />
                ) : (
                  <div className="text-3xl font-bold text-green-400 mb-2">
                    {dashboardData?.config ? TokenLockerService.formatSUIAmount(dashboardData.config.vaultBalances.suiRewards) : '0 SUI'}
                  </div>
                )}
                <div className="text-slate-400 text-sm">Available for distribution</div>
                
                {dashboardData?.config?.currentEpoch && (
                  <div className="mt-4 p-3 bg-slate-700/30 rounded-lg">
                    <div className="text-slate-300 text-sm">Current Epoch:</div>
                    <div className="text-xs text-slate-400 mt-1">
                      Claimable: {dashboardData.config.currentEpoch.isClaimable ? 'Yes' : 'No'} • 
                      Finalized: {dashboardData.config.currentEpoch.allocationsFinalized ? 'Yes' : 'No'}
                    </div>
                    {dashboardData.config.currentEpoch.isClaimable && (
                      <div className="text-xs text-green-400 mt-1">
                        ✓ Ready to distribute to users
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Add Revenue Form */}
              <div className="border border-slate-600/30 rounded-lg p-4">
                <h4 className="text-white font-medium mb-3 flex items-center">
                  <Zap className="w-4 h-4 mr-2 text-orange-400" />
                  Add Weekly Revenue
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-slate-300 font-medium mb-2">SUI Amount</label>
                    <input
                      type="text"
                      value={revenueAmount}
                      onChange={(e) => setRevenueAmount(e.target.value)}
                      placeholder="Amount in MIST (e.g., 1000000000)"
                      disabled={!canPerformAction}
                      className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:border-green-500 focus:outline-none disabled:opacity-50"
                    />
                    <p className="text-slate-400 text-xs mt-1">
                      1 SUI = 1,000,000,000 MIST
                    </p>
                  </div>
                  
                  <button
                    onClick={() => {
                      const validation = TokenLockerService.validateAmount(revenueAmount, '1000000000') // Min 1 SUI
                      if (!validation.isValid) {
                        alert(validation.error)
                        return
                      }
                      onConfirmAction('addWeeklyRevenue')
                    }}
                    disabled={!canPerformAction || !revenueAmount || actionLoading}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:opacity-50 text-white font-semibold px-4 py-3 rounded-lg transition-all duration-200"
                  >
                    {actionLoading ? 'Processing...' : 'Add Weekly SUI Revenue'}
                  </button>
                  
                  <div className="text-xs text-slate-400">
                    {protocolInfo?.initialized 
                      ? 'This will distribute SUI to all lock periods based on current allocations and finalize the current epoch.'
                      : 'Adding the first SUI revenue will initialize the protocol timing automatically.'
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Distribution Preview */}
          <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-blue-400" />
              Revenue Distribution Preview
            </h3>
            
            {revenuePreview ? (
              <div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {revenuePreview.map(({ period, allocation, formatted, color }) => (
                    <div key={period} className="border border-slate-600/30 rounded-lg p-4">
                      <div className="text-slate-400 text-sm">{period}</div>
                      <div className={`text-${color}-400 font-bold text-lg`}>
                        {TokenLockerService.formatAllocationPercentage(allocation)}
                      </div>
                      <div className="text-green-400 text-sm">
                        ~{formatted} SUI
                      </div>
                      <div className="text-slate-500 text-xs mt-1">
                        {dashboardData?.config ? TokenLockerService.formatVictoryAmount(
                          period === '1 Week' ? dashboardData.config.poolStats.weekLocked :
                          period === '3 Months' ? dashboardData.config.poolStats.threeMonthLocked :
                          period === '1 Year' ? dashboardData.config.poolStats.yearLocked :
                          dashboardData.config.poolStats.threeYearLocked
                        ) : '0'} locked
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-blue-400" />
                    <span className="text-blue-400 font-medium text-sm">Distribution Summary</span>
                  </div>
                  <div className="text-slate-300 text-sm">
                    Total: {TokenLockerService.formatSUIAmount(revenueAmount)} will be distributed across {revenuePreview.length} lock periods.
                    Users can claim their proportional share based on their stake in each pool.
                    {!protocolInfo?.initialized && (
                      <div className="mt-2 text-orange-300">
                        ⚡ This will also initialize the protocol timing system automatically.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {dashboardData?.config && [
                  { period: '1 Week', allocation: dashboardData.config.allocations.sui.week, locks: dashboardData.config.poolStats.weekLocked, color: 'blue' },
                  { period: '3 Months', allocation: dashboardData.config.allocations.sui.threeMonth, locks: dashboardData.config.poolStats.threeMonthLocked, color: 'green' },
                  { period: '1 Year', allocation: dashboardData.config.allocations.sui.year, locks: dashboardData.config.poolStats.yearLocked, color: 'yellow' },
                  { period: '3 Years', allocation: dashboardData.config.allocations.sui.threeYear, locks: dashboardData.config.poolStats.threeYearLocked, color: 'purple' }
                ].map(({ period, allocation, locks, color }) => (
                  <div key={period} className="border border-slate-600/30 rounded-lg p-4">
                    <div className="text-slate-400 text-sm">{period}</div>
                    <div className={`text-${color}-400 font-bold`}>
                      {TokenLockerService.formatAllocationPercentage(allocation)}
                    </div>
                    <div className="text-slate-500 text-xs mt-1">
                      {TokenLockerService.formatVictoryAmount(locks)} locked
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Epoch Management Tab */}
      {activeTab === 'management' && (
        <div className="space-y-6">
          {/* Epoch Creation Management */}
          <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-blue-400" />
              Epoch Creation Management
            </h3>
            
            {protocolInfo?.initialized ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-700/30 rounded-lg p-4">
                    <div className="text-slate-400 text-sm">Total Expected</div>
                    <div className="text-2xl font-bold text-white">{epochManagementInfo.totalEpochs}</div>
                    <div className="text-slate-300 text-xs">Based on time elapsed</div>
                  </div>
                  <div className="bg-slate-700/30 rounded-lg p-4">
                    <div className="text-slate-400 text-sm">Created</div>
                    <div className="text-2xl font-bold text-blue-400">{epochManagementInfo.createdEpochs}</div>
                    <div className="text-blue-300 text-xs">Admin created</div>
                  </div>
                  <div className="bg-slate-700/30 rounded-lg p-4">
                    <div className="text-slate-400 text-sm">Pending</div>
                    <div className="text-2xl font-bold text-orange-400">{epochManagementInfo.pendingEpochs}</div>
                    <div className="text-orange-300 text-xs">Need creation</div>
                  </div>
                </div>
                
                {epochManagementInfo.canCreateNext ? (
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="text-orange-400 font-medium">Next Epoch Ready for Creation</h4>
                        <p className="text-slate-400 text-sm">
                          Epoch #{epochManagementInfo.nextEpochId} should be created to maintain the schedule.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-slate-300">
                        Creating epochs in sequence ensures predictable timing for users and proper revenue distribution.
                      </div>
                      <button
                        onClick={() => onConfirmAction('createNextEpoch')}
                        disabled={!canPerformAction || actionLoading}
                        className="flex items-center space-x-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:opacity-50 text-white px-4 py-3 rounded-lg transition-all duration-200"
                      >
                        <Plus className="w-5 h-5" />
                        <span>{actionLoading ? 'Creating Epoch...' : `Create Epoch #${epochManagementInfo.nextEpochId}`}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <div>
                        <h4 className="text-green-400 font-medium">All Epochs Up to Date</h4>
                        <p className="text-slate-400 text-sm">
                          All expected epochs have been created. Next epoch will be needed when the current period advances.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 mx-auto text-orange-400 mb-4" />
                <h4 className="text-orange-400 font-medium mb-2">Protocol Not Initialized</h4>
                <p className="text-slate-400 text-sm mb-4">
                  Epoch management will be available after the protocol timing is initialized.
                </p>
                <p className="text-slate-300 text-sm">
                  Add the first SUI revenue to automatically initialize the protocol.
                </p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button
              onClick={onRefresh}
              disabled={loadingStates.dashboard}
              className="flex items-center justify-center space-x-2 bg-slate-700/50 hover:bg-slate-700/70 text-slate-300 hover:text-white px-4 py-3 rounded-lg transition-all duration-200 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loadingStates.dashboard ? 'animate-spin' : ''}`} />
              <span>Refresh Data</span>
            </button>
            
            <button
              onClick={() => {
                if (dashboardData?.config) {
                  const info = `Current Epoch: ${dashboardData.config.currentEpoch.id}\nSUI Balance: ${TokenLockerService.formatSUIAmount(dashboardData.config.vaultBalances.suiRewards)}\nClaimable: ${dashboardData.config.currentEpoch.isClaimable}\nFinalized: ${dashboardData.config.currentEpoch.allocationsFinalized}\nProtocol Initialized: ${protocolInfo?.initialized || false}`
                  alert(info)
                }
              }}
              className="flex items-center justify-center space-x-2 bg-blue-600/50 hover:bg-blue-600/70 text-blue-300 hover:text-white px-4 py-3 rounded-lg transition-all duration-200"
            >
              <Eye className="w-4 h-4" />
              <span>View Status</span>
            </button>
            
            <button
              onClick={() => {
                if (dashboardData?.config) {
                  const allocInfo = Object.entries(dashboardData.config.allocations.sui)
                    .filter(([key]) => key !== 'total')
                    .map(([key, value]) => `${TokenLockerService.getLockPeriodDisplayName(
                      key === 'week' ? 7 : key === 'threeMonth' ? 90 : key === 'year' ? 365 : 1095
                    )}: ${TokenLockerService.formatAllocationPercentage(value as number)}`)
                    .join('\n')
                  alert(`Current SUI Allocations:\n${allocInfo}`)
                }
              }}
              className="flex items-center justify-center space-x-2 bg-purple-600/50 hover:bg-purple-600/70 text-purple-300 hover:text-white px-4 py-3 rounded-lg transition-all duration-200"
            >
              <BarChart3 className="w-4 h-4" />
              <span>View Allocations</span>
            </button>

            {/* Quick Create Next Epoch Button */}
            {epochManagementInfo.canCreateNext && canPerformAction && (
              <button
                onClick={() => onConfirmAction('createNextEpoch')}
                disabled={actionLoading}
                className="flex items-center justify-center space-x-2 bg-orange-600/50 hover:bg-orange-600/70 text-orange-300 hover:text-white px-4 py-3 rounded-lg transition-all duration-200 disabled:opacity-50"
              >
                <PlayCircle className="w-4 h-4" />
                <span>Create Epoch #{epochManagementInfo.nextEpochId}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Add this in the Protocol Status section when not initialized */}
      {!protocolInfo?.initialized && canPerformAction && (
        <button
          onClick={() => onConfirmAction('initializeProtocol')}
          disabled={actionLoading}
          className="mt-4 w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:opacity-50 text-white font-semibold px-4 py-3 rounded-lg transition-all duration-200"
        >
          <PlayCircle className="w-4 h-4 mr-2" />
          {actionLoading ? 'Initializing...' : 'Initialize Protocol Timing'}
        </button>
      )}

      {/* Warning for Admin Actions */}
      {!canPerformAction && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            <span className="text-yellow-400 font-medium">
              Admin authentication required for epoch and revenue operations
            </span>
          </div>
        </div>
      )}
    </div>
  )
}