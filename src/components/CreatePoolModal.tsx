// components/CreatePoolModal.tsx
import React, { useState } from 'react'
import { type CreatePoolForm } from '../types/pool'
import { validateTokenType } from '../utils/poolUtils'
import { CloseIcon } from './icons'

interface CreatePoolModalProps {
  form: CreatePoolForm
  setForm: (form: CreatePoolForm) => void
  onSubmit: () => void
  onClose: () => void
}

export function CreatePoolModal({ form, setForm, onSubmit, onClose }: CreatePoolModalProps) {
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({})

  const validateForm = () => {
    const errors: {[key: string]: string} = {}

    if (form.poolType === 'LP') {
      if (!form.token0) errors.token0 = 'Token 0 type is required'
      if (!form.token1) errors.token1 = 'Token 1 type is required'
      if (form.token0 && !validateTokenType(form.token0)) errors.token0 = 'Invalid token type format'
      if (form.token1 && !validateTokenType(form.token1)) errors.token1 = 'Invalid token type format'
    } else {
      if (!form.singleToken) errors.singleToken = 'Token type is required'
      if (form.singleToken && !validateTokenType(form.singleToken)) errors.singleToken = 'Invalid token type format'
    }

    if (form.allocationPoints <= 0) errors.allocationPoints = 'Allocation points must be greater than 0'
    if (form.depositFee < 0 || form.depositFee > 1000) errors.depositFee = 'Deposit fee must be between 0-1000 BP'
    if (form.withdrawalFee < 0 || form.withdrawalFee > 1000) errors.withdrawalFee = 'Withdrawal fee must be between 0-1000 BP'

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit()
    }
  }

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
                  placeholder="0x...::module::TOKEN"
                  value={form.token0}
                  onChange={(e) => setForm({...form, token0: e.target.value})}
                  className={`w-full bg-slate-900/50 border rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 ${
                    formErrors.token0 ? 'border-red-500' : 'border-slate-600'
                  }`}
                />
                {formErrors.token0 && <p className="text-red-400 text-xs mt-1">{formErrors.token0}</p>}
                <p className="text-slate-500 text-xs mt-1">Example: 0x2::sui::SUI</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Token 1 Type</label>
                <input
                  type="text"
                  placeholder="0x...::module::TOKEN"
                  value={form.token1}
                  onChange={(e) => setForm({...form, token1: e.target.value})}
                  className={`w-full bg-slate-900/50 border rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 ${
                    formErrors.token1 ? 'border-red-500' : 'border-slate-600'
                  }`}
                />
                {formErrors.token1 && <p className="text-red-400 text-xs mt-1">{formErrors.token1}</p>}
              </div>
            </>
          ) : (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Token Type</label>
              <input
                type="text"
                placeholder="0x...::module::TOKEN"
                value={form.singleToken}
                onChange={(e) => setForm({...form, singleToken: e.target.value})}
                className={`w-full bg-slate-900/50 border rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 ${
                  formErrors.singleToken ? 'border-red-500' : 'border-slate-600'
                }`}
              />
              {formErrors.singleToken && <p className="text-red-400 text-xs mt-1">{formErrors.singleToken}</p>}
              <p className="text-slate-500 text-xs mt-1">Example: 0x2::sui::SUI</p>
            </div>
          )}

          {/* Allocation Points */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Allocation Points</label>
            <input
              type="number"
              value={form.allocationPoints}
              onChange={(e) => setForm({...form, allocationPoints: parseInt(e.target.value) || 0})}
              className={`w-full bg-slate-900/50 border rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 ${
                formErrors.allocationPoints ? 'border-red-500' : 'border-slate-600'
              }`}
            />
            {formErrors.allocationPoints && <p className="text-red-400 text-xs mt-1">{formErrors.allocationPoints}</p>}
            <p className="text-slate-500 text-xs mt-1">Higher allocation = more Victory token rewards</p>
          </div>

          {/* Fees */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Deposit Fee (BP)</label>
              <input
                type="number"
                value={form.depositFee}
                onChange={(e) => setForm({...form, depositFee: parseInt(e.target.value) || 0})}
                className={`w-full bg-slate-900/50 border rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 ${
                  formErrors.depositFee ? 'border-red-500' : 'border-slate-600'
                }`}
              />
              {formErrors.depositFee && <p className="text-red-400 text-xs mt-1">{formErrors.depositFee}</p>}
              <p className="text-slate-500 text-xs mt-1">100 BP = 1%</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Withdrawal Fee (BP)</label>
              <input
                type="number"
                value={form.withdrawalFee}
                onChange={(e) => setForm({...form, withdrawalFee: parseInt(e.target.value) || 0})}
                className={`w-full bg-slate-900/50 border rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 ${
                  formErrors.withdrawalFee ? 'border-red-500' : 'border-slate-600'
                }`}
              />
              {formErrors.withdrawalFee && <p className="text-red-400 text-xs mt-1">{formErrors.withdrawalFee}</p>}
              <p className="text-slate-500 text-xs mt-1">100 BP = 1%</p>
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
              Native Pair (includes SUI)
            </label>
          </div>

          {/* Info Box */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <svg className="w-4 h-4 text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-blue-300">
                <div className="font-medium">Pool Creation</div>
                <div className="text-blue-400/80 mt-1">
                  • Use exact type names from the blockchain<br/>
                  • Fees are in basis points (1% = 100 BP)<br/>
                  • Native pairs include SUI and get special treatment
                </div>
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
            Create Pool
          </button>
        </div>
      </div>
    </div>
  )
}