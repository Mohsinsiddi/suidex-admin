// components/EmissionManagement.tsx
import React, { useState, useEffect, useCallback } from 'react'
import { useWallet } from '@suiet/wallet-kit'
import { useAuth } from '../contexts/AuthContext'
import { EmissionService, type EmissionOverview } from '../services/emissionService'
import { 
  formatDuration, 
  formatLargeNumber, 
  validateWeekNumber, 
  validateTimingAdjustment,
  EMISSION_PHASES,
} from '../utils/emissionUtils'
import { CONSTANTS } from '../constants'

// Icons
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

function ResetIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
    </svg>
  )
}

function ClockIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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

function WarningIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  )
}

function ActivityIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  )
}

type TabType = 'overview' | 'controls' | 'schedule' | 'monitoring'

export default function EmissionManagement() {
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [emissionData, setEmissionData] = useState<EmissionOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const { connected, account, signAndExecuteTransaction } = useWallet()
  const { authMethod } = useAuth()

  // Load emission data
  const loadEmissionData = useCallback(async () => {
    try {
      setError(null)
      const data = await EmissionService.fetchEmissionOverview()
      setEmissionData(data)
      setLastUpdate(new Date())
    } catch (err) {
      console.error('Error loading emission data:', err)
      setError('Failed to load emission data')
    } finally {
      setLoading(false)
    }
  }, [])

  // Auto-refresh setup
  useEffect(() => {
    loadEmissionData()
    
    let interval: NodeJS.Timeout | null = null
    if (autoRefresh) {
      interval = setInterval(loadEmissionData, 30000) // Refresh every 30 seconds
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [loadEmissionData, autoRefresh])

  // Manual refresh
  const handleRefresh = () => {
    setLoading(true)
    loadEmissionData()
  }

  if (loading && !emissionData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  if (error && !emissionData) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
        <div className="flex items-center space-x-2">
          <WarningIcon className="w-5 h-5 text-red-400" />
          <span className="text-red-400 font-medium">Error loading emission data</span>
        </div>
        <p className="text-red-300 mt-2">{error}</p>
        <button
          onClick={handleRefresh}
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
          <h2 className="text-3xl font-bold text-white">Emission Management</h2>
          <p className="text-slate-400 mt-1">Monitor and control Victory token emissions</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Auto-refresh toggle */}
          <label className="flex items-center space-x-2">
            <span className="text-slate-300 text-sm">Auto-refresh</span>
            <div className={`w-10 h-5 rounded-full relative transition-colors ${autoRefresh ? 'bg-green-500' : 'bg-slate-600'}`}>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${autoRefresh ? 'translate-x-5' : 'translate-x-0.5'}`}
              />
            </div>
          </label>

          {/* Manual refresh */}
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center space-x-2 bg-slate-700/50 hover:bg-slate-700/70 text-slate-300 hover:text-white px-3 py-2 rounded-lg transition-all duration-200 disabled:opacity-50"
          >
            <RefreshIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="text-sm">Refresh</span>
          </button>

          {/* Last update */}
          {lastUpdate && (
            <div className="text-xs text-slate-500">
              Last update: {lastUpdate.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>

      {/* Status Banner */}
      {emissionData && (
        <StatusBanner data={emissionData} />
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-slate-700/30">
        <nav className="flex space-x-8">
          <TabButton
            active={activeTab === 'overview'}
            onClick={() => setActiveTab('overview')}
            icon={<ChartIcon />}
            label="Overview"
          />
          <TabButton
            active={activeTab === 'controls'}
            onClick={() => setActiveTab('controls')}
            icon={<PauseIcon />}
            label="Controls"
          />
          <TabButton
            active={activeTab === 'schedule'}
            onClick={() => setActiveTab('schedule')}
            icon={<ClockIcon />}
            label="Schedule"
          />
          <TabButton
            active={activeTab === 'monitoring'}
            onClick={() => setActiveTab('monitoring')}
            icon={<ActivityIcon />}
            label="Monitoring"
          />
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {emissionData && (
          <>
            {activeTab === 'overview' && <OverviewTab data={emissionData} />}
            {activeTab === 'controls' && (
              <ControlsTab 
                data={emissionData} 
                onRefresh={loadEmissionData}
                connected={connected}
                account={account}
                signAndExecuteTransaction={signAndExecuteTransaction}
                authMethod={authMethod}
              />
            )}
            {activeTab === 'schedule' && <ScheduleTab data={emissionData} />}
            {activeTab === 'monitoring' && <MonitoringTab data={emissionData} />}
          </>
        )}
      </div>
    </div>
  )
}

// Tab Button Component
function TabButton({ active, onClick, icon, label }: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center space-x-2 pb-4 px-1 border-b-2 transition-all duration-200 ${
        active
          ? 'border-purple-500 text-purple-400'
          : 'border-transparent text-slate-400 hover:text-slate-300'
      }`}
    >
      <div className="w-4 h-4">{icon}</div>
      <span className="font-medium">{label}</span>
    </button>
  )
}

