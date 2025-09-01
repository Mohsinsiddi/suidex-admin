// components/tokenlocker/AdminPanel.tsx
import React, { useState } from 'react'
import { AlertTriangle, Settings, Percent, BarChart3, DollarSign, Users, Plus, Upload, Download } from 'lucide-react'
import { TokenLockerService } from '../../services/tokenLockerService'
import type { BatchLockOperation } from '../../services/tokenLockerService'
import LoadingSkeleton from './LoadingSkeleton'

interface AdminPanelProps {
  dashboardData: any
  loadingStates: {
    dashboard: boolean
    events: boolean
  }
  canPerformAction: boolean
  victoryAllocations: {
    week: number
    threeMonth: number
    year: number
    threeYear: number
  }
  setVictoryAllocations: React.Dispatch<React.SetStateAction<{
    week: number
    threeMonth: number
    year: number
    threeYear: number
  }>>
  suiAllocations: {
    week: number
    threeMonth: number
    year: number
    threeYear: number
  }
  setSuiAllocations: React.Dispatch<React.SetStateAction<{
    week: number
    threeMonth: number
    year: number
    threeYear: number
  }>>
  victoryDepositAmount: string
  setVictoryDepositAmount: React.Dispatch<React.SetStateAction<string>>
  onConfirmAction: (action: string) => void
  actionLoading: boolean
}

