// components/tokenlocker/TokenLockerTab.tsx - REFACTORED MAIN CONTAINER
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useWallet } from '@suiet/wallet-kit'
import { useAuth } from '../../contexts/AuthContext'
import { TokenLockerService } from '../../services/tokenLockerService'
import { CONSTANTS } from '../../constants'
import { Eye, Wrench, Zap, Calendar, RefreshCw, AlertTriangle } from 'lucide-react'

// Import sub-components
import SystemMonitor from './SystemMonitor'
import AdminPanel from './AdminPanel'
import EpochManager from './EpochManager'
import EpochHistory from './EpochHistory'
import TransactionModal from './TransactionModal'

export default function TokenLockerTab() {
  const [activeTab, setActiveTab] = useState<'monitor' | 'admin' | 'epoch' | 'epochDetails'>('monitor')
  
  // Core data states
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loadingStates, setLoadingStates] = useState({
    dashboard: true,
    events: true
  })
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  // Form states for admin operations
  const [victoryAllocations, setVictoryAllocations] = useState({
    week: 200, threeMonth: 800, year: 2500, threeYear: 6500
  })
  const [suiAllocations, setSuiAllocations] = useState({
    week: 1000, threeMonth: 2000, year: 3000, threeYear: 4000
  })
  const [revenueAmount, setRevenueAmount] = useState('')
  const [victoryDepositAmount, setVictoryDepositAmount] = useState('')
  
  // Lock creation states
  const [singleLock, setSingleLock] = useState({
    userAddress: '',
    amount: '',
    lockPeriod: 90
  })
  const [batchLocks, setBatchLocks] = useState<any[]>([])

  // Transaction modal state
  const [confirmAction, setConfirmAction] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const { connected, account, signAndExecuteTransaction } = useWallet()
  const { authMethod } = useAuth()

  const canPerformAction = useMemo(() => 
    connected && (authMethod === 'secret' || account?.address === CONSTANTS.ADMIN),
    [connected, authMethod, account?.address]
  )

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    try {
      setError(null)
      setLoadingStates(prev => ({ ...prev, dashboard: true }))
      
      const data = await TokenLockerService.fetchAdminDashboardData()
      setDashboardData(data)
      
      // Update form states with current allocations
      if (data.config) {
        setVictoryAllocations(data.config.allocations.victory)
        setSuiAllocations(data.config.allocations.sui)
      }
      
      setLastUpdate(new Date())
    } catch (err) {
      console.error('Error loading dashboard data:', err)
      setError('Failed to load token locker data')
    } finally {
      setLoadingStates(prev => ({ ...prev, dashboard: false }))
    }
  }, [])

  // Initial load
  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  // Handle transaction execution
  const handleTransaction = async (
    txBuilder: () => any,
    action: string,
    onSuccess?: () => void
  ) => {
    if (!connected || !account) {
      alert('Please connect your wallet')
      return
    }

    try {
      setActionLoading(true)
      const tx = txBuilder()
      
      const result = await signAndExecuteTransaction({
        transaction: tx,
        options: {
          showEffects: true,
          showEvents: true
        }
      })

      if (result?.effects?.status?.status === 'success') {
        alert(`${action} successful!`)
        onSuccess?.()
        loadDashboardData()
        setConfirmAction(null)
      } else {
        throw new Error('Transaction failed')
      }
    } catch (error) {
      console.error(`Error ${action}:`, error)
      alert(`Error ${action}: ${TokenLockerService.getTokenLockerOperationErrorMessage(error)}`)
    } finally {
      setActionLoading(false)
    }
  }

  // Handle confirmation actions
  const handleConfirmAction = useCallback((action: string) => {
    switch (action) {
      case 'depositVictory':
        handleTransaction(
          () => TokenLockerService.buildDepositVictoryTokensTransaction(victoryDepositAmount),
          'Deposit Victory tokens',
          () => setVictoryDepositAmount('')
        )
        break
      case 'updateVictoryAllocations':
        handleTransaction(
          () => TokenLockerService.buildConfigureVictoryAllocationsTransaction(victoryAllocations),
          'Update Victory allocations'
        )
        break
      case 'updateSUIAllocations':
        handleTransaction(
          () => TokenLockerService.buildConfigureSUIAllocationsTransaction(suiAllocations),
          'Update SUI allocations'
        )
        break
      case 'addWeeklyRevenue':
        handleTransaction(
          () => TokenLockerService.buildAddWeeklySUIRevenueTransaction(revenueAmount),
          'Add weekly SUI revenue',
          () => setRevenueAmount('')
        )
        break
      case 'createSingleLock':
        handleTransaction(
          () => TokenLockerService.buildCreateUserLockTransaction(
            singleLock.userAddress,
            singleLock.amount,
            singleLock.lockPeriod
          ),
          'Create user lock',
          () => setSingleLock({ userAddress: '', amount: '', lockPeriod: 90 })
        )
        break
      case 'createBatchLocks':
        handleTransaction(
          () => TokenLockerService.buildBatchCreateUserLocksTransaction(batchLocks),
          'Create batch locks',
          () => setBatchLocks([])
        )
        break
    }
  }, [victoryDepositAmount, victoryAllocations, suiAllocations, revenueAmount, singleLock, batchLocks])

  // Copy to clipboard utility
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  // Show loading error state
  if (error && !dashboardData) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <span className="text-red-400 font-medium">Error loading token locker data</span>
        </div>
        <p className="text-red-300 mt-2">{error}</p>
        <button
          onClick={loadDashboardData}
          className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">Token Locker Control</h2>
          <p className="text-slate-400 mt-1">Manage token locks, rewards, and SUI revenue distribution</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={loadDashboardData}
            disabled={loadingStates.dashboard}
            className="flex items-center space-x-2 bg-slate-700/50 hover:bg-slate-700/70 text-slate-300 hover:text-white px-3 py-2 rounded-lg transition-all duration-200 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loadingStates.dashboard ? 'animate-spin' : ''}`} />
            <span className="text-sm">Refresh</span>
          </button>

          {lastUpdate && (
            <div className="text-xs text-slate-500">
              Last update: {lastUpdate.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-1">
        {[
          { id: 'monitor', label: 'Monitor', icon: Eye },
          { id: 'admin', label: 'Admin Controls', icon: Wrench },
          { id: 'epoch', label: 'Epoch & SUI Distribution', icon: Zap },
          { id: 'epochDetails', label: 'Epoch Details', icon: Calendar }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              activeTab === id
                ? 'bg-purple-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'monitor' && (
        <SystemMonitor
          dashboardData={dashboardData}
          loadingStates={loadingStates}
          onRefresh={loadDashboardData}
        />
      )}

      {activeTab === 'admin' && (
        <AdminPanel
          dashboardData={dashboardData}
          loadingStates={loadingStates}
          canPerformAction={canPerformAction}
          victoryAllocations={victoryAllocations}
          setVictoryAllocations={setVictoryAllocations}
          suiAllocations={suiAllocations}
          setSuiAllocations={setSuiAllocations}
          victoryDepositAmount={victoryDepositAmount}
          setVictoryDepositAmount={setVictoryDepositAmount}
          onConfirmAction={setConfirmAction}
          actionLoading={actionLoading}
        />
      )}

      {activeTab === 'epoch' && (
        <EpochManager
          dashboardData={dashboardData}
          loadingStates={loadingStates}
          canPerformAction={canPerformAction}
          revenueAmount={revenueAmount}
          setRevenueAmount={setRevenueAmount}
          onConfirmAction={setConfirmAction}
          onRefresh={loadDashboardData}
          actionLoading={actionLoading}
        />
      )}

      {activeTab === 'epochDetails' && (
        <EpochHistory
          dashboardData={dashboardData}
          loadingStates={loadingStates}
          onRefresh={loadDashboardData}
        />
      )}

      {/* Transaction Confirmation Modal */}
      {confirmAction && (
        <TransactionModal
          action={confirmAction}
          dashboardData={dashboardData}
          victoryAllocations={victoryAllocations}
          suiAllocations={suiAllocations}
          revenueAmount={revenueAmount}
          victoryDepositAmount={victoryDepositAmount}
          singleLock={singleLock}
          batchLocks={batchLocks}
          onConfirm={handleConfirmAction}
          onCancel={() => setConfirmAction(null)}
          loading={actionLoading}
        />
      )}
    </div>
  )
}