// Status Banner Component
function StatusBanner({ data }: { data: EmissionOverview }) {
  const { status, systemStatus } = data
  
  const getStatusColor = () => {
    if (systemStatus.paused) return 'border-yellow-500/30 bg-yellow-500/10'
    if (!systemStatus.isActive) return 'border-red-500/30 bg-red-500/10'
    return 'border-green-500/30 bg-green-500/10'
  }

  const getStatusText = () => {
    if (systemStatus.paused) return 'PAUSED'
    if (!systemStatus.isActive) return 'INACTIVE'
    return 'ACTIVE'
  }

  const getStatusIcon = () => {
    if (systemStatus.paused) return <PauseIcon className="w-5 h-5 text-yellow-400" />
    if (!systemStatus.isActive) return <WarningIcon className="w-5 h-5 text-red-400" />
    return <PlayIcon className="w-5 h-5 text-green-400" />
  }

  return (
    <div className={`border rounded-xl p-6 ${getStatusColor()}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {getStatusIcon()}
          <div>
            <div className="flex items-center space-x-3">
              <span className="text-white font-bold text-lg">Emission System: {getStatusText()}</span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                status.currentPhase === 1 ? 'bg-green-500/20 text-green-400' :
                status.currentPhase === 2 ? 'bg-blue-500/20 text-blue-400' :
                'bg-gray-500/20 text-gray-400'
              }`}>
                {status.phaseName}
              </span>
            </div>
            <div className="text-slate-300 mt-1">
              Week {status.currentWeek} of 156 • {status.weekProgress}% complete
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-white font-semibold">
            {formatDuration(status.remainingTimeInWeek)} remaining
          </div>
          <div className="text-slate-400 text-sm">
            in current week
          </div>
        </div>
      </div>
    </div>
  )
}

// Metric Card Component
function MetricCard({ title, value, subtitle, color }: {
  title: string
  value: string
  subtitle: string
  color: string
}) {
  return (
    <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
      <div className="text-slate-400 text-sm">{title}</div>
      <div className={`text-2xl font-bold mt-1 ${color}`}>{value}</div>
      <div className="text-slate-400 text-sm mt-1">{subtitle}</div>
    </div>
  )
}

