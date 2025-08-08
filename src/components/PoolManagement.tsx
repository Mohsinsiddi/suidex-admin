import React, { useState, useEffect } from 'react'
import { useWallet } from '@suiet/wallet-kit'
import { suiClient } from '../utils/suiClient'
import { CONSTANTS } from '../constants'
import { 
  PoolsIcon, 
  TvlIcon, 
  LpIcon, 
  SingleIcon, 
  WarningIcon, 
  CloseIcon, 
  EditIcon, 
  LoadingSpinner,
  AlertTriangleIcon 
} from '../components/icons'

interface Pool {
  id: string
  name: string
  type: 'LP' | 'Single'
  token0?: string
  token1?: string
  singleToken?: string
  totalStaked: string
  allocationPoints: number
  depositFee: number
  withdrawalFee: number
  isActive: boolean
  isNativePair: boolean
  apy: string
  poolAddress?: string
}

interface CreatePoolForm {
  poolType: 'LP' | 'Single'
  token0: string
  token1: string
  singleToken: string
  allocationPoints: number
  depositFee: number
  withdrawalFee: number
  isNativePair: boolean
}

export default function PoolManagement() {
  const { connected, account, signAndExecuteTransaction } = useWallet()
  const [pools, setPools] = useState<Pool[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
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

  // Fetch pools data from contract
  useEffect(() => {
    if (connected) {
      fetchPoolsData()
    }
  }, [connected])

  const fetchPoolsData = async () => {
    try {
      setLoading(true)
      
      // Get farm object to read pool data
      const farmObject = await suiClient.getObject({
        id: CONSTANTS.FARM_ID,
        options: {
          showContent: true,
          showType: true
        }
      })

      console.log('Farm object:', farmObject)
      
      // For now, show mock data while we implement proper parsing
      const mockPools: Pool[] = [
        {
          id: '1',
          name: 'SUI/USDC LP',
          type: 'LP',
          token0: 'SUI',
          token1: 'USDC',
          totalStaked: '1,234,567.89',
          allocationPoints: 1000,
          depositFee: 0,
          withdrawalFee: 50,
          isActive: true,
          isNativePair: true,
          apy: '45.6%'
        },
        {
          id: '2',
          name: 'VICTORY Single Asset',
          type: 'Single',
          singleToken: 'VICTORY',
          totalStaked: '2,456,789.10',
          allocationPoints: 800,
          depositFee: 0,
          withdrawalFee: 100,
          isActive: true,
          isNativePair: false,
          apy: '32.1%'
        }
      ]
      
      setPools(mockPools)
    } catch (error) {
      console.error('Error fetching pools:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePool = async () => {
    if (!connected || !account) return

    try {
      const { poolType, token0, token1, singleToken, allocationPoints, depositFee, withdrawalFee, isNativePair } = createForm

      const txb = {
        moveCall: (params: any) => {
          console.log('Creating pool with params:', params)
          return params
        }
      }

      let moveCallParams

      if (poolType === 'LP') {
        moveCallParams = {
          target: `${CONSTANTS.PACKAGE_ID}::${CONSTANTS.MODULES.FARM}::create_lp_pool`,
          arguments: [
            CONSTANTS.FARM_ID,
            allocationPoints,
            depositFee,
            withdrawalFee,
            isNativePair,
            CONSTANTS.ADMIN_CAP_ID,
            CONSTANTS.CLOCK_ID
          ],
          typeArguments: [token0, token1]
        }
      } else {
        moveCallParams = {
          target: `${CONSTANTS.PACKAGE_ID}::${CONSTANTS.MODULES.FARM}::create_single_asset_pool`,
          arguments: [
            CONSTANTS.FARM_ID,
            allocationPoints,
            depositFee,
            withdrawalFee,
            isNativePair,
            CONSTANTS.ADMIN_CAP_ID,
            CONSTANTS.CLOCK_ID
          ],
          typeArguments: [singleToken]
        }
      }

      // For demonstration - in real implementation, use signAndExecuteTransaction
      console.log('Would execute transaction with params:', moveCallParams)
      
      // Mock success
      alert(`${poolType} pool would be created successfully!`)
      setShowCreateModal(false)
      fetchPoolsData()

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Pool Management</h2>
          <p className="text-slate-400">Create and manage liquidity pools and single asset staking pools</p>
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
          subtitle="Active pools"
          icon={<PoolsIcon />}
          color="blue"
        />
        <StatCard
          title="Total TVL"
          value="$4.68M"
          subtitle="Across all pools"
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

      {/* Pools Table */}
      <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700/30">
          <h3 className="text-lg font-semibold text-white">Active Pools</h3>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <LoadingSpinner className="w-8 h-8 mx-auto mb-4" />
            <p className="text-slate-400">Loading pools...</p>
          </div>
        ) : pools.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-slate-400">No pools found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700/20">
                <tr>
                  <th className="text-left p-4 text-slate-300 font-medium">Pool</th>
                  <th className="text-left p-4 text-slate-300 font-medium">Type</th>
                  <th className="text-left p-4 text-slate-300 font-medium">TVL</th>
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
                    <td className="p-4 text-slate-300">{pool.allocationPoints}</td>
                    <td className="p-4 text-slate-300">
                      <div className="text-sm">
                        <div>D: {(pool.depositFee / 100).toFixed(2)}%</div>
                        <div>W: {(pool.withdrawalFee / 100).toFixed(2)}%</div>
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
    </div>
  )
}

// Stat Card Component
interface StatCardProps {
  title: string
  value: string
  subtitle: string
  icon: React.ReactNode
  color: 'blue' | 'green' | 'purple' | 'yellow'
}

function StatCard({ title, value, subtitle, icon, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-500/20 text-blue-400',
    green: 'bg-green-500/20 text-green-400',
    purple: 'bg-purple-500/20 text-purple-400',
    yellow: 'bg-yellow-500/20 text-yellow-400'
  }

  return (
    <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          <p className="text-slate-500 text-xs mt-1">{subtitle}</p>
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

// Create Pool Modal
interface CreatePoolModalProps {
  form: CreatePoolForm
  setForm: (form: CreatePoolForm) => void
  onSubmit: () => void
  onClose: () => void
}

function CreatePoolModal({ form, setForm, onSubmit, onClose }: CreatePoolModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Create New Pool</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-white">
              <CloseIcon />
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          {/* Pool Type */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Pool Type</label>
            <div className="flex space-x-4">
              <button
                onClick={() => setForm({...form, poolType: 'LP'})}
                className={`px-4 py-2 rounded-lg border ${
                  form.poolType === 'LP'
                    ? 'border-purple-500 bg-purple-500/20 text-purple-400'
                    : 'border-slate-600 text-slate-400 hover:border-slate-500'
                }`}
              >
                LP Pool
              </button>
              <button
                onClick={() => setForm({...form, poolType: 'Single'})}
                className={`px-4 py-2 rounded-lg border ${
                  form.poolType === 'Single'
                    ? 'border-purple-500 bg-purple-500/20 text-purple-400'
                    : 'border-slate-600 text-slate-400 hover:border-slate-500'
                }`}
              >
                Single Asset
              </button>
            </div>
          </div>

          {/* Token Inputs */}
          {form.poolType === 'LP' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Token 0 Type</label>
                <input
                  type="text"
                  placeholder="0x...::token::TOKEN"
                  value={form.token0}
                  onChange={(e) => setForm({...form, token0: e.target.value})}
                  className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Token 1 Type</label>
                <input
                  type="text"
                  placeholder="0x...::token::TOKEN"
                  value={form.token1}
                  onChange={(e) => setForm({...form, token1: e.target.value})}
                  className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
                />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Token Type</label>
              <input
                type="text"
                placeholder="0x...::token::TOKEN"
                value={form.singleToken}
                onChange={(e) => setForm({...form, singleToken: e.target.value})}
                className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
              />
            </div>
          )}

          {/* Allocation Points */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Allocation Points</label>
            <input
              type="number"
              value={form.allocationPoints}
              onChange={(e) => setForm({...form, allocationPoints: parseInt(e.target.value) || 0})}
              className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Fees */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Deposit Fee (BP)</label>
              <input
                type="number"
                value={form.depositFee}
                onChange={(e) => setForm({...form, depositFee: parseInt(e.target.value) || 0})}
                className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Withdrawal Fee (BP)</label>
              <input
                type="number"
                value={form.withdrawalFee}
                onChange={(e) => setForm({...form, withdrawalFee: parseInt(e.target.value) || 0})}
                className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Native Pair */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isNativePair"
              checked={form.isNativePair}
              onChange={(e) => setForm({...form, isNativePair: e.target.checked})}
              className="w-4 h-4 text-purple-600 bg-slate-900 border-slate-600 rounded focus:ring-purple-500"
            />
            <label htmlFor="isNativePair" className="text-sm font-medium text-slate-300">
              Native Pair
            </label>
          </div>
        </div>

        <div className="p-6 border-t border-slate-700 flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700/50"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-4 py-2 rounded-lg"
          >
            Create Pool
          </button>
        </div>
      </div>
    </div>
  )
}

// Edit Pool Modal Component
interface EditPoolModalProps {
  pool: Pool
  onSubmit: (pool: Pool) => void
  onClose: () => void
}

function EditPoolModal({ pool, onSubmit, onClose }: EditPoolModalProps) {
  const [editForm, setEditForm] = useState({
    allocationPoints: pool.allocationPoints,
    depositFee: pool.depositFee,
    withdrawalFee: pool.withdrawalFee,
    isActive: pool.isActive
  })

  const handleSubmit = () => {
    const updatedPool = {
      ...pool,
      ...editForm
    }
    onSubmit(updatedPool)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-md w-full">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Edit Pool: {pool.name}</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-white">
              <CloseIcon />
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          {/* Pool Info (Read-only) */}
          <div className="bg-slate-900/50 p-4 rounded-lg">
            <div className="text-sm text-slate-400 mb-2">Pool Information</div>
            <div className="text-white font-medium">{pool.name}</div>
            <div className="text-slate-300 text-sm">Type: {pool.type}</div>
            <div className="text-slate-300 text-sm">TVL: {pool.totalStaked}</div>
          </div>

          {/* Allocation Points */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Allocation Points
              <span className="text-slate-500 ml-1">(Current: {pool.allocationPoints})</span>
            </label>
            <input
              type="number"
              value={editForm.allocationPoints}
              onChange={(e) => setEditForm({...editForm, allocationPoints: parseInt(e.target.value) || 0})}
              className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Fees */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Deposit Fee (BP)
                <span className="text-slate-500 block text-xs">Current: {pool.depositFee}</span>
              </label>
              <input
                type="number"
                value={editForm.depositFee}
                onChange={(e) => setEditForm({...editForm, depositFee: parseInt(e.target.value) || 0})}
                className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Withdrawal Fee (BP)
                <span className="text-slate-500 block text-xs">Current: {pool.withdrawalFee}</span>
              </label>
              <input
                type="number"
                value={editForm.withdrawalFee}
                onChange={(e) => setEditForm({...editForm, withdrawalFee: parseInt(e.target.value) || 0})}
                className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="editIsActive"
              checked={editForm.isActive}
              onChange={(e) => setEditForm({...editForm, isActive: e.target.checked})}
              className="w-4 h-4 text-purple-600 bg-slate-900 border-slate-600 rounded focus:ring-purple-500"
            />
            <label htmlFor="editIsActive" className="text-sm font-medium text-slate-300">
              Pool Active
            </label>
          </div>

          {/* Warning */}
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <AlertTriangleIcon className="w-4 h-4 text-yellow-400 mt-0.5" />
              <div className="text-sm text-yellow-300">
                <div className="font-medium">Warning</div>
                <div className="text-yellow-400/80">Changing pool parameters will affect all stakers. Make sure to communicate changes to users.</div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-700 flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700/50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-4 py-2 rounded-lg"
          >
            Update Pool
          </button>
        </div>
      </div>
    </div>
  )
}

// Additional utility functions for the Pool Management component

// Function to format large numbers
export const formatNumber = (num: string | number): string => {
  const n = typeof num === 'string' ? parseFloat(num.replace(/,/g, '')) : num
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B'
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(2) + 'K'
  return n.toFixed(2)
}

// Function to validate token type format
export const validateTokenType = (tokenType: string): boolean => {
  const pattern = /^0x[a-f0-9]+::[a-zA-Z_][a-zA-Z0-9_]*::[a-zA-Z_][a-zA-Z0-9_]*$/
  return pattern.test(tokenType)
}

// Function to calculate fee percentage from basis points
export const bpToPercentage = (bp: number): string => {
  return (bp / 100).toFixed(2) + '%'
}

// Function to validate fee ranges (max 10% = 1000 bp)
export const validateFee = (fee: number): boolean => {
  return fee >= 0 && fee <= 1000
}

// Pool status helper functions
export const getPoolStatusColor = (isActive: boolean): string => {
  return isActive 
    ? 'bg-green-500/20 text-green-400' 
    : 'bg-red-500/20 text-red-400'
}

export const getPoolTypeColor = (type: 'LP' | 'Single'): string => {
  return type === 'LP' 
    ? 'bg-blue-500/20 text-blue-400' 
    : 'bg-purple-500/20 text-purple-400'
}

// Contract interaction helpers
export const buildCreatePoolTransaction = (
  poolType: 'LP' | 'Single',
  params: CreatePoolForm
) => {
  const { token0, token1, singleToken, allocationPoints, depositFee, withdrawalFee, isNativePair } = params

  if (poolType === 'LP') {
    return {
      target: `${CONSTANTS.PACKAGE_ID}::${CONSTANTS.MODULES.FARM}::create_lp_pool`,
      arguments: [
        CONSTANTS.FARM_ID,
        allocationPoints.toString(),
        depositFee.toString(),
        withdrawalFee.toString(),
        isNativePair,
        CONSTANTS.ADMIN_CAP_ID,
        CONSTANTS.CLOCK_ID
      ],
      typeArguments: [token0, token1]
    }
  } else {
    return {
      target: `${CONSTANTS.PACKAGE_ID}::${CONSTANTS.MODULES.FARM}::create_single_asset_pool`,
      arguments: [
        CONSTANTS.FARM_ID,
        allocationPoints.toString(),
        depositFee.toString(),
        withdrawalFee.toString(),
        isNativePair,
        CONSTANTS.ADMIN_CAP_ID,
        CONSTANTS.CLOCK_ID
      ],
      typeArguments: [singleToken]
    }
  }
}

export const buildUpdatePoolTransaction = (pool: Pool, newParams: any) => {
  return {
    target: `${CONSTANTS.PACKAGE_ID}::${CONSTANTS.MODULES.FARM}::update_pool_config`,
    arguments: [
      CONSTANTS.FARM_ID,
      newParams.allocationPoints.toString(),
      newParams.depositFee.toString(),
      newParams.withdrawalFee.toString(),
      newParams.isActive,
      CONSTANTS.ADMIN_CAP_ID,
      CONSTANTS.GLOBAL_EMISSION_CONTROLLER_ID,
      CONSTANTS.CLOCK_ID
    ],
    typeArguments: [pool.type === 'LP' ? [pool.token0, pool.token1] : [pool.singleToken]]
  }
}