export default function AdminPanel({
  dashboardData,
  loadingStates,
  canPerformAction,
  victoryAllocations,
  setVictoryAllocations,
  suiAllocations,
  setSuiAllocations,
  victoryDepositAmount,
  setVictoryDepositAmount,
  onConfirmAction,
  actionLoading
}: AdminPanelProps) {
  // Lock creation states
  const [singleLock, setSingleLock] = useState({
    userAddress: '',
    amount: '',
    lockPeriod: 90
  })
  
  const [batchLocks, setBatchLocks] = useState<BatchLockOperation[]>([])
  const [batchInput, setBatchInput] = useState('')
  const [activeSection, setActiveSection] = useState<'deposit' | 'allocations' | 'locks'>('deposit')

  if (!canPerformAction) {
    return (
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-yellow-400" />
          <span className="text-yellow-400 font-medium">
            Admin authentication required for control operations
          </span>
        </div>
      </div>
    )
  }

  const handleAddBatchLock = () => {
    setBatchLocks([...batchLocks, {
      userAddress: '',
      amount: '',
      lockPeriod: 90,
      status: 'pending'
    }])
  }

  const handleRemoveBatchLock = (index: number) => {
    setBatchLocks(batchLocks.filter((_, i) => i !== index))
  }

  const handleBatchLockChange = (index: number, field: keyof BatchLockOperation, value: string | number) => {
    const updated = [...batchLocks]
    updated[index] = { ...updated[index], [field]: value }
    setBatchLocks(updated)
  }

  const parseBatchInput = () => {
    if (!batchInput.trim()) return

    const lines = batchInput.trim().split('\n')
    const newBatchLocks: BatchLockOperation[] = []

    lines.forEach((line, index) => {
      const parts = line.split(',').map(p => p.trim())
      if (parts.length >= 3) {
        newBatchLocks.push({
          userAddress: parts[0],
          amount: parts[1],
          lockPeriod: parseInt(parts[2]) || 90,
          status: 'pending'
        })
      }
    })

    setBatchLocks(newBatchLocks)
    setBatchInput('')
  }

  const validateBatchLocks = () => {
    const validation = TokenLockerService.validateBatchLockOperations(batchLocks)
    if (!validation.isValid) {
      alert('Validation errors:\n' + validation.errors.join('\n'))
      return false
    }
    return true
  }

  return (
    <div className="space-y-6">
      {/* Section Navigation */}
      <div className="flex space-x-1 bg-slate-800/30 rounded-lg p-1">
        {[
          { id: 'deposit', label: 'Token Deposit', icon: DollarSign },
          { id: 'allocations', label: 'Allocations', icon: BarChart3 },
          { id: 'locks', label: 'Lock Creation', icon: Users }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveSection(id as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-all duration-200 ${
              activeSection === id
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Victory Token Deposit */}
      {activeSection === 'deposit' && (
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-purple-400" />
            Victory Token Management
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-slate-300 font-medium mb-2">Deposit Victory Tokens (Reward Vault)</label>
              <input
                type="text"
                value={victoryDepositAmount}
                onChange={(e) => setVictoryDepositAmount(e.target.value)}
                placeholder="Amount in smallest units (e.g., 1000000)"
                disabled={!canPerformAction}
                className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:border-purple-500 focus:outline-none disabled:opacity-50"
              />
              <p className="text-slate-400 text-sm mt-1">
                Current balance: {dashboardData?.config ? TokenLockerService.formatVictoryAmount(dashboardData.config.vaultBalances.victoryRewards) : '0 VICTORY'}
              </p>
            </div>
            <button
              onClick={() => {
                const validation = TokenLockerService.validateAmount(victoryDepositAmount)
                if (!validation.isValid) {
                  alert(validation.error)
                  return
                }
                onConfirmAction('depositVictory')
              }}
              disabled={!canPerformAction || !victoryDepositAmount || actionLoading}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:opacity-50 text-white font-semibold px-4 py-3 rounded-lg transition-all duration-200"
            >
              {actionLoading ? 'Processing...' : 'Deposit Victory Tokens'}
            </button>
          </div>
        </div>
      )}

      {/* Allocation Management */}
      {activeSection === 'allocations' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Victory Allocations */}
          <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Percent className="w-5 h-5 mr-2 text-purple-400" />
              Victory Token Allocations
            </h3>
            <div className="space-y-4">
              {Object.entries(victoryAllocations).filter(([key]) => key !== 'total').map(([key, value]) => (
                <div key={key}>
                  <label className="block text-slate-300 font-medium mb-2 capitalize">
                    {TokenLockerService.getLockPeriodDisplayName(
                      key === 'week' ? 7 : key === 'threeMonth' ? 90 : key === 'year' ? 365 : 1095
                    )} ({(value / 100).toFixed(1)}%)
                  </label>
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => setVictoryAllocations(prev => ({ 
                      ...prev, 
                      [key]: parseInt(e.target.value) || 0 
                    }))}
                    min="0"
                    max="10000"
                    disabled={!canPerformAction}
                    className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:border-purple-500 focus:outline-none disabled:opacity-50"
                  />
                </div>
              ))}
              <div className="text-sm text-slate-400">
                Total: {Object.values(victoryAllocations).filter((_, i) => i < 4).reduce((a, b) => a + b, 0) / 100}%
                {Object.values(victoryAllocations).filter((_, i) => i < 4).reduce((a, b) => a + b, 0) !== 10000 && (
                  <span className="text-red-400 ml-2">Must equal 100%</span>
                )}
              </div>
              <button
                onClick={() => {
                  const validation = TokenLockerService.validateAllocations(victoryAllocations)
                  if (!validation.isValid) {
                    alert('Validation errors:\n' + validation.errors.join('\n'))
                    return
                  }
                  onConfirmAction('updateVictoryAllocations')
                }}
                disabled={!canPerformAction || actionLoading}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:opacity-50 text-white font-semibold px-4 py-3 rounded-lg transition-all duration-200"
              >
                Update Victory Allocations
              </button>
            </div>
          </div>

          {/* SUI Allocations */}
          <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-blue-400" />
              SUI Revenue Allocations
            </h3>
            <div className="space-y-4">
              {Object.entries(suiAllocations).filter(([key]) => key !== 'total').map(([key, value]) => (
                <div key={key}>
                  <label className="block text-slate-300 font-medium mb-2 capitalize">
                    {TokenLockerService.getLockPeriodDisplayName(
                      key === 'week' ? 7 : key === 'threeMonth' ? 90 : key === 'year' ? 365 : 1095
                    )} ({(value / 100).toFixed(1)}%)
                  </label>
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => setSuiAllocations(prev => ({ 
                      ...prev, 
                      [key]: parseInt(e.target.value) || 0 
                    }))}
                    min="0"
                    max="10000"
                    disabled={!canPerformAction}
                    className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none disabled:opacity-50"
                  />
                </div>
              ))}
              <div className="text-sm text-slate-400">
                Total: {Object.values(suiAllocations).filter((_, i) => i < 4).reduce((a, b) => a + b, 0) / 100}%
                {Object.values(suiAllocations).filter((_, i) => i < 4).reduce((a, b) => a + b, 0) !== 10000 && (
                  <span className="text-red-400 ml-2">Must equal 100%</span>
                )}
              </div>
              <button
                onClick={() => {
                  const validation = TokenLockerService.validateAllocations(suiAllocations)
                  if (!validation.isValid) {
                    alert('Validation errors:\n' + validation.errors.join('\n'))
                    return
                  }
                  onConfirmAction('updateSUIAllocations')
                }}
                disabled={!canPerformAction || actionLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:opacity-50 text-white font-semibold px-4 py-3 rounded-lg transition-all duration-200"
              >
                Update SUI Allocations
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lock Creation */}
      {activeSection === 'locks' && (
        <div className="space-y-6">
          {/* Single Lock Creation */}
          <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2 text-green-400" />
              Single User Lock Creation
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-300 font-medium mb-2">User Address</label>
                <input
                  type="text"
                  value={singleLock.userAddress}
                  onChange={(e) => setSingleLock(prev => ({ ...prev, userAddress: e.target.value }))}
                  placeholder="0x..."
                  className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:border-green-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-2">Amount (Victory)</label>
                <input
                  type="text"
                  value={singleLock.amount}
                  onChange={(e) => setSingleLock(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="1000000"
                  className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:border-green-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-2">Lock Period</label>
                <select
                  value={singleLock.lockPeriod}
                  onChange={(e) => setSingleLock(prev => ({ ...prev, lockPeriod: parseInt(e.target.value) }))}
                  className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-white focus:border-green-500 focus:outline-none"
                >
                  {TokenLockerService.getLockPeriodOptions().map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={() => {
                const addressValidation = TokenLockerService.validateUserAddress(singleLock.userAddress)
                const amountValidation = TokenLockerService.validateAmount(singleLock.amount)
                const periodValidation = TokenLockerService.validateLockPeriod(singleLock.lockPeriod)
                
                if (!addressValidation.isValid) {
                  alert(addressValidation.error)
                  return
                }
                if (!amountValidation.isValid) {
                  alert(amountValidation.error)
                  return
                }
                if (!periodValidation.isValid) {
                  alert(periodValidation.error)
                  return
                }
                
                onConfirmAction('createSingleLock')
              }}
              disabled={!canPerformAction || !singleLock.userAddress || !singleLock.amount || actionLoading}
              className="mt-4 w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:opacity-50 text-white font-semibold px-4 py-3 rounded-lg transition-all duration-200"
            >
              Create User Lock
            </button>
          </div>

          {/* Batch Lock Creation */}
          <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Upload className="w-5 h-5 mr-2 text-orange-400" />
              Batch Lock Creation
            </h3>
            
            {/* Batch Input */}
            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 font-medium mb-2">
                  Batch Input (Format: address,amount,period per line)
                </label>
                <textarea
                  value={batchInput}
                  onChange={(e) => setBatchInput(e.target.value)}
                  placeholder="0x123...,1000000,90&#10;0x456...,5000000,365"
                  rows={4}
                  className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:border-orange-500 focus:outline-none"
                />
                <button
                  onClick={parseBatchInput}
                  className="mt-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm"
                >
                  Parse Input
                </button>
              </div>

              {/* Individual Batch Entries */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-medium">Batch Entries ({batchLocks.length})</span>
                  <button
                    onClick={handleAddBatchLock}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-sm flex items-center space-x-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Entry</span>
                  </button>
                </div>
                
                {batchLocks.map((lock, index) => (
                  <div key={index} className="grid grid-cols-4 gap-2 items-center p-3 bg-slate-700/30 rounded-lg">
                    <input
                      type="text"
                      value={lock.userAddress}
                      onChange={(e) => handleBatchLockChange(index, 'userAddress', e.target.value)}
                      placeholder="User address"
                      className="bg-slate-600/50 border border-slate-500/50 rounded px-2 py-1 text-white text-sm"
                    />
                    <input
                      type="text"
                      value={lock.amount}
                      onChange={(e) => handleBatchLockChange(index, 'amount', e.target.value)}
                      placeholder="Amount"
                      className="bg-slate-600/50 border border-slate-500/50 rounded px-2 py-1 text-white text-sm"
                    />
                    <select
                      value={lock.lockPeriod}
                      onChange={(e) => handleBatchLockChange(index, 'lockPeriod', parseInt(e.target.value))}
                      className="bg-slate-600/50 border border-slate-500/50 rounded px-2 py-1 text-white text-sm"
                    >
                      {TokenLockerService.getLockPeriodOptions().map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleRemoveBatchLock(index)}
                      className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              {batchLocks.length > 0 && (
                <button
                  onClick={() => {
                    if (validateBatchLocks()) {
                      onConfirmAction('createBatchLocks')
                    }
                  }}
                  disabled={!canPerformAction || batchLocks.length === 0 || actionLoading}
                  className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:opacity-50 text-white font-semibold px-4 py-3 rounded-lg transition-all duration-200"
                >
                  Create {batchLocks.length} User Locks
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}