// Allocation Card Component
function AllocationCard({ title, rate, percentage, color }: {
  title: string
  rate: string
  percentage: number
  color: string
}) {
  return (
    <div className="text-center">
      <div className="text-slate-400 text-sm">{title}</div>
      <div className="text-xl font-bold text-white mt-1">{rate} VICTORY/sec</div>
      <div className="text-slate-400 text-sm">{percentage}%</div>
      <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
        <div 
          className={`${color} h-2 rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

// Phase Card Component
function PhaseCard({ phase, isActive }: {
  phase: any
  isActive: boolean
}) {
  return (
    <div className={`border rounded-xl p-4 ${isActive ? 'border-purple-500/50 bg-purple-500/10' : 'border-slate-700/30 bg-slate-800/30'}`}>
      <div className="flex items-center space-x-2 mb-2">
        <div className={`w-3 h-3 rounded-full ${phase.color}`} />
        <h4 className="text-white font-medium">{phase.name}</h4>
        {isActive && <span className="text-xs bg-purple-500 text-white px-2 py-1 rounded">Current</span>}
      </div>
      <p className="text-slate-400 text-sm mb-3">{phase.description}</p>
      <div className="space-y-1">
        <div className="text-xs text-slate-500">Week Range: {phase.weekRange}</div>
        <div className="text-xs text-slate-500">Base Rate: {phase.baseRate}</div>
      </div>
    </div>
  )
}

// Overview Tab Component
function OverviewTab({ data }: { data: EmissionOverview }) {
  const { status, rates, metrics } = data

  console.log('Rendering OverviewTab with data:', data)

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Current Week"
          value={`${status.currentWeek} / 156`}
          subtitle={`${status.phaseName} Phase`}
          color="text-purple-400"
        />
        <MetricCard
          title="Total Emission Rate"
          value={`${rates.totalPerSecond} VICTORY/sec`}
          subtitle={`${formatLargeNumber(parseFloat(rates.totalPerSecond) * 86400)} per day`}
          color="text-green-400"
        />
        <MetricCard
        title="Emitted So Far"
        value={data.metrics.formattedEmitted || '0.00'}  // ✅ Uses "1.27M"
        subtitle="VICTORY tokens"
        color="text-blue-400"
        />

        <MetricCard
        title="Remaining"
        value={data.metrics.formattedRemaining || '0.00'}  // ✅ Uses "274.99M"
        subtitle="VICTORY tokens"
        color="text-yellow-400"
        />
      </div>

      {/* Allocation Breakdown */}
      <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Current Week Allocation</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <AllocationCard
            title="LP Farming"
            rate={rates.lpPerSecond}
            percentage={rates.lpPercent}
            color="bg-green-500"
          />
          <AllocationCard
            title="Single Asset"
            rate={rates.singlePerSecond}
            percentage={rates.singlePercent}
            color="bg-blue-500"
          />
          <AllocationCard
            title="Victory Staking"
            rate={rates.victoryStakingPerSecond}
            percentage={rates.victoryStakingPercent}
            color="bg-purple-500"
          />
          <AllocationCard
            title="Development"
            rate={rates.devPerSecond}
            percentage={rates.devPercent}
            color="bg-orange-500"
          />
        </div>
      </div>

      {/* Phase Information */}
      <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Phase Information</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {EMISSION_PHASES.slice(1).map((phase) => (
            <PhaseCard
              key={phase.phase}
              phase={phase}
              isActive={status.currentPhase === phase.phase}
            />
          ))}
        </div>
      </div>

      {/* Progress Timeline */}
      {data.nextPhaseInfo && (
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Next Phase Transition</h3>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white font-medium">
                {data.nextPhaseInfo.name}
              </div>
              <div className="text-slate-400 text-sm">
                Starting at week {data.nextPhaseInfo.atWeek}
              </div>
            </div>
            <div className="text-right">
              <div className="text-purple-400 font-semibold">
                {data.nextPhaseInfo.weeksUntil} weeks remaining
              </div>
              <div className="text-slate-400 text-sm">
                {formatDuration(data.nextPhaseInfo.weeksUntil * 604800)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Controls Tab Component
function ControlsTab({ 
  data, 
  onRefresh, 
  connected, 
  account, 
  signAndExecuteTransaction, 
  authMethod 
}: {
  data: EmissionOverview
  onRefresh: () => void
  connected: boolean
  account: any
  signAndExecuteTransaction: any
  authMethod: string
}) {
  const [loading, setLoading] = useState(false)
  const [resetWeek, setResetWeek] = useState('')
  const [adjustHours, setAdjustHours] = useState('')
  const [adjustDirection, setAdjustDirection] = useState<'subtract' | 'add'>('subtract')
  const [confirmAction, setConfirmAction] = useState<string | null>(null)

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
      setLoading(true)
      const tx = txBuilder()
      
      const result = await signAndExecuteTransaction({
        transaction: tx,
        options: {
          showEffects: true,
          showEvents: true
        }
      })

      if (result?.digest) {
        alert(`${action} successful!`)
        onSuccess?.()
        onRefresh()
        setConfirmAction(null)
      } else {
        throw new Error('Transaction failed')
      }
    } catch (error) {
      console.error(`Error ${action}:`, error)
      alert(`Error ${action}: ${EmissionService.getEmissionOperationErrorMessage(error)}`)
    } finally {
      setLoading(false)
    }
  }


  const canPerformAction = connected && (
  account?.address === CONSTANTS.ADMIN
)

  return (
    <div className="space-y-6">
      {/* System Status */}
      <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">System Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{data.status.currentWeek}</div>
            <div className="text-slate-400">Current Week</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${data.systemStatus.paused ? 'text-yellow-400' : 'text-green-400'}`}>
              {data.systemStatus.paused ? 'PAUSED' : 'ACTIVE'}
            </div>
            <div className="text-slate-400">System Status</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{data.systemStatus.weeksRemaining}</div>
            <div className="text-slate-400">Weeks Remaining</div>
          </div>
        </div>
      </div>

      {/* Emergency Controls */}
      <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Emergency Controls</h3>
        {!canPerformAction && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-2">
              <WarningIcon className="w-5 h-5 text-yellow-400" />
              <span className="text-yellow-400 font-medium">
                Admin authentication required for control operations
              </span>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.systemStatus.paused ? (
            <button
              onClick={() => setConfirmAction('unpause')}
              disabled={!canPerformAction || loading}
              className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200"
            >
              <PlayIcon className="w-5 h-5" />
              <span>Resume Emissions</span>
            </button>
          ) : (
            <button
              onClick={() => setConfirmAction('pause')}
              disabled={!canPerformAction || loading}
              className="flex items-center justify-center space-x-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200"
            >
              <PauseIcon className="w-5 h-5" />
              <span>Pause Emissions</span>
            </button>
          )}
          
          {data.status.emissionStartTimestamp === 0 && (
            <button
              onClick={() => setConfirmAction('initialize')}
              disabled={!canPerformAction || loading}
              className="flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200"
            >
              <PlayIcon className="w-5 h-5" />
              <span>Initialize Emissions</span>
            </button>
          )}
        </div>
      </div>

      {/* Recovery Controls */}
      <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Recovery Controls</h3>
        <div className="space-y-6">
          {/* Reset to Week */}
          <div>
            <label className="block text-slate-300 font-medium mb-2">Reset to Specific Week</label>
            <div className="flex space-x-3">
              <input
                type="number"
                min="1"
                max="156"
                value={resetWeek}
                onChange={(e) => setResetWeek(e.target.value)}
                placeholder="Week number (1-156)"
                disabled={!data.systemStatus.paused}
                className="flex-1 bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:border-purple-500 focus:outline-none disabled:opacity-50"
              />
              <button
                onClick={() => {
                  const validation = validateWeekNumber(parseInt(resetWeek))
                  if (!validation.isValid) {
                    alert(validation.error)
                    return
                  }
                  setConfirmAction('reset')
                }}
                disabled={!canPerformAction || !data.systemStatus.paused || !resetWeek || loading}
                className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:opacity-50 text-white font-semibold px-6 py-2 rounded-lg transition-all duration-200"
              >
                Reset
              </button>
            </div>
            {!data.systemStatus.paused && (
              <p className="text-yellow-400 text-sm mt-1">System must be paused to reset week</p>
            )}
          </div>

          {/* Timing Adjustment */}
          <div>
            <label className="block text-slate-300 font-medium mb-2">Fine-tune Timing</label>
            <div className="flex space-x-3">
              <select
                value={adjustDirection}
                onChange={(e) => setAdjustDirection(e.target.value as 'subtract' | 'add')}
                disabled={!data.systemStatus.paused}
                className="bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-none disabled:opacity-50"
              >
                <option value="subtract">Go back</option>
                <option value="add">Go forward</option>
              </select>
              <input
                type="number"
                min="1"
                max="168"
                value={adjustHours}
                onChange={(e) => setAdjustHours(e.target.value)}
                placeholder="Hours (1-168)"
                disabled={!data.systemStatus.paused}
                className="flex-1 bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:border-purple-500 focus:outline-none disabled:opacity-50"
              />
              <button
                onClick={() => {
                  const validation = validateTimingAdjustment(parseInt(adjustHours))
                  if (!validation.isValid) {
                    alert(validation.error)
                    return
                  }
                  setConfirmAction('adjust')
                }}
                disabled={!canPerformAction || !data.systemStatus.paused || !adjustHours || loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:opacity-50 text-white font-semibold px-6 py-2 rounded-lg transition-all duration-200"
              >
                Adjust
              </button>
            </div>
            {!data.systemStatus.paused && (
              <p className="text-yellow-400 text-sm mt-1">System must be paused to adjust timing</p>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmAction && (
        <ConfirmationModal
          action={confirmAction}
          data={{ resetWeek, adjustHours, adjustDirection }}
          onConfirm={(action) => {
            switch (action) {
              case 'pause':
                handleTransaction(() => EmissionService.buildPauseSystemTransaction(), 'pausing system')
                break
              case 'unpause':
                handleTransaction(() => EmissionService.buildUnpauseSystemTransaction(), 'resuming system')
                break
              case 'initialize':
                handleTransaction(() => EmissionService.buildInitializeEmissionTransaction(), 'initializing emissions')
                break
              case 'reset':
                handleTransaction(() => EmissionService.buildResetToWeekTransaction(parseInt(resetWeek)), 'resetting week')
                break
              case 'adjust':
                handleTransaction(() => EmissionService.buildAdjustTimingTransaction(parseInt(adjustHours), adjustDirection === 'subtract'), 'adjusting timing')
                break
            }
          }}
          onCancel={() => setConfirmAction(null)}
          loading={loading}
        />
      )}
    </div>
  )
}

// Schedule Tab Component
function ScheduleTab({ data }: { data: EmissionOverview }) {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  
  const weeklyData = EmissionService.getWeeklyBreakdownForTable(
    data.status.emissionStartTimestamp,
    data.status.currentTimestamp,
    currentPage,
    pageSize
  )

  return (
    <div className="space-y-6">
      {/* Schedule Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Progress Overview</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-300">Completed Weeks</span>
              <span className="text-green-400">{Math.max(0, data.status.currentWeek - 1)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Current Week</span>
              <span className="text-blue-400">{data.status.currentWeek}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Remaining Weeks</span>
              <span className="text-yellow-400">{data.systemStatus.weeksRemaining}</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2 mt-4">
              <div 
                className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(data.status.currentWeek / 156) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Current Week</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-300">Week Progress</span>
              <span className="text-purple-400">{data.status.weekProgress}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Time Remaining</span>
              <span className="text-orange-400">{formatDuration(data.status.remainingTimeInWeek)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Phase</span>
              <span className="text-white">{data.status.phaseName}</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2 mt-4">
              <div 
                className="bg-gradient-to-r from-purple-500 to-orange-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${data.status.weekProgress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Emission Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-300">Total Emitted</span>
              <span className="text-green-400">{formatLargeNumber(data.metrics.totalEmittedSoFar)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Remaining</span>
              <span className="text-blue-400">{formatLargeNumber(data.metrics.remainingEmissions)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Current Rate</span>
              <span className="text-purple-400">{data.rates.totalPerSecond}/sec</span>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Schedule Table */}
      <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-slate-700/30">
          <h3 className="text-lg font-semibold text-white">Weekly Emission Schedule</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/30">
              <tr>
                <th className="text-left p-4 text-slate-300 font-medium">Week</th>
                <th className="text-left p-4 text-slate-300 font-medium">Phase</th>
                <th className="text-left p-4 text-slate-300 font-medium">Rate/sec</th>
                <th className="text-left p-4 text-slate-300 font-medium">LP</th>
                <th className="text-left p-4 text-slate-300 font-medium">Single</th>
                <th className="text-left p-4 text-slate-300 font-medium">Victory</th>
                <th className="text-left p-4 text-slate-300 font-medium">Dev</th>
                <th className="text-left p-4 text-slate-300 font-medium">Weekly Total</th>
                <th className="text-left p-4 text-slate-300 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {weeklyData.data.map((week) => (
                <tr key={week.week} className={`border-b border-slate-700/20 ${week.isActive ? 'bg-purple-500/10' : ''}`}>
                  <td className="p-4 text-white font-medium">{week.week}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs ${
                      week.phase === 1 ? 'bg-green-500/20 text-green-400' :
                      week.phase === 2 ? 'bg-blue-500/20 text-blue-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {week.phaseName}
                    </span>
                  </td>
                  <td className="p-4 text-slate-300">{week.totalEmissionRate}</td>
                  <td className="p-4 text-green-400">{week.lpAllocation}</td>
                  <td className="p-4 text-blue-400">{week.singleAllocation}</td>
                  <td className="p-4 text-purple-400">{week.victoryStakingAllocation}</td>
                  <td className="p-4 text-orange-400">{week.devAllocation}</td>
                  <td className="p-4 text-white">{week.weeklyTotal}</td>
                  <td className="p-4">
                    {week.isActive ? (
                      <span className="text-green-400 font-medium">Active</span>
                    ) : week.isCompleted ? (
                      <span className="text-slate-400">Completed</span>
                    ) : (
                      <span className="text-slate-500">Pending</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-700/30 flex items-center justify-between">
          <div className="text-sm text-slate-400">
            Showing page {weeklyData.currentPage} of {weeklyData.totalPages} ({weeklyData.totalWeeks} total weeks)
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-slate-700/50 hover:bg-slate-700/70 disabled:opacity-50 text-slate-300 rounded transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(weeklyData.totalPages, currentPage + 1))}
              disabled={currentPage === weeklyData.totalPages}
              className="px-3 py-1 bg-slate-700/50 hover:bg-slate-700/70 disabled:opacity-50 text-slate-300 rounded transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Monitoring Tab Component
function MonitoringTab({ data }: { data: EmissionOverview }) {
  return (
    <div className="space-y-6">
      {/* Real-time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Live Emission Rate"
          value={`${data.rates.totalPerSecond}/sec`}
          subtitle={`${formatLargeNumber(parseFloat(data.rates.totalPerSecond) * 86400)} per day`}
          color="text-green-400"
        />
        <MetricCard
          title="Week Progress"
          value={`${data.status.weekProgress}%`}
          subtitle={`${formatDuration(data.status.remainingTimeInWeek)} remaining`}
          color="text-blue-400"
        />
        <MetricCard
          title="Phase Progress"
          value={`${data.status.currentPhase}/3`}
          subtitle={data.status.phaseName}
          color="text-purple-400"
        />
        <MetricCard
          title="Total Remaining"
          value={formatDuration(data.status.totalRemainingTime)}
          subtitle="Until completion"
          color="text-orange-400"
        />
      </div>

      {/* Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Real-time Activity</h3>
          <div className="space-y-3">
            <ActivityItem
              type="emission"
              title="Current Emission Rate"
              value={`${data.rates.totalPerSecond} VICTORY/sec`}
              time="Live"
              color="text-green-400"
            />
            <ActivityItem
              type="allocation"
              title="LP Farming"
              value={`${data.rates.lpPerSecond} VICTORY/sec (${data.rates.lpPercent}%)`}
              time="Current week"
              color="text-green-400"
            />
            <ActivityItem
              type="allocation"
              title="Victory Staking"
              value={`${data.rates.victoryStakingPerSecond} VICTORY/sec (${data.rates.victoryStakingPercent}%)`}
              time="Current week"
              color="text-purple-400"
            />
            <ActivityItem
              type="system"
              title="System Status"
              value={data.systemStatus.paused ? 'PAUSED' : 'ACTIVE'}
              time="Live"
              color={data.systemStatus.paused ? "text-yellow-400" : "text-green-400"}
            />
          </div>
        </div>

        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Performance Metrics</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-slate-300">Emission Progress</span>
                <span className="text-white">{((data.status.currentWeek / 156) * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(data.status.currentWeek / 156) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-slate-300">Week Progress</span>
                <span className="text-white">{data.status.weekProgress}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${data.status.weekProgress}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-slate-300">Tokens Distributed</span>
                <span className="text-white">{((data.metrics.totalEmittedSoFar / (data.metrics.totalEmittedSoFar + data.metrics.remainingEmissions)) * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(data.metrics.totalEmittedSoFar / (data.metrics.totalEmittedSoFar + data.metrics.remainingEmissions)) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">System Health</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <HealthIndicator
            title="Emission System"
            status={data.systemStatus.isActive ? 'healthy' : 'warning'}
            description={data.systemStatus.isActive ? 'Operating normally' : 'System inactive'}
          />
          <HealthIndicator
            title="Phase Transition"
            status="healthy"
            description={`Currently in ${data.status.phaseName} phase`}
          />
          <HealthIndicator
            title="Weekly Progress"
            status={data.status.weekProgress > 90 ? 'warning' : 'healthy'}
            description={`Week ${data.status.weekProgress}% complete`}
          />
        </div>
      </div>
    </div>
  )
}

// Activity Item Component
function ActivityItem({ type, title, value, time, color }: {
  type: string
  title: string
  value: string
  time: string
  color: string
}) {
  const getIcon = () => {
    switch (type) {
      case 'emission':
        return <ActivityIcon className="w-4 h-4" />
      case 'allocation':
        return <ChartIcon className="w-4 h-4" />
      case 'system':
        return <ClockIcon className="w-4 h-4" />
      default:
        return <ActivityIcon className="w-4 h-4" />
    }
  }

  return (
    <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
      <div className="flex items-center space-x-3">
        <div className={`${color}`}>
          {getIcon()}
        </div>
        <div>
          <div className="text-white font-medium text-sm">{title}</div>
          <div className={`text-sm ${color}`}>{value}</div>
        </div>
      </div>
      <div className="text-slate-400 text-xs">{time}</div>
    </div>
  )
}

// Health Indicator Component
function HealthIndicator({ title, status, description }: {
  title: string
  status: 'healthy' | 'warning' | 'error'
  description: string
}) {
  const getStatusColor = () => {
    switch (status) {
      case 'healthy': return 'text-green-400'
      case 'warning': return 'text-yellow-400'
      case 'error': return 'text-red-400'
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'healthy': return '●'
      case 'warning': return '⚠'
      case 'error': return '●'
    }
  }

  return (
    <div className="text-center">
      <div className="flex items-center justify-center space-x-2 mb-2">
        <span className={`${getStatusColor()}`}>{getStatusIcon()}</span>
        <span className="text-white font-medium">{title}</span>
      </div>
      <div className="text-slate-400 text-sm">{description}</div>
    </div>
  )
}

// Confirmation Modal Component
function ConfirmationModal({ action, data, onConfirm, onCancel, loading }: {
  action: string
  data: any
  onConfirm: (action: string) => void
  onCancel: () => void
  loading: boolean
}) {
  const getActionDetails = () => {
    switch (action) {
      case 'pause':
        return {
          title: 'Pause Emission System',
          description: 'This will halt all emission distributions until manually resumed.',
          warning: 'Users will not receive rewards while the system is paused.',
          buttonText: 'Pause System',
          buttonColor: 'bg-yellow-600 hover:bg-yellow-700'
        }
      case 'unpause':
        return {
          title: 'Resume Emission System',
          description: 'This will restart emission distributions.',
          warning: 'Make sure all systems are ready before resuming.',
          buttonText: 'Resume System',
          buttonColor: 'bg-green-600 hover:bg-green-700'
        }
      case 'initialize':
        return {
          title: 'Initialize Emission Schedule',
          description: 'This will start the 156-week emission schedule immediately.',
          warning: 'This action cannot be undone. The emission timer will begin.',
          buttonText: 'Initialize',
          buttonColor: 'bg-purple-600 hover:bg-purple-700'
        }
      case 'reset':
        return {
          title: 'Reset to Week ' + data.resetWeek,
          description: `This will reset the emission timeline to week ${data.resetWeek}.`,
          warning: 'This will affect the current emission schedule and user rewards.',
          buttonText: 'Reset Week',
          buttonColor: 'bg-orange-600 hover:bg-orange-700'
        }
      case 'adjust':
        return {
          title: 'Adjust Emission Timing',
          description: `This will ${data.adjustDirection === 'subtract' ? 'go back' : 'go forward'} ${data.adjustHours} hours.`,
          warning: 'This will affect when the current week ends and rewards are distributed.',
          buttonText: 'Adjust Timing',
          buttonColor: 'bg-blue-600 hover:bg-blue-700'
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