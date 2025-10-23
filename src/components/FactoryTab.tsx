// FactoryTab.tsx - Performance Optimized Factory Management
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useWallet } from '@suiet/wallet-kit'
import { useAuth } from '../contexts/AuthContext'
import { FactoryService, type FactoryConfig, type FactoryStats, type FactoryEvent } from '../services/factoryService'
import { DexEventService, type DexEvent } from '../services/dexEventService'
import { CONSTANTS } from '../constants'
import { PairAddressUpdateForm } from './PairAddressUpdateForm'

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

function UserIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
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

// Loading skeleton component
function LoadingSkeleton({ className = "h-4 bg-slate-700/50 rounded animate-pulse" }: { className?: string }) {
  return <div className={className}></div>
}

export default function FactoryTab() {
  // Tab state
  const [activeTab, setActiveTab] = useState<'factory' | 'pairs'>('factory')
  
  // Core data states
  const [factoryConfig, setFactoryConfig] = useState<FactoryConfig | null>(null)
  const [factoryStats, setFactoryStats] = useState<FactoryStats | null>(null)
  const [adminEvents, setAdminEvents] = useState<FactoryEvent[]>([])
  const [pairEvents, setPairEvents] = useState<DexEvent[]>([])
  
  // Loading states - separate for each section
  const [loadingStates, setLoadingStates] = useState({
    config: true,
    stats: true,
    adminEvents: true,
    pairEvents: true
  })
  
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  // Form states
  const [newAddresses, setNewAddresses] = useState({
    team1: '',
    team2: '',
    dev: '',
    locker: '',
    buyback: ''
  })
  const [newPauseAdmin, setNewPauseAdmin] = useState('')
  const [confirmAction, setConfirmAction] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const { connected, account, signAndExecuteTransaction } = useWallet()
  const { authMethod } = useAuth()

  const canPerformAction = useMemo(() => 
    connected && (authMethod === 'secret' || account?.address === CONSTANTS.ADMIN),
    [connected, authMethod, account?.address]
  )

  // Optimized data loading - sequential, not parallel
  const loadCoreData = useCallback(async () => {
    try {
      setError(null)
      
      // Load critical data first (factory config)
      setLoadingStates(prev => ({ ...prev, config: true }))
      const config = await FactoryService.fetchFactoryConfig()
      setFactoryConfig(config)
      setLoadingStates(prev => ({ ...prev, config: false }))
      
      // Update form with current addresses immediately
      if (config) {
        setNewAddresses(config.teamAddresses)
        setNewPauseAdmin(config.pauseAdmin)
      }

      // Load stats next
      setLoadingStates(prev => ({ ...prev, stats: true }))
      const stats = await FactoryService.fetchFactoryStats()
      setFactoryStats(stats)
      setLoadingStates(prev => ({ ...prev, stats: false }))
      
      setLastUpdate(new Date())
    } catch (err) {
      console.error('Error loading core factory data:', err)
      setError('Failed to load factory data')
    }
  }, [])

  // Load events separately and lazily
  const loadEvents = useCallback(async () => {
    try {
      // Load admin events (smaller, more important)
      setLoadingStates(prev => ({ ...prev, adminEvents: true }))
      const adminEvts = await FactoryService.fetchFactoryAdminEvents()
      setAdminEvents(adminEvts.slice(0, 5)) // Limit to 5 most recent
      setLoadingStates(prev => ({ ...prev, adminEvents: false }))

      // Load pair events with delay to prevent UI blocking
      const timer = setTimeout(async () => {
        setLoadingStates(prev => ({ ...prev, pairEvents: true }))
        const pairEvts = await DexEventService.fetchPairCreatedEvents()
        setPairEvents(pairEvts.slice(0, 5)) // Limit to 5 most recent
        setLoadingStates(prev => ({ ...prev, pairEvents: false }))
      }, 500) // 500ms delay
      
      return () => clearTimeout(timer)
      
    } catch (err) {
      console.error('Error loading events:', err)
      // Don't show error for events, just fail silently
    }
  }, [])

  // Initial load
  useEffect(() => {
    loadCoreData()
    // Load events after a delay to prevent UI blocking
    const timer = setTimeout(loadEvents, 1000)
    return () => clearTimeout(timer)
  }, [loadCoreData, loadEvents])

  // Manual refresh with loading feedback
  const handleManualRefresh = async () => {
    await loadCoreData()
    loadEvents() // Reload events too on manual refresh
  }

  // Memoized permission checks
  const permissions = useMemo(() => {
    if (!factoryConfig || !canPerformAction || !account?.address) {
      return { canPause: false, canUpdateAddresses: false }
    }
    
    return {
      canPause: FactoryService.canPerformAdminOperation(account.address, factoryConfig, 'pause'),
      canUpdateAddresses: FactoryService.canPerformAdminOperation(account.address, factoryConfig, 'addresses')
    }
  }, [factoryConfig, canPerformAction, account?.address])

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
          showEvents: true,
        }
      })

      console.log(`${action} successful:`, result)
      setConfirmAction(null)
      
      // Refresh data
      await loadCoreData()
      loadEvents()
      
      onSuccess?.()
    } catch (error: any) {
      console.error(`${action} failed:`, error)
      alert(`${action} failed: ${error.message || 'Unknown error'}`)
    } finally {
      setActionLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-slate-700/50 pb-2">
        <button
          onClick={() => setActiveTab('factory')}
          className={`px-6 py-3 rounded-t-lg font-medium transition-all ${
            activeTab === 'factory'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
              : 'bg-slate-800/30 text-slate-400 hover:bg-slate-700/30 hover:text-slate-300'
          }`}
        >
          Factory Management
        </button>
        <button
          onClick={() => setActiveTab('pairs')}
          className={`px-6 py-3 rounded-t-lg font-medium transition-all ${
            activeTab === 'pairs'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
              : 'bg-slate-800/30 text-slate-400 hover:bg-slate-700/30 hover:text-slate-300'
          }`}
        >
          Pair Addresses
        </button>
      </div>

      {/* Factory Management Tab */}
      {activeTab === 'factory' && (
        <>
          {/* Header with refresh button */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-white">Factory Management</h2>
              {lastUpdate && (
                <p className="text-sm text-slate-400 mt-1">
                  Last updated: {lastUpdate.toLocaleTimeString()}
                </p>
              )}
            </div>
            <button
              onClick={handleManualRefresh}
              className="flex items-center space-x-2 bg-slate-800/30 hover:bg-slate-700/30 text-white px-4 py-2 rounded-lg transition-colors border border-slate-700/30"
            >
              <RefreshIcon className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-2">
                <WarningIcon className="w-5 h-5 text-red-400" />
                <span className="text-red-400 font-medium">Error</span>
              </div>
              <p className="text-red-300 mt-1">{error}</p>
            </div>
          )}

          {/* Permission warning */}
          {!canPerformAction && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-2">
                <WarningIcon className="w-5 h-5 text-yellow-400" />
                <span className="text-yellow-400 font-medium">Insufficient Permissions</span>
              </div>
              <p className="text-yellow-300 mt-1">
                You need to be connected with admin credentials to perform factory operations.
              </p>
            </div>
          )}

          {/* Stats Grid */}
          {loadingStates.stats ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
                  <LoadingSkeleton className="w-24 h-6 mb-2" />
                  <LoadingSkeleton className="w-16 h-8" />
                </div>
              ))}
            </div>
          ) : factoryStats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Total Pairs */}
              <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-sm font-medium">Total Pairs</span>
                  <ChartIcon className="w-5 h-5 text-purple-400" />
                </div>
                <div className="text-3xl font-bold text-white">{factoryStats.totalPairs}</div>
              </div>

              {/* Protocol Status */}
              <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-sm font-medium">Protocol Status</span>
                  {factoryStats.isPaused ? (
                    <PauseIcon className="w-5 h-5 text-yellow-400" />
                  ) : (
                    <PlayIcon className="w-5 h-5 text-green-400" />
                  )}
                </div>
                <div className={`text-3xl font-bold ${factoryStats.isPaused ? 'text-yellow-400' : 'text-green-400'}`}>
                  {factoryStats.isPaused ? 'Paused' : 'Active'}
                </div>
              </div>

              {/* Admin */}
              <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-sm font-medium">Factory Admin</span>
                  <UserIcon className="w-5 h-5 text-blue-400" />
                </div>
                <div className="text-sm font-mono text-white">
                  {FactoryService.formatAddress(factoryStats.admin)}
                </div>
              </div>
            </div>
          )}

          {/* Main Grid - Two columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Pause Management */}
            <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Pause Management</h3>
              
              {loadingStates.config ? (
                <div className="space-y-4">
                  <LoadingSkeleton className="h-12" />
                  <LoadingSkeleton className="h-12" />
                </div>
              ) : factoryConfig ? (
                <div className="space-y-4">
                  <div className="bg-slate-700/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-400 text-sm">Current Status</span>
                      {factoryConfig.isPaused ? (
                        <span className="flex items-center text-yellow-400">
                          <PauseIcon className="w-4 h-4 mr-1" />
                          Paused
                        </span>
                      ) : (
                        <span className="flex items-center text-green-400">
                          <PlayIcon className="w-4 h-4 mr-1" />
                          Active
                        </span>
                      )}
                    </div>
                    <div className="text-slate-400 text-sm">
                      Pause Admin: <span className="font-mono text-slate-300">{FactoryService.formatAddress(factoryConfig.pauseAdmin)}</span>
                    </div>
                  </div>

                  {permissions.canPause && (
                    <div className="space-y-3">
                      {factoryConfig.isPaused ? (
                        <button
                          onClick={() => setConfirmAction('unpause')}
                          disabled={actionLoading}
                          className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium px-4 py-3 rounded-lg transition-colors flex items-center justify-center"
                        >
                          <PlayIcon className="w-4 h-4 mr-2" />
                          Resume Protocol
                        </button>
                      ) : (
                        <button
                          onClick={() => setConfirmAction('pause')}
                          disabled={actionLoading}
                          className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white font-medium px-4 py-3 rounded-lg transition-colors flex items-center justify-center"
                        >
                          <PauseIcon className="w-4 h-4 mr-2" />
                          Emergency Pause
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* Team Address Management */}
            <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Team Addresses</h3>
              
              {loadingStates.config ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <LoadingSkeleton key={i} className="h-10" />
                  ))}
                </div>
              ) : factoryConfig ? (
                <div className="space-y-3">
                  {/* Current Addresses Display */}
                  <div className="space-y-2 mb-4">
                    {Object.entries(factoryConfig.teamAddresses).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between bg-slate-700/30 rounded-lg p-2">
                        <span className="text-slate-400 text-sm capitalize">{key}:</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-slate-300 font-mono text-xs">{FactoryService.formatAddress(value)}</span>
                          <button
                            onClick={() => copyToClipboard(value)}
                            className="text-slate-400 hover:text-white transition-colors"
                          >
                            <CopyIcon className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {permissions.canUpdateAddresses && (
                    <>
                      <div className="text-sm text-slate-400 mb-2">Update Addresses:</div>
                      {Object.entries(newAddresses).map(([key, value]) => (
                        <input
                          key={key}
                          type="text"
                          placeholder={`New ${key} address`}
                          value={value}
                          onChange={(e) => setNewAddresses({ ...newAddresses, [key]: e.target.value })}
                          className="w-full bg-slate-700/30 border border-slate-600/30 rounded-lg px-3 py-2 text-white text-sm font-mono focus:border-purple-500 focus:outline-none transition-colors"
                        />
                      ))}
                      <button
                        onClick={() => setConfirmAction('updateAddresses')}
                        disabled={actionLoading}
                        className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-lg transition-colors mt-3"
                      >
                        Update Addresses
                      </button>
                    </>
                  )}
                </div>
              ) : null}
            </div>
          </div>

          {/* Pause Admin Transfer */}
          {permissions.canPause && (
            <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">Transfer Pause Admin</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="New pause admin address"
                  value={newPauseAdmin}
                  onChange={(e) => setNewPauseAdmin(e.target.value)}
                  className="w-full bg-slate-700/30 border border-slate-600/30 rounded-lg px-4 py-2 text-white font-mono focus:border-purple-500 focus:outline-none transition-colors"
                />
                <button
                  onClick={() => setConfirmAction('transferPauseAdmin')}
                  disabled={actionLoading || !newPauseAdmin}
                  className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  Transfer Pause Admin Rights
                </button>
              </div>
            </div>
          )}

          {/* Events Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Admin Events */}
            <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Recent Admin Events</h3>
              <div className="space-y-3">
                {loadingStates.adminEvents ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <LoadingSkeleton className="w-8 h-8 rounded-full" />
                          <div className="space-y-2">
                            <LoadingSkeleton className="w-24 h-4" />
                            <LoadingSkeleton className="w-16 h-3" />
                          </div>
                        </div>
                        <LoadingSkeleton className="w-12 h-3" />
                      </div>
                    ))}
                  </div>
                ) : adminEvents.length > 0 ? (
                  adminEvents.map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          event.type.includes('Pause') ? 'bg-yellow-500/20' : 
                          event.type.includes('Admin') ? 'bg-blue-500/20' : 'bg-purple-500/20'
                        }`}>
                          {event.type.includes('Pause') ? <PauseIcon className="w-4 h-4 text-yellow-400" /> :
                           event.type.includes('Admin') ? <UserIcon className="w-4 h-4 text-blue-400" /> :
                           <WarningIcon className="w-4 h-4 text-purple-400" />}
                        </div>
                        <div>
                          <div className="text-white font-medium text-sm">{event.type}</div>
                          <div className="text-slate-400 text-xs font-mono">
                            {FactoryService.formatAddress(event.data?.admin || '')}
                          </div>
                        </div>
                      </div>
                      <div className="text-slate-500 text-xs">
                        {new Date(parseInt(event.timestamp)).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-slate-400 py-8">
                    <RefreshIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No admin events found</p>
                  </div>
                )}
              </div>
            </div>

            {/* Pair Creation Events */}
            <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Recent Pair Creations</h3>
              <div className="space-y-3">
                {loadingStates.pairEvents ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <LoadingSkeleton className="w-8 h-8 rounded-full" />
                          <div className="space-y-2">
                            <LoadingSkeleton className="w-24 h-4" />
                            <LoadingSkeleton className="w-16 h-3" />
                          </div>
                        </div>
                        <LoadingSkeleton className="w-12 h-3" />
                      </div>
                    ))}
                  </div>
                ) : pairEvents.length > 0 ? (
                  pairEvents.slice(0, 5).map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                          <ChartIcon className="w-4 h-4 text-green-400" />
                        </div>
                        <div>
                          <div className="text-white font-medium text-sm">{event.pairName}</div>
                          <div className="text-slate-400 text-xs">
                            Pair #{event.data?.pairLength || 'Unknown'}
                          </div>
                        </div>
                      </div>
                      <div className="text-slate-500 text-xs">
                        {new Date(parseInt(event.timestamp)).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-slate-400 py-8">
                    <ChartIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No pairs created yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Pair Addresses Tab */}
      {activeTab === 'pairs' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Pair Address Management</h2>
            <p className="text-sm text-slate-400">
              Look up and update fee addresses for individual trading pairs. Each pair can have its own fee distribution addresses.
            </p>
          </div>

          <PairAddressUpdateForm
            onSuccess={(pairAddress) => {
              console.log('Pair addresses updated:', pairAddress)
            }}
            onError={(error) => {
              console.error('Failed to update pair addresses:', error)
            }}
          />
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmAction && (
        <ConfirmationModal
          action={confirmAction}
          factoryConfig={factoryConfig}
          newAddresses={newAddresses}
          newPauseAdmin={newPauseAdmin}
          onConfirm={(action) => {
            switch (action) {
              case 'pause':
                handleTransaction(() => FactoryService.buildEmergencyPauseTransaction(), 'Emergency pause')
                break
              case 'unpause':
                handleTransaction(() => FactoryService.buildUnpauseTransaction(), 'Unpause protocol')
                break
              case 'updateAddresses':
                handleTransaction(() => FactoryService.buildSetAddressesTransaction(newAddresses), 'Update addresses')
                break
              case 'transferPauseAdmin':
                handleTransaction(() => FactoryService.buildTransferPauseAdminTransaction(newPauseAdmin), 'Transfer pause admin')
                break
            }
          }}
          onCancel={() => setConfirmAction(null)}
          loading={actionLoading}
        />
      )}
    </div>
  )
}

// Confirmation Modal Component
function ConfirmationModal({ 
  action, 
  factoryConfig, 
  newAddresses, 
  newPauseAdmin, 
  onConfirm, 
  onCancel, 
  loading 
}: {
  action: string
  factoryConfig: FactoryConfig | null
  newAddresses: any
  newPauseAdmin: string
  onConfirm: (action: string) => void
  onCancel: () => void
  loading: boolean
}) {
  const getActionDetails = () => {
    switch (action) {
      case 'pause':
        return {
          title: 'Emergency Pause Protocol',
          description: 'This will halt all pair creation and factory operations.',
          warning: 'Users will not be able to create new liquidity pools.',
          buttonText: 'Emergency Pause',
          buttonColor: 'bg-yellow-600 hover:bg-yellow-700'
        }
      case 'unpause':
        return {
          title: 'Resume Protocol Operations',
          description: 'This will restore normal factory operations.',
          warning: 'Make sure all systems are ready before resuming.',
          buttonText: 'Resume Protocol',
          buttonColor: 'bg-green-600 hover:bg-green-700'
        }
      case 'updateAddresses':
        return {
          title: 'Update Team Addresses',
          description: 'This will change the fee distribution addresses for the protocol.',
          warning: 'This affects where protocol fees are sent. Double-check all addresses.',
          buttonText: 'Update Addresses',
          buttonColor: 'bg-purple-600 hover:bg-purple-700'
        }
      case 'transferPauseAdmin':
        return {
          title: 'Transfer Pause Admin',
          description: `This will transfer pause admin rights to ${FactoryService.formatAddress(newPauseAdmin)}.`,
          warning: 'You will lose the ability to pause/unpause the protocol.',
          buttonText: 'Transfer Admin',
          buttonColor: 'bg-orange-600 hover:bg-orange-700'
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
                {key}: {FactoryService.formatAddress(value as string)}
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