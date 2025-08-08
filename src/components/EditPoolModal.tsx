// components/EditPoolModal.tsx
import React, { useState, useEffect } from 'react'
import { useWallet } from '@suiet/wallet-kit'
import type { Pool } from '../types/pool'
import { CloseIcon, AlertTriangleIcon, LoadingSpinner, CheckIcon, XIcon } from './icons'
import { buildUpdatePoolTransaction } from '../utils/poolUtils'
import { EventBasedPoolService } from '../services/eventBasedPoolService'

interface EditPoolModalProps {
  pool: Pool
  onSubmit: (pool: Pool) => void
  onClose: () => void
  onPoolUpdated: (updatedPool: Pool) => void // New callback for successful updates
}

interface UpdateStatus {
  isUpdating: boolean
  isSuccess: boolean
  isError: boolean
  message: string
  txDigest?: string
}

export function EditPoolModal({ pool, onSubmit, onClose, onPoolUpdated }: EditPoolModalProps) {
  const { connected, account, signAndExecuteTransaction } = useWallet()
  
  const [editForm, setEditForm] = useState({
    allocationPoints: pool.allocationPoints,
    depositFee: pool.depositFee,
    withdrawalFee: pool.withdrawalFee,
    isActive: pool.isActive
  })

  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({})
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>({
    isUpdating: false,
    isSuccess: false,
    isError: false,
    message: ''
  })

  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationAttempts, setVerificationAttempts] = useState(0)
  const MAX_VERIFICATION_ATTEMPTS = 10
  const VERIFICATION_DELAY = 3000 // 3 seconds

  // Reset status when form changes
  useEffect(() => {
    if (updateStatus.isSuccess || updateStatus.isError) {
      setUpdateStatus({
        isUpdating: false,
        isSuccess: false,
        isError: false,
        message: ''
      })
    }
  }, [editForm])

  const validateForm = () => {
    const errors: {[key: string]: string} = {}

    if (editForm.allocationPoints <= 0) {
      errors.allocationPoints = 'Allocation points must be greater than 0'
    }
    if (editForm.depositFee < 0 || editForm.depositFee > 1000) {
      errors.depositFee = 'Deposit fee must be between 0-1000 BP (0-10%)'
    }
    if (editForm.withdrawalFee < 0 || editForm.withdrawalFee > 1000) {
      errors.withdrawalFee = 'Withdrawal fee must be between 0-1000 BP (0-10%)'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const hasChanges = () => {
    return (
      editForm.allocationPoints !== pool.allocationPoints ||
      editForm.depositFee !== pool.depositFee ||
      editForm.withdrawalFee !== pool.withdrawalFee ||
      editForm.isActive !== pool.isActive
    )
  }

  const getChangeSummary = () => {
    const changes: string[] = []
    
    if (editForm.allocationPoints !== pool.allocationPoints) {
      changes.push(`Allocation: ${pool.allocationPoints} → ${editForm.allocationPoints}`)
    }
    if (editForm.depositFee !== pool.depositFee) {
      changes.push(`Deposit Fee: ${pool.depositFee}BP → ${editForm.depositFee}BP`)
    }
    if (editForm.withdrawalFee !== pool.withdrawalFee) {
      changes.push(`Withdrawal Fee: ${pool.withdrawalFee}BP → ${editForm.withdrawalFee}BP`)
    }
    if (editForm.isActive !== pool.isActive) {
      changes.push(`Status: ${pool.isActive ? 'Active' : 'Inactive'} → ${editForm.isActive ? 'Active' : 'Inactive'}`)
    }
    
    return changes
  }

  const verifyPoolUpdate = async (expectedChanges: any): Promise<boolean> => {
    try {
      console.log('Verifying pool update...', expectedChanges)
      
      // Fetch latest pool data from events
      const { pools } = await EventBasedPoolService.getAllPools()
      const updatedPool = pools.find(p => p.typeName === pool.typeName)
      
      if (!updatedPool) {
        console.warn('Pool not found during verification')
        return false
      }
      
      // Check if all expected changes are reflected
      const isUpdated = (
        updatedPool.allocationPoints === expectedChanges.allocationPoints &&
        updatedPool.depositFee === expectedChanges.depositFee &&
        updatedPool.withdrawalFee === expectedChanges.withdrawalFee &&
        updatedPool.isActive === expectedChanges.isActive
      )
      
      console.log('Pool verification result:', {
        expected: expectedChanges,
        actual: {
          allocationPoints: updatedPool.allocationPoints,
          depositFee: updatedPool.depositFee,
          withdrawalFee: updatedPool.withdrawalFee,
          isActive: updatedPool.isActive
        },
        isUpdated
      })
      
      if (isUpdated) {
        // Notify parent component of successful update
        onPoolUpdated(updatedPool)
        return true
      }
      
      return false
    } catch (error) {
      console.error('Error verifying pool update:', error)
      return false
    }
  }

  const pollForUpdate = async (expectedChanges: any) => {
    setIsVerifying(true)
    setVerificationAttempts(0)
    
    const poll = async (attempt: number): Promise<void> => {
      if (attempt >= MAX_VERIFICATION_ATTEMPTS) {
        setIsVerifying(false)
        setUpdateStatus({
          isUpdating: false,
          isSuccess: false,
          isError: true,
          message: 'Update verification timed out. Please refresh manually to check status.'
        })
        return
      }
      
      setVerificationAttempts(attempt + 1)
      
      try {
        const isUpdated = await verifyPoolUpdate(expectedChanges)
        
        if (isUpdated) {
          setIsVerifying(false)
          setUpdateStatus({
            isUpdating: false,
            isSuccess: true,
            isError: false,
            message: 'Pool updated successfully! Changes have been verified on-chain.',
            txDigest: updateStatus.txDigest
          })
          return
        }
        
        // Wait before next attempt
        setTimeout(() => {
          poll(attempt + 1)
        }, VERIFICATION_DELAY)
        
      } catch (error) {
        console.error('Error during verification attempt:', attempt, error)
        setTimeout(() => {
          poll(attempt + 1)
        }, VERIFICATION_DELAY)
      }
    }
    
    // Start polling after initial delay to allow transaction to be processed
    setTimeout(() => {
      poll(0)
    }, VERIFICATION_DELAY)
  }

  const handleSubmit = async () => {
    if (!connected || !account) {
      setUpdateStatus({
        isUpdating: false,
        isSuccess: false,
        isError: true,
        message: 'Please connect your wallet first.'
      })
      return
    }

    if (!validateForm()) {
      return
    }

    if (!hasChanges()) {
      setUpdateStatus({
        isUpdating: false,
        isSuccess: false,
        isError: true,
        message: 'No changes detected. Please modify at least one field.'
      })
      return
    }

    setUpdateStatus({
      isUpdating: true,
      isSuccess: false,
      isError: false,
      message: 'Submitting transaction...'
    })

    try {
      // Build the update transaction
      const tx = buildUpdatePoolTransaction(pool, editForm)
      
      console.log('Updating pool with transaction:', tx)
      
      // Execute the transaction
      const result = await signAndExecuteTransaction({
        transaction: tx,
        options: {
          showInput: true,
          showEffects: true,
          showEvents: true,
          showObjectChanges: true,
          showBalanceChanges: true,
        }
      })

      console.log('Pool update transaction result:', result)

      setUpdateStatus({
        isUpdating: true,
        isSuccess: false,
        isError: false,
        message: 'Transaction submitted! Verifying update...',
        txDigest: result.digest
      })

      // Start verification process
      await pollForUpdate(editForm)

    } catch (error: any) {
      console.error('Error updating pool:', error)
      
      let errorMessage = 'Failed to update pool.'
      
      if (error?.message) {
        if (error.message.includes('Insufficient')) {
          errorMessage = 'Insufficient funds for transaction.'
        } else if (error.message.includes('rejected')) {
          errorMessage = 'Transaction was rejected.'
        } else {
          errorMessage = `Transaction failed: ${error.message}`
        }
      }

      setUpdateStatus({
        isUpdating: false,
        isSuccess: false,
        isError: true,
        message: errorMessage
      })
    }
  }

  const handleClose = () => {
    if (!updateStatus.isUpdating && !isVerifying) {
      onClose()
    }
  }

  const resetForm = () => {
    setEditForm({
      allocationPoints: pool.allocationPoints,
      depositFee: pool.depositFee,
      withdrawalFee: pool.withdrawalFee,
      isActive: pool.isActive
    })
    setFormErrors({})
    setUpdateStatus({
      isUpdating: false,
      isSuccess: false,
      isError: false,
      message: ''
    })
  }

  const changes = getChangeSummary()

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Edit Pool: {pool.name}</h3>
            <button 
              onClick={handleClose} 
              className="text-slate-400 hover:text-white disabled:opacity-50"
              disabled={updateStatus.isUpdating || isVerifying}
            >
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
            <div className="text-slate-300 text-sm">Total Staked: {pool.totalStaked}</div>
            {pool.apy && (
              <div className="text-slate-300 text-sm">Current APY: {pool.apy}</div>
            )}
            <div className="text-slate-300 text-sm font-mono text-xs mt-2 break-all">
              {pool.typeName}
            </div>
          </div>

          {/* Status Display */}
          {(updateStatus.isUpdating || updateStatus.isSuccess || updateStatus.isError || isVerifying) && (
            <div className={`p-4 rounded-lg border ${
              updateStatus.isSuccess ? 'bg-green-500/10 border-green-500/20' :
              updateStatus.isError ? 'bg-red-500/10 border-red-500/20' :
              'bg-blue-500/10 border-blue-500/20'
            }`}>
              <div className="flex items-start space-x-3">
                {(updateStatus.isUpdating || isVerifying) && (
                  <LoadingSpinner className="w-5 h-5 mt-0.5" />
                )}
                {updateStatus.isSuccess && (
                  <CheckIcon className="w-5 h-5 text-green-400 mt-0.5" />
                )}
                {updateStatus.isError && (
                  <XIcon className="w-5 h-5 text-red-400 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className={`font-medium ${
                    updateStatus.isSuccess ? 'text-green-300' :
                    updateStatus.isError ? 'text-red-300' :
                    'text-blue-300'
                  }`}>
                    {updateStatus.isSuccess ? 'Success!' :
                     updateStatus.isError ? 'Error' :
                     isVerifying ? `Verifying Update (${verificationAttempts}/${MAX_VERIFICATION_ATTEMPTS})` :
                     'Updating Pool'}
                  </div>
                  <div className={`text-sm mt-1 ${
                    updateStatus.isSuccess ? 'text-green-400' :
                    updateStatus.isError ? 'text-red-400' :
                    'text-blue-400'
                  }`}>
                    {updateStatus.message}
                  </div>
                  {updateStatus.txDigest && (
                    <div className="text-xs text-slate-400 mt-2 font-mono">
                      TX: {updateStatus.txDigest}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Changes Summary */}
          {changes.length > 0 && !updateStatus.isSuccess && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
              <div className="text-sm text-yellow-300 font-medium mb-2">Proposed Changes:</div>
              <ul className="text-sm text-yellow-400/80 space-y-1">
                {changes.map((change, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <span className="w-1 h-1 bg-yellow-400 rounded-full"></span>
                    <span>{change}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-4">
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
                disabled={updateStatus.isUpdating || isVerifying}
                className={`w-full bg-slate-900/50 border rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 disabled:opacity-50 ${
                  formErrors.allocationPoints ? 'border-red-500' : 'border-slate-600'
                }`}
              />
              {formErrors.allocationPoints && <p className="text-red-400 text-xs mt-1">{formErrors.allocationPoints}</p>}
            </div>

            {/* Fees */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Deposit Fee (BP)
                  <span className="text-slate-500 block text-xs">Current: {pool.depositFee} ({(pool.depositFee / 100).toFixed(2)}%)</span>
                </label>
                <input
                  type="number"
                  value={editForm.depositFee}
                  onChange={(e) => setEditForm({...editForm, depositFee: parseInt(e.target.value) || 0})}
                  disabled={updateStatus.isUpdating || isVerifying}
                  className={`w-full bg-slate-900/50 border rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 disabled:opacity-50 ${
                    formErrors.depositFee ? 'border-red-500' : 'border-slate-600'
                  }`}
                />
                {formErrors.depositFee && <p className="text-red-400 text-xs mt-1">{formErrors.depositFee}</p>}
                <p className="text-slate-500 text-xs mt-1">
                  = {(editForm.depositFee / 100).toFixed(2)}%
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Withdrawal Fee (BP)
                  <span className="text-slate-500 block text-xs">Current: {pool.withdrawalFee} ({(pool.withdrawalFee / 100).toFixed(2)}%)</span>
                </label>
                <input
                  type="number"
                  value={editForm.withdrawalFee}
                  onChange={(e) => setEditForm({...editForm, withdrawalFee: parseInt(e.target.value) || 0})}
                  disabled={updateStatus.isUpdating || isVerifying}
                  className={`w-full bg-slate-900/50 border rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 disabled:opacity-50 ${
                    formErrors.withdrawalFee ? 'border-red-500' : 'border-slate-600'
                  }`}
                />
                {formErrors.withdrawalFee && <p className="text-red-400 text-xs mt-1">{formErrors.withdrawalFee}</p>}
                <p className="text-slate-500 text-xs mt-1">
                  = {(editForm.withdrawalFee / 100).toFixed(2)}%
                </p>
              </div>
            </div>

            {/* Active Status */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="editIsActive"
                checked={editForm.isActive}
                onChange={(e) => setEditForm({...editForm, isActive: e.target.checked})}
                disabled={updateStatus.isUpdating || isVerifying}
                className="w-4 h-4 text-purple-600 bg-slate-900 border-slate-600 rounded focus:ring-purple-500 disabled:opacity-50"
              />
              <label htmlFor="editIsActive" className="text-sm font-medium text-slate-300">
                Pool Active
                <span className="text-slate-500 ml-2">
                  (Currently: {pool.isActive ? 'Active' : 'Inactive'})
                </span>
              </label>
            </div>
          </div>

          {/* Warning */}
          {!updateStatus.isSuccess && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <AlertTriangleIcon className="w-4 h-4 text-yellow-400 mt-0.5" />
                <div className="text-sm text-yellow-300">
                  <div className="font-medium">Important Notice</div>
                  <div className="text-yellow-400/80 mt-1">
                    • Pool parameter changes affect all current stakers<br/>
                    • Changes take effect immediately after transaction confirmation<br/>
                    • Consider communicating changes to your community
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-700 flex space-x-3">
          {updateStatus.isSuccess ? (
            <button
              onClick={onClose}
              className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold px-4 py-2 rounded-lg"
            >
              Close
            </button>
          ) : (
            <>
              <button
                onClick={resetForm}
                disabled={updateStatus.isUpdating || isVerifying}
                className="px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700/50 disabled:opacity-50"
              >
                Reset
              </button>
              <button
                onClick={handleClose}
                disabled={updateStatus.isUpdating || isVerifying}
                className="px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700/50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!hasChanges() || updateStatus.isUpdating || isVerifying || !connected}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updateStatus.isUpdating ? (
                  <span className="flex items-center justify-center">
                    <LoadingSpinner className="w-4 h-4 mr-2" />
                    Updating...
                  </span>
                ) : isVerifying ? (
                  <span className="flex items-center justify-center">
                    <LoadingSpinner className="w-4 h-4 mr-2" />
                    Verifying...
                  </span>
                ) : (
                  'Update Pool'
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}