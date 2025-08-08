// components/PoolManagement.tsx
import React, { useState, useEffect } from 'react'
import { useWallet } from '@suiet/wallet-kit'
import type { Pool, CreatePoolForm, FarmData } from '../types/pool'
import { EventBasedPoolService } from '../services/eventBasedPoolService'
import { buildCreatePoolTransaction } from '../utils/poolUtils'
import { StatCard } from './StatCard'
import { CreatePoolModal } from './CreatePoolModal'
import { EditPoolModal } from './EditPoolModal'
import { PoolDebugInfo } from './PoolDebugInfo'
import { 
  PoolsIcon, 
  TvlIcon, 
  LpIcon, 
  SingleIcon, 
  WarningIcon, 
  LoadingSpinner,
  EditIcon 
} from './icons'

export default function PoolManagement() {
  const { connected, account, signAndExecuteTransaction } = useWallet()
  const [pools, setPools] = useState<Pool[]>([])
  const [farmData, setFarmData] = useState<FarmData | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingPools, setLoadingPools] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createForm, setCreateForm] = useState<CreatePoolForm>({
    poolType: 'LP',
    token0: '',
    token1: '',
    singleToken: '',
    allocationPoints: 100,
    depositFee: 0,
    withdrawalFee: 0,
    isNativePair: false
  })

  // Fetch farm data and pools using event-based approach
  useEffect(() => {
    if (connected) {
      fetchAllPoolData()
    }
  }, [connected])

  const fetchAllPoolData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Fetching all pool data using event-based approach...')
      
      const { pools: fetchedPools, farmData: fetchedFarmData } = await EventBasedPoolService.getAllPools()
      
      setFarmData(fetchedFarmData)
      setPools(fetchedPools)
      
      console.log('Successfully loaded pools:', fetchedPools)
      console.log('Successfully loaded farm data:', fetchedFarmData)

    } catch (error) {
      console.error('Error fetching pool data:', error)
      setError(`Failed to load pool data: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const refreshPoolData = async () => {
    try {
      setLoadingPools(true)
      await fetchAllPoolData()
    } catch (error) {
      console.error('Error refreshing pool data:', error)
      setError(`Failed to refresh pool data: ${error}`)
    } finally {
      setLoadingPools(false)
    }
  }

  const refreshSinglePool = async (poolTypeName: string) => {
    if (!farmData) return
    
    try {
      setLoadingPools(true)
      const enhancedData = await EventBasedPoolService.fetchIndividualPoolInfo(poolTypeName)
      
      setPools(currentPools => 
        currentPools.map(pool => 
          pool.typeName === poolTypeName ? { ...pool, ...enhancedData } : pool
        )
      )
      
      console.log('Successfully refreshed pool:', poolTypeName, enhancedData)
    } catch (error) {
      console.error('Error refreshing single pool:', error)
    } finally {
      setLoadingPools(false)
    }
  }

  const handleCreatePool = async () => {
    if (!connected || !account) return

    try {
      const moveCallParams = buildCreatePoolTransaction(createForm.poolType, createForm)

      // Execute the transaction
      const result = await signAndExecuteTransaction({
        transaction: moveCallParams
      })

      console.log('Pool created:', result)
      alert(`${createForm.poolType} pool created successfully!`)
      setShowCreateModal(false)
      
      // Refresh pool data after creation
      setTimeout(() => {
        fetchAllPoolData()
      }, 2000) // Wait 2 seconds for the event to be indexed

    } catch (error) {
      console.error('Error creating pool:', error)
      alert('Error creating pool: ' + error)
    }
  }

  const handleUpdatePool = async (pool: Pool) => {
    if (!connected || !account) return

    try {
      // Implementation for updating pool
      console.log('Updating pool:', pool)
      alert('Pool update functionality - to be implemented')
    } catch (error) {
      console.error('Error updating pool:', error)
    }
  }

  const togglePoolStatus = async (pool: Pool) => {
    if (!connected || !account) return

    try {
      // Implementation for toggling pool active status
      const updatedPools = pools.map(p => 
        p.id === pool.id ? { ...p, isActive: !p.isActive } : p
      )
      setPools(updatedPools)
      alert(`Pool ${pool.isActive ? 'deactivated' : 'activated'}`)
    } catch (error) {
      console.error('Error toggling pool status:', error)
    }
  }

  if (!connected) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <WarningIcon className="w-8 h-8 text-red-400" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Wallet Not Connected</h3>
        <p className="text-slate-400">Please connect your wallet to manage pools</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <LoadingSpinner className="w-12 h-12 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Loading Pool Data</h3>
        <p className="text-slate-400">Fetching pool events and farm information from the blockchain...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <WarningIcon className="w-8 h-8 text-red-400" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Error Loading Pools</h3>
        <p className="text-slate-400 mb-4">{error}</p>
        <button
          onClick={fetchAllPoolData}
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
          <h2 className="text-2xl font-bold text-white mb-2">Pool Management</h2>
          <p className="text-slate-400">Create and manage liquidity pools and single asset staking pools</p>
          {farmData && (
            <div className="mt-2 text-sm text-slate-500">
              <span>Total Allocation Points: {farmData.totalAllocationPoints}</span>
              <span className="mx-2">•</span>
              <span>LP: {farmData.totalLpAllocationPoints}</span>
              <span className="mx-2">•</span>
              <span>Single: {farmData.totalSingleAllocationPoints}</span>
              <span className="mx-2">•</span>
              <span className={`${farmData.paused ? 'text-red-400' : 'text-green-400'}`}>
                {farmData.paused ? 'Paused' : 'Active'}
              </span>
              <span className="mx-2">•</span>
              <span className="text-blue-400">Event-Based Data</span>
            </div>
          )}
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
        >
          + Create Pool
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Pools"
          value={pools.length.toString()}
          subtitle="From events"
          icon={<PoolsIcon />}
          color="blue"
        />
        <StatCard
          title="Total Allocation"
          value={farmData?.totalAllocationPoints || '0'}
          subtitle="Allocation points"
          icon={<TvlIcon />}
          color="green"
        />
        <StatCard
          title="LP Pools"
          value={pools.filter(p => p.type === 'LP').length.toString()}
          subtitle="Liquidity pairs"
          icon={<LpIcon />}
          color="purple"
        />
        <StatCard
          title="Single Pools"
          value={pools.filter(p => p.type === 'Single').length.toString()}
          subtitle="Single assets"
          icon={<SingleIcon />}
          color="yellow"
        />
      </div>

      {/* Pool Summary */}
      {pools.length > 0 && (
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-4">
          <h3 className="text-lg font-semibold text-white mb-2">Pool Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-slate-400">Pools with Deposit Fees:</span>
              <span className="text-white ml-2">{pools.filter(p => p.depositFee > 0).length}</span>
            </div>
            <div>
              <span className="text-slate-400">Pools with Withdrawal Fees:</span>
              <span className="text-white ml-2">{pools.filter(p => p.withdrawalFee > 0).length}</span>
            </div>
            <div>
              <span className="text-slate-400">Native Pairs:</span>
              <span className="text-white ml-2">{pools.filter(p => p.isNativePair).length}</span>
            </div>
            <div>
              <span className="text-slate-400">Active Pools:</span>
              <span className="text-white ml-2">{pools.filter(p => p.isActive).length}</span>
            </div>
          </div>
        </div>
      )}

      {/* Pools Table */}
      <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700/30 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-white">Pools (Event-Based Data)</h3>
          <button
            onClick={refreshPoolData}
            className="text-purple-400 hover:text-purple-300 text-sm"
            disabled={loadingPools}
          >
            {loadingPools ? 'Refreshing...' : 'Refresh Events'}
          </button>
        </div>
        
        {loadingPools ? (
          <div className="p-8 text-center">
            <LoadingSpinner className="w-8 h-8 mx-auto mb-4" />
            <p className="text-slate-400">Updating pool data...</p>
          </div>
        ) : pools.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-slate-400">No pools found from events</p>
            <p className="text-slate-500 text-sm mt-2">
              This could mean no PoolCreated events have been emitted yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700/20">
                <tr>
                  <th className="text-left p-4 text-slate-300 font-medium">Pool</th>
                  <th className="text-left p-4 text-slate-300 font-medium">Type</th>
                  <th className="text-left p-4 text-slate-300 font-medium">Total Staked</th>
                  <th className="text-left p-4 text-slate-300 font-medium">Allocation</th>
                 <th className="text-left p-4 text-slate-300 font-medium">Fees</th>
                  <th className="text-left p-4 text-slate-300 font-medium">APY</th>
                  <th className="text-left p-4 text-slate-300 font-medium">Status</th>
                  <th className="text-left p-4 text-slate-300 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pools.map((pool) => (
                  <tr key={pool.id} className="border-t border-slate-700/30 hover:bg-slate-700/20">
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {pool.type === 'LP' ? 'LP' : 'S'}
                        </div>
                        <div>
                          <div className="text-white font-medium">{pool.name}</div>
                          {pool.isNativePair && (
                            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">Native</span>
                          )}
                          <div className="text-xs text-slate-500 font-mono max-w-xs truncate" title={pool.typeName}>
                            {pool.typeName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        pool.type === 'LP' 
                          ? 'bg-blue-500/20 text-blue-400' 
                          : 'bg-purple-500/20 text-purple-400'
                      }`}>
                        {pool.type}
                      </span>
                    </td>
                    <td className="p-4 text-slate-300">{pool.totalStaked}</td>
                    <td className="p-4 text-slate-300">
                      <div className="flex items-center space-x-2">
                        <span>{pool.allocationPoints}</span>
                        {pool.allocationPoints > 0 && (
                          <span className="text-xs bg-yellow-500/20 text-yellow-400 px-1 py-0.5 rounded">
                            {((pool.allocationPoints / Number(farmData?.totalAllocationPoints || 1)) * 100).toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-slate-300">
                      <div className="text-sm">
                        <div className="flex items-center space-x-1">
                          <span>D:</span>
                          <span className={pool.depositFee > 0 ? 'text-orange-400' : 'text-green-400'}>
                            {(pool.depositFee / 100).toFixed(2)}%
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span>W:</span>
                          <span className={pool.withdrawalFee > 0 ? 'text-orange-400' : 'text-green-400'}>
                            {(pool.withdrawalFee / 100).toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-green-400 font-medium">{pool.apy}</td>
                    <td className="p-4">
                      <button
                        onClick={() => togglePoolStatus(pool)}
                        className={`px-3 py-1 rounded text-xs font-medium ${
                          pool.isActive
                            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                            : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                        }`}
                      >
                        {pool.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedPool(pool)
                            setShowEditModal(true)
                          }}
                          className="text-blue-400 hover:text-blue-300 p-1"
                          title="Edit Pool"
                        >
                          <EditIcon />
                        </button>
                        <button
                          onClick={() => refreshSinglePool(pool.typeName)}
                          className="text-purple-400 hover:text-purple-300 p-1"
                          title="Refresh Pool Data"
                          disabled={loadingPools}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pool Creation Events Info */}
      {pools.length > 0 && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
          <div className="flex items-start space-x-2">
            <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-blue-300">
              <div className="font-medium">Event-Based Pool Data</div>
              <div className="text-blue-400/80 mt-1">
                Pool information is fetched from <code>PoolCreated</code> events emitted by the smart contract.
                This ensures accurate fee data and allocation points. Real-time pool state (like total staked) 
                is fetched on-demand.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Pool Modal */}
      {showCreateModal && (
        <CreatePoolModal
          form={createForm}
          setForm={setCreateForm}
          onSubmit={handleCreatePool}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {/* Edit Pool Modal */}
      {showEditModal && selectedPool && (
        <EditPoolModal
          pool={selectedPool}
          onSubmit={handleUpdatePool}
          onClose={() => setShowEditModal(false)}
        />
      )}

      {/* Debug Information */}
      <PoolDebugInfo 
        pools={pools} 
        onRefreshPool={(poolId) => {
          const pool = pools.find(p => p.poolAddress === poolId || p.typeName === poolId)
          if (pool) {
            refreshSinglePool(pool.typeName)
          }
        }} 
      />
    </div>
  )
}