// components/PoolDebugInfo.tsx
import React, { useState } from 'react'
import type { Pool } from '../types/pool'

interface PoolDebugInfoProps {
  pools: Pool[]
  onRefreshPool?: (poolId: string) => void
}

export function PoolDebugInfo({ pools, onRefreshPool }: PoolDebugInfoProps) {
  const [showDebug, setShowDebug] = useState(false)
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null)

  if (!showDebug) {
    return (
      <div className="mt-4">
        <button
          onClick={() => setShowDebug(true)}
          className="text-xs text-slate-500 hover:text-slate-400"
        >
          Show Debug Info
        </button>
      </div>
    )
  }

  return (
    <div className="mt-6 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-sm font-medium text-white">Pool Debug Information</h4>
        <button
          onClick={() => setShowDebug(false)}
          className="text-xs text-slate-500 hover:text-slate-400"
        >
          Hide Debug
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <h5 className="text-xs font-medium text-slate-300 mb-2">Pool Summary</h5>
          <div className="text-xs text-slate-400 space-y-1">
            <div>Total Pools: {pools.length}</div>
            <div>LP Pools: {pools.filter(p => p.type === 'LP').length}</div>
            <div>Single Pools: {pools.filter(p => p.type === 'Single').length}</div>
            <div>Active Pools: {pools.filter(p => p.isActive).length}</div>
            <div>Native Pairs: {pools.filter(p => p.isNativePair).length}</div>
          </div>
        </div>

        <div>
          <h5 className="text-xs font-medium text-slate-300 mb-2">Individual Pool Data</h5>
          <div className="max-h-60 overflow-y-auto">
            {pools.map((pool, index) => (
              <div key={pool.id} className="mb-2 p-2 bg-slate-800/50 rounded text-xs">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-white font-medium">{pool.name}</span>
                  <button
                    onClick={() => setSelectedPool(selectedPool?.id === pool.id ? null : pool)}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    {selectedPool?.id === pool.id ? 'Hide' : 'Details'}
                  </button>
                </div>
                
                <div className="text-slate-400 space-y-1">
                  <div>Type: {pool.type}</div>
                  <div>Allocation: {pool.allocationPoints}</div>
                  <div>Deposit Fee: {pool.depositFee} BP</div>
                  <div>Withdrawal Fee: {pool.withdrawalFee} BP</div>
                  <div>Total Staked: {pool.totalStaked}</div>
                  <div>Active: {pool.isActive ? 'Yes' : 'No'}</div>
                  <div>Native: {pool.isNativePair ? 'Yes' : 'No'}</div>
                  {pool.poolAddress && (
                    <div className="break-all">Object ID: {pool.poolAddress}</div>
                  )}
                </div>

                {selectedPool?.id === pool.id && (
                  <div className="mt-2 p-2 bg-slate-700/50 rounded">
                    <div className="text-slate-300 text-xs">
                      <div className="font-medium mb-1">Full Pool Object:</div>
                      <pre className="whitespace-pre-wrap break-all text-xs">
                        {JSON.stringify(pool, null, 2)}
                      </pre>
                      
                      {onRefreshPool && pool.poolAddress && (
                        <button
                          onClick={() => onRefreshPool(pool.poolAddress!)}
                          className="mt-2 px-2 py-1 bg-purple-600/20 text-purple-400 rounded text-xs hover:bg-purple-600/30"
                        >
                          Refresh This Pool
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h5 className="text-xs font-medium text-slate-300 mb-2">Fee Analysis</h5>
          <div className="text-xs text-slate-400 space-y-1">
            <div>Pools with Deposit Fees: {pools.filter(p => p.depositFee > 0).length}</div>
            <div>Pools with Withdrawal Fees: {pools.filter(p => p.withdrawalFee > 0).length}</div>
            <div>Max Deposit Fee: {Math.max(...pools.map(p => p.depositFee))} BP</div>
            <div>Max Withdrawal Fee: {Math.max(...pools.map(p => p.withdrawalFee))} BP</div>
            <div>Avg Allocation Points: {Math.round(pools.reduce((sum, p) => sum + p.allocationPoints, 0) / pools.length)}</div>
          </div>
        </div>
      </div>
    </div>
  )
}