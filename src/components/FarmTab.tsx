// components/admin/FarmTab.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useWallet } from '@suiet/wallet-kit'
import { useAuth } from '../contexts/AuthContext'
import { FarmService } from '../services/farmService'
import { FarmUtils } from '../utils/farmUtils'
import type { 
  FarmConfig, 
  FarmStats, 
  FarmEvent, 
  PoolInfo, 
  FarmFeeAddresses, 
  FarmUpdateAddresses,
  PoolConfig 
} from '../types/farmTypes'
import { CONSTANTS } from '../constants'

// Icons (same as before)
function PlayIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  )
}

function PauseIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function RefreshIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  )
}

function WarningIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  )
}

function CopyIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
    </svg>
  )
}

function TrendingUpIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  )
}

function DatabaseIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
    </svg>
  )
}

function SearchIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
}

function ChartIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )
}

// Loading skeleton
function LoadingSkeleton({ className = "h-4 bg-slate-700/50 rounded animate-pulse" }: { className?: string }) {
  return <div className={className}></div>
}

type TabType = 'overview' | 'pools' | 'addresses'

export default function FarmTab() {
  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  
  // Core data states
  const [farmConfig, setFarmConfig] = useState<FarmConfig | null>(null)
  const [farmStats, setFarmStats] = useState<FarmStats | null>(null)
  const [allPools, setAllPools] = useState<PoolInfo[]>([])
  const [farmEvents, setFarmEvents] = useState<FarmEvent[]>([])
  
  // Pool selection states
  const [searchToken, setSearchToken] = useState('')
  const [selectedPool, setSelectedPool] = useState<PoolInfo | null>(null)
  const [selectedPoolConfig, setSelectedPoolConfig] = useState<PoolConfig | null>(null)
  const [currentAddresses, setCurrentAddresses] = useState<FarmFeeAddresses | null>(null)
  
  // Loading states
  const [loadingStates, setLoadingStates] = useState({
    stats: true,
    pools: true,
    poolSearch: false,
    events: true
  })
  
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  // Form states
  const [newAddresses, setNewAddresses] = useState<FarmUpdateAddresses>({
    burn: '',
    locker: '',
    team1: '',
    team2: '',
    dev: ''
  })
  const [confirmAction, setConfirmAction] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const { connected, account, signAndExecuteTransaction } = useWallet()
  const { authMethod } = useAuth()

  const canPerformAction = useMemo(() => 
    connected && (authMethod === 'secret' || account?.address === CONSTANTS.ADMIN),
    [connected, authMethod, account?.address]
  )

  // Memoized permission checks
  const permissions = useMemo(() => {
    if (!farmConfig || !canPerformAction || !account?.address) {
      return { canPause: false, canUpdateAddresses: false, canManagePools: false }
    }
    
    return {
      canPause: FarmService.canPerformAdminOperation(account.address, farmConfig, 'pause'),
      canUpdateAddresses: FarmService.canPerformAdminOperation(account.address, farmConfig, 'addresses'),
      canManagePools: FarmService.canPerformAdminOperation(account.address, farmConfig, 'pool_config')
    }
  }, [farmConfig, canPerformAction, account?.address])

  // Load data
  const loadCoreData = useCallback(async () => {
    try {
      setError(null)
      
      // Load farm config
      setLoadingStates(prev => ({ ...prev, stats: true }))
      const config = await FarmService.fetchFarmConfig()
      setFarmConfig(config)
      
      // Load farm stats
      const stats = await FarmService.fetchFarmStats()
      setFarmStats(stats)
      setLoadingStates(prev => ({ ...prev, stats: false }))
      
      // Load all pools
      setLoadingStates(prev => ({ ...prev, pools: true }))
      const pools = await FarmService.fetchAllPools()
      setAllPools(pools)
      setLoadingStates(prev => ({ ...prev, pools: false }))
      
      // Load current addresses
      const addresses = await FarmService.fetchFarmFeeAddresses()
      setCurrentAddresses(addresses)
      if (addresses) {
        setNewAddresses({
          burn: addresses.burn,
          locker: addresses.locker,
          team1: addresses.team1,
          team2: addresses.team2,
          dev: addresses.dev
        })
      }
      
      setLastUpdate(new Date())
    } catch (err) {
      console.error('Error loading farm data:', err)
      setError('Failed to load farm data')
    }
  }, [])

  const loadEvents = useCallback(async () => {
    try {
      setLoadingStates(prev => ({ ...prev, events: true }))
      const events = await FarmService.fetchFarmAdminEvents(10)
      setFarmEvents(events)
      setLoadingStates(prev => ({ ...prev, events: false }))
    } catch (err) {
      console.error('Error loading farm events:', err)
    }
  }, [])

  // Initial load
  useEffect(() => {
    loadCoreData()
    const timer = setTimeout(loadEvents, 1000)
    return () => clearTimeout(timer)
  }, [loadCoreData, loadEvents])

  // Manual refresh
  const handleManualRefresh = async () => {
    await loadCoreData()
    loadEvents()
  }

  // Handle pool search
  const handlePoolSearch = async () => {
    if (!searchToken) {
      setError('Please enter a token address or type')
      return
    }

    setLoadingStates(prev => ({ ...prev, poolSearch: true }))
    setError(null)
    setSuccess(null)

    const result = await FarmService.findPoolByToken(searchToken)
    
    setLoadingStates(prev => ({ ...prev, poolSearch: false }))

    if (result.exists && result.poolInfo) {
      setSelectedPool(result.poolInfo)
      
      // Load pool config
      const config = await FarmService.fetchPoolConfig(result.poolInfo.poolType)
      setSelectedPoolConfig(config)
      
      setSuccess(`Found pool: ${result.poolInfo.name}`)
      setActiveTab('pools')
    } else {
      setError(result.error || 'Pool not found')
      setSelectedPool(null)
      setSelectedPoolConfig(null)
    }
  }

  // Handle pool selection from list
  const handleSelectPool = async (pool: PoolInfo) => {
    setSelectedPool(pool)
    const config = await FarmService.fetchPoolConfig(pool.poolType)
    setSelectedPoolConfig(config)
    setError(null)
    setSuccess(null)
  }

  // Handle transaction execution
  const handleTransaction = async (
    buildTx: () => any,
    successMessage: string
  ) => {
    try {
      setActionLoading(true)
      setError(null)

      const tx = buildTx()
      
      const result = await signAndExecuteTransaction({
        transaction: tx,
        options: {
          showEffects: true
        }
      })

      if (result.effects?.status?.status === 'success') {
        setSuccess(successMessage)
        setConfirmAction(null)
        
        // Reload data
        await loadCoreData()
        
        // Reload selected pool if exists
        if (selectedPool) {
          const updatedPool = await FarmService.fetchPoolByType(selectedPool.poolType)
          if (updatedPool) setSelectedPool(updatedPool)
          
          const updatedConfig = await FarmService.fetchPoolConfig(selectedPool.poolType)
          setSelectedPoolConfig(updatedConfig)
        }
      } else {
        throw new Error('Transaction failed')
      }
    } catch (err: any) {
      console.error('Transaction error:', err)
      setError(FarmUtils.getErrorMessage(err))
      setConfirmAction(null)
    } finally {
      setActionLoading(false)
    }
  }

  // Render overview tab
  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Farm Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <DatabaseIcon className="w-5 h-5 text-purple-400" />
            <span className="text-xs text-purple-400 font-medium">TOTAL</span>
          </div>
          {loadingStates.stats ? (
            <LoadingSkeleton className="h-8 w-20" />
          ) : (
            <>
              <div className="text-2xl font-bold text-white">{farmStats?.totalPools || 0}</div>
              <div className="text-xs text-gray-400 mt-1">
                {farmStats?.lpPools || 0} LP • {farmStats?.singlePools || 0} Single
              </div>
            </>
          )}
        </div>

        <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <PlayIcon className="w-5 h-5 text-green-400" />
            <span className="text-xs text-green-400 font-medium">ACTIVE</span>
          </div>
          {loadingStates.stats ? (
            <LoadingSkeleton className="h-8 w-16" />
          ) : (
            <>
              <div className="text-2xl font-bold text-white">{farmStats?.activePools || 0}</div>
              <div className="text-xs text-gray-400 mt-1">Pools Running</div>
            </>
          )}
        </div>

        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <TrendingUpIcon className="w-5 h-5 text-blue-400" />
            <span className="text-xs text-blue-400 font-medium">TVL</span>
          </div>
          {loadingStates.stats ? (
            <LoadingSkeleton className="h-8 w-24" />
          ) : (
            <>
              <div className="text-2xl font-bold text-white">
                ${FarmUtils.formatNumber(parseFloat(farmStats?.totalValueLocked || '0'))}
              </div>
              <div className="text-xs text-gray-400 mt-1">Total Value Locked</div>
            </>
          )}
        </div>

        <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <ChartIcon className="w-5 h-5 text-yellow-400" />
            <span className="text-xs text-yellow-400 font-medium">AVG APR</span>
          </div>
          {loadingStates.stats ? (
            <LoadingSkeleton className="h-8 w-20" />
          ) : (
            <>
              <div className="text-2xl font-bold text-white">
                {FarmUtils.formatAPR(farmStats?.averageAPR || 0)}
              </div>
              <div className="text-xs text-gray-400 mt-1">Average APR</div>
            </>
          )}
        </div>
      </div>

      {/* Farm Info */}
      <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Farm Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-400">Farm Address</p>
            <p className="font-mono text-white text-sm">{FarmUtils.formatAddress(CONSTANTS.FARM_ID)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Status</p>
            <div className="flex items-center space-x-2">
              {farmStats?.farmPaused ? (
                <>
                  <PauseIcon className="w-4 h-4 text-yellow-400" />
                  <span className="text-yellow-400 font-medium">Paused</span>
                </>
              ) : (
                <>
                  <PlayIcon className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 font-medium">Active</span>
                </>
              )}
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-400">Total Victory Distributed</p>
            <p className="text-white font-medium">
              {FarmUtils.formatNumber(parseFloat(farmStats?.totalVictoryDistributed || '0') / 1e9)} VICTORY
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Admin</p>
            <p className="font-mono text-white text-sm">
              {farmConfig?.admin ? FarmUtils.formatAddress(farmConfig.admin) : 'Loading...'}
            </p>
          </div>
        </div>
      </div>

      {/* Recent Events */}
      <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
        {loadingStates.events ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <LoadingSkeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : farmEvents.length > 0 ? (
          <div className="space-y-2">
            {farmEvents.map((event, index) => (
              <div key={index} className="bg-slate-700/20 rounded-lg p-3 border border-slate-600/20">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-white">{event.type}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(event.timestamp).toLocaleString()}
                  </span>
                </div>
                <pre className="text-xs text-gray-400 font-mono overflow-x-auto">
                  {JSON.stringify(event.data, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-4">No recent events</p>
        )}
      </div>
    </div>
  )

  // Render pools tab
  const renderPoolsTab = () => (
    <div className="space-y-6">
      {/* Pool Search */}
      <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Search Pool by Token</h3>
        <div className="flex space-x-3">
          <div className="flex-1">
            <input
              type="text"
              value={searchToken}
              onChange={(e) => setSearchToken(e.target.value)}
              placeholder="Enter token address or type..."
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
            />
          </div>
          <button
            onClick={handlePoolSearch}
            disabled={loadingStates.poolSearch}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg transition-all font-medium flex items-center"
          >
            <SearchIcon className="w-4 h-4 mr-2" />
            {loadingStates.poolSearch ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {/* All Pools List */}
      <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">All Pools</h3>
        {loadingStates.pools ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map(i => (
              <LoadingSkeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : allPools.length > 0 ? (
          <div className="space-y-2">
            {allPools.map((pool) => (
              <button
                key={pool.poolId}
                onClick={() => handleSelectPool(pool)}
                className={`w-full text-left bg-slate-700/20 hover:bg-slate-700/40 border rounded-lg p-4 transition-all ${
                  selectedPool?.poolId === pool.poolId 
                    ? 'border-purple-500 ring-2 ring-purple-500/30' 
                    : 'border-slate-600/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-semibold text-white">{pool.name}</h4>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        pool.isLPToken 
                          ? 'bg-blue-500/20 text-blue-400' 
                          : 'bg-purple-500/20 text-purple-400'
                      }`}>
                        {pool.isLPToken ? 'LP' : 'Single'}
                      </span>
                      {pool.active ? (
                        <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400">
                          Active
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded bg-gray-500/20 text-gray-400">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-mono text-gray-400">
                      {FarmUtils.formatAddress(pool.poolType)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">
                      TVL: ${FarmUtils.formatNumber(parseFloat(pool.tvl) / 1e9)}
                    </p>
                    <p className="text-xs text-gray-400">
                      APR: {FarmUtils.formatAPR(pool.apr)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">No pools found</p>
        )}
      </div>

      {/* Selected Pool Details */}
      {selectedPool && selectedPoolConfig && permissions.canManagePools && (
        <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Pool Management: {selectedPool.name}</h3>
          
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400">Total Staked</p>
                <p className="text-white font-medium">
                  {FarmUtils.formatNumber(parseFloat(selectedPoolConfig.totalStaked) / 1e9)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Allocation Points</p>
                <p className="text-white font-medium">{selectedPoolConfig.allocationPoints}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Deposit Fee</p>
                <p className="text-white font-medium">{parseFloat(selectedPoolConfig.depositFee) / 100}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Withdrawal Fee</p>
                <p className="text-white font-medium">{parseFloat(selectedPoolConfig.withdrawalFee) / 100}%</p>
              </div>
            </div>
          </div>

          {/* Pool Control Buttons */}
          <div className="flex space-x-3">
            {selectedPoolConfig.active ? (
              <button
                onClick={() => setConfirmAction('deactivate_pool')}
                disabled={actionLoading}
                className="flex-1 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white font-medium px-4 py-3 rounded-lg transition-colors flex items-center justify-center"
              >
                <PauseIcon className="w-4 h-4 mr-2" />
                Deactivate Pool
              </button>
            ) : (
              <button
                onClick={() => setConfirmAction('activate_pool')}
                disabled={actionLoading}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium px-4 py-3 rounded-lg transition-colors flex items-center justify-center"
              >
                <PlayIcon className="w-4 h-4 mr-2" />
                Activate Pool
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )

  // Render addresses tab
  const renderAddressesTab = () => (
    <div className="space-y-6">
      {/* Current Addresses Display */}
      {currentAddresses && (
        <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Current Fee Addresses</h3>
          <div className="space-y-3">
            {[
              ['Burn Address', currentAddresses.burn],
              ['Locker Address', currentAddresses.locker],
              ['Team1 Address', currentAddresses.team1],
              ['Team2 Address', currentAddresses.team2],
              ['Dev Address', currentAddresses.dev]
            ].map(([label, address]) => (
              <div key={label}>
                <p className="text-sm text-gray-400 mb-1">{label}</p>
                <p className="font-mono text-white text-sm bg-slate-700/30 rounded px-3 py-2">
                  {address}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Update Addresses Form */}
      {permissions.canUpdateAddresses && (
        <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Update Fee Addresses</h3>
          
          <button
            onClick={() => currentAddresses && setNewAddresses({
              burn: currentAddresses.burn,
              locker: currentAddresses.locker,
              team1: currentAddresses.team1,
              team2: currentAddresses.team2,
              dev: currentAddresses.dev
            })}
            className="mb-4 text-sm text-purple-400 hover:text-purple-300 flex items-center transition-colors"
          >
            <CopyIcon className="w-4 h-4 mr-2" />
            📋 Copy Current Addresses
          </button>

          <div className="space-y-4">
            {[
              ['burn', 'Burn Address', 'Tokens burned from fees'],
              ['locker', 'Locker Address', 'Locked liquidity'],
              ['team1', 'Team1 Address', 'Team allocation'],
              ['team2', 'Team2 Address', 'Team allocation'],
              ['dev', 'Dev Address', 'Development fund']
            ].map(([key, label, desc]) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
                <p className="text-xs text-gray-500 mb-2">{desc}</p>
                <input
                  type="text"
                  value={newAddresses[key as keyof FarmUpdateAddresses]}
                  onChange={(e) => setNewAddresses({ ...newAddresses, [key]: e.target.value })}
                  placeholder="0x..."
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm transition-all"
                />
              </div>
            ))}
          </div>

          <button
            onClick={() => setConfirmAction('updateAddresses')}
            disabled={actionLoading || !FarmUtils.haveAddressesChanged(currentAddresses, newAddresses)}
            className="w-full mt-6 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-all shadow-lg shadow-green-500/30 font-medium"
          >
            {actionLoading ? 'Updating...' : 'Update Addresses'}
          </button>
        </div>
      )}

    </div>
  )

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Farm Management
          </h1>
          <p className="text-gray-400 mt-1">Manage your staking pools and farm configuration</p>
        </div>
        <button
          onClick={handleManualRefresh}
          className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/30 text-white rounded-lg transition-all flex items-center space-x-2"
        >
          <RefreshIcon className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center space-x-2">
          <WarningIcon className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-500/10 border border-green-500/20 rounded-lg p-4">
          <p className="text-green-400">{success}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-700/50 mb-6">
        <div className="flex space-x-8">
          {[
            { id: 'overview' as TabType, label: 'Overview', icon: <ChartIcon className="w-4 h-4" /> },
            { id: 'pools' as TabType, label: 'Pools', icon: <DatabaseIcon className="w-4 h-4" /> },
            { id: 'addresses' as TabType, label: 'Addresses', icon: <CopyIcon className="w-4 h-4" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 pb-4 px-2 border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-purple-500 text-purple-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              {tab.icon}
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverviewTab()}
      {activeTab === 'pools' && renderPoolsTab()}
      {activeTab === 'addresses' && renderAddressesTab()}

      {/* Confirmation Modal */}
      {confirmAction && (
        <ConfirmationModal
          action={confirmAction}
          poolInfo={selectedPool}
          farmConfig={farmConfig}
          newAddresses={newAddresses}
          onConfirm={(action) => {
            switch (action) {
              case 'pause':
                handleTransaction(
                  () => FarmService.buildPauseFarmTransaction(),
                  'Farm paused successfully'
                )
                break
              case 'unpause':
                handleTransaction(
                  () => FarmService.buildUnpauseFarmTransaction(),
                  'Farm resumed successfully'
                )
                break
              case 'updateAddresses':
                handleTransaction(
                  () => FarmService.buildUpdateFarmAddressesTransaction(newAddresses),
                  'Addresses updated successfully'
                )
                break
              case 'activate_pool':
                if (selectedPool) {
                  handleTransaction(
                    () => FarmService.buildTogglePoolTransaction(selectedPool.poolType, true),
                    'Pool activated successfully'
                  )
                }
                break
              case 'deactivate_pool':
                if (selectedPool) {
                  handleTransaction(
                    () => FarmService.buildTogglePoolTransaction(selectedPool.poolType, false),
                    'Pool deactivated successfully'
                  )
                }
                break
            }
          }}
          onCancel={() => setConfirmAction(null)}
          loading={actionLoading}
        />
      )}

      {/* Last Update Time */}
      {lastUpdate && (
        <div className="mt-6 text-center text-xs text-gray-500">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      )}
    </div>
  )
}

// Confirmation Modal Component
function ConfirmationModal({ 
  action, 
  poolInfo,
  farmConfig,
  newAddresses, 
  onConfirm, 
  onCancel, 
  loading 
}: {
  action: string
  poolInfo: PoolInfo | null
  farmConfig: FarmConfig | null
  newAddresses: FarmUpdateAddresses
  onConfirm: (action: string) => void
  onCancel: () => void
  loading: boolean
}) {
  const getActionDetails = () => {
    switch (action) {
      case 'pause':
        return {
          title: 'Pause Farm',
          description: 'This will halt all staking and reward distribution for ALL pools in the farm.',
          warning: 'Users will not be able to stake or claim rewards in any pool.',
          buttonText: 'Pause Farm',
          buttonColor: 'bg-yellow-600 hover:bg-yellow-700'
        }
      case 'unpause':
        return {
          title: 'Resume Farm',
          description: 'This will restore normal operations for all pools in the farm.',
          warning: 'Make sure all pools are ready before resuming.',
          buttonText: 'Resume Farm',
          buttonColor: 'bg-green-600 hover:bg-green-700'
        }
      case 'updateAddresses':
        return {
          title: 'Update Fee Addresses',
          description: 'This will change the fee distribution addresses for the entire farm.',
          warning: 'This affects where ALL pool fees are sent. Double-check all addresses.',
          buttonText: 'Update Addresses',
          buttonColor: 'bg-purple-600 hover:bg-purple-700'
        }
      case 'activate_pool':
        return {
          title: 'Activate Pool',
          description: `This will activate the ${poolInfo?.name || 'selected'} pool.`,
          warning: 'Users will be able to stake in this pool.',
          buttonText: 'Activate Pool',
          buttonColor: 'bg-green-600 hover:bg-green-700'
        }
      case 'deactivate_pool':
        return {
          title: 'Deactivate Pool',
          description: `This will deactivate the ${poolInfo?.name || 'selected'} pool.`,
          warning: 'Users will not be able to stake in this pool.',
          buttonText: 'Deactivate Pool',
          buttonColor: 'bg-yellow-600 hover:bg-yellow-700'
        }
      default:
        return {
          title: 'Confirm Action',
          description: 'Are you sure you want to proceed?',
          warning: 'This action may have significant effects.',
          buttonText: 'Confirm',
          buttonColor: 'bg-gray-600 hover:bg-gray-700'
        }
    }
  }

  const details = getActionDetails()

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-white mb-3">{details.title}</h3>
        <p className="text-slate-300 mb-4">{details.description}</p>
        
        {action === 'updateAddresses' && (
          <div className="bg-slate-700/30 rounded-lg p-3 mb-4">
            <div className="text-slate-300 text-sm mb-2">New addresses:</div>
            {Object.entries(newAddresses).map(([key, value]) => (
              <div key={key} className="text-xs font-mono text-slate-400 mb-1">
                {key}: {FarmUtils.formatAddress(value)}
              </div>
            ))}
          </div>
        )}
        
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-4">
          <div className="flex items-center space-x-2">
            <WarningIcon className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-400 text-sm font-medium">Warning</span>
          </div>
          <p className="text-yellow-300 text-sm mt-1">{details.warning}</p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(action)}
            disabled={loading}
            className={`flex-1 ${details.buttonColor} disabled:opacity-50 text-white font-medium px-4 py-2 rounded-lg transition-colors`}
          >
            {loading ? 'Processing...' : details.buttonText}
          </button>
        </div>
      </div>
    </div>
  )
}