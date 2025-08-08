// components/EditPoolModal.tsx
import React, { useState } from 'react'
import type { Pool } from '../types/pool'
import { CloseIcon, AlertTriangleIcon } from './icons'

interface EditPoolModalProps {
  pool: Pool
  onSubmit: (pool: Pool) => void
  onClose: () => void
}

export function EditPoolModal({ pool, onSubmit, onClose }: EditPoolModalProps) {
  const [editForm, setEditForm] = useState({
    allocationPoints: pool.allocationPoints,
    depositFee: pool.depositFee,
    withdrawalFee: pool.withdrawalFee,
    isActive: pool.isActive
  })

  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({})

  const validateForm = () => {
    const errors: {[key: string]: string} = {}

    if (editForm.allocationPoints <= 0) errors.allocationPoints = 'Allocation points must be greater than 0'
    if (editForm.depositFee < 0 || editForm.depositFee > 1000) errors.depositFee = 'Deposit fee must be between 0-1000 BP'
    if (editForm.withdrawalFee < 0 || editForm.withdrawalFee > 1000) errors.withdrawalFee = 'Withdrawal fee must be between 0-1000 BP'

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = () => {
    if (validateForm()) {
      const updatedPool = {
        ...pool,
        ...editForm
      }
      onSubmit(updatedPool)
      onClose()
    }
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
            <div className="text-slate-300 text-sm">Total Staked: {pool.totalStaked}</div>
            <div className="text-slate-300 text-sm font-mono text-xs mt-2 break-all">
              {pool.typeName}
            </div>
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
              className={`w-full bg-slate-900/50 border rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 ${
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
                <span className="text-slate-500 block text-xs">Current: {pool.depositFee}</span>
              </label>
              <input
                type="number"
                value={editForm.depositFee}
                onChange={(e) => setEditForm({...editForm, depositFee: parseInt(e.target.value) || 0})}
                className={`w-full bg-slate-900/50 border rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 ${
                  formErrors.depositFee ? 'border-red-500' : 'border-slate-600'
                }`}
              />
              {formErrors.depositFee && <p className="text-red-400 text-xs mt-1">{formErrors.depositFee}</p>}
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
                className={`w-full bg-slate-900/50 border rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 ${
                  formErrors.withdrawalFee ? 'border-red-500' : 'border-slate-600'
                }`}
              />
              {formErrors.withdrawalFee && <p className="text-red-400 text-xs mt-1">{formErrors.withdrawalFee}</p>}
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