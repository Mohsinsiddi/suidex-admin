// components/tokenlocker/LoadingSkeleton.tsx
import React from 'react'

interface LoadingSkeletonProps {
  className?: string
  count?: number
  type?: 'line' | 'card' | 'stat' | 'table'
}

export default function LoadingSkeleton({ 
  className = "h-4 bg-slate-700/50 rounded animate-pulse", 
  count = 1,
  type = 'line'
}: LoadingSkeletonProps) {
  
  if (type === 'card') {
    return (
      <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-slate-700/50 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-slate-700/50 rounded w-full"></div>
          <div className="h-4 bg-slate-700/50 rounded w-2/3"></div>
          <div className="h-4 bg-slate-700/50 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (type === 'stat') {
    return (
      <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6 animate-pulse">
        <div className="h-4 bg-slate-700/50 rounded w-1/2 mb-2"></div>
        <div className="h-8 bg-slate-700/50 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-slate-700/50 rounded w-1/3"></div>
      </div>
    )
  }

  if (type === 'table') {
    return (
      <div className="space-y-4 animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-slate-700/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-slate-700/50 rounded-full"></div>
                <div>
                  <div className="h-4 bg-slate-700/50 rounded w-32 mb-2"></div>
                  <div className="h-3 bg-slate-700/50 rounded w-24"></div>
                </div>
              </div>
              <div className="h-4 bg-slate-700/50 rounded w-20"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Default line type
  return (
    <div className="space-y-2">
      {[...Array(count)].map((_, i) => (
        <div key={i} className={className}></div>
      ))}
    </div>
  )
}