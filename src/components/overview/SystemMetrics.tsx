// components/overview/SystemMetrics.tsx
import React from 'react'
import { 
  DollarSignIcon,
  BarChart3Icon,
  DatabaseIcon,
  TrendingUpIcon,
  TrendingDownIcon
} from '../icons'

interface TVLMetrics {
  current: number
  change24h: number
  changePercent: number
  trend: 'up' | 'down' | 'stable'
}

interface SystemMetricsProps {
  totalTVL: TVLMetrics
  farmTVL: TVLMetrics
  lockerTVL: TVLMetrics
}

export function SystemMetrics({ totalTVL, farmTVL, lockerTVL }: SystemMetricsProps) {
  const formatCurrency = (amount: number): string => {
    if (amount >= 1e9) return `$${(amount / 1e9).toFixed(2)}B`
    if (amount >= 1e6) return `$${(amount / 1e6).toFixed(2)}M`
    if (amount >= 1e3) return `$${(amount / 1e3).toFixed(1)}K`
    return `$${amount.toFixed(2)}`
  }

  const formatPercent = (percent: number): string => {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(1)}%`
  }

  const TrendIcon = ({ trend }: { trend: string }) => {
    if (trend === 'up') {
      return <TrendingUpIcon className="w-4 h-4 text-green-400" />
    } else if (trend === 'down') {
      return <TrendingDownIcon className="w-4 h-4 text-red-400" />
    }
    return <div className="w-4 h-4" />
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Total TVL */}
      <div className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 backdrop-blur-xl border border-purple-500/30 rounded-xl p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="text-slate-300 text-sm">Total Value Locked</div>
          <DollarSignIcon className="w-5 h-5 text-purple-400" />
        </div>
        <div className="text-3xl font-bold text-white mb-1">
          {formatCurrency(totalTVL.current)}
        </div>
        <div className="flex items-center space-x-2">
          <TrendIcon trend={totalTVL.trend} />
          <span className={`text-sm ${totalTVL.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
            {formatPercent(totalTVL.changePercent)} (24h)
          </span>
        </div>
      </div>

      {/* Farm TVL */}
      <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 backdrop-blur-xl border border-green-500/30 rounded-xl p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="text-slate-300 text-sm">Farm TVL</div>
          <BarChart3Icon className="w-5 h-5 text-green-400" />
        </div>
        <div className="text-3xl font-bold text-white mb-1">
          {formatCurrency(farmTVL.current)}
        </div>
        <div className="flex items-center space-x-2">
          <TrendIcon trend={farmTVL.trend} />
          <span className={`text-sm ${farmTVL.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
            {formatPercent(farmTVL.changePercent)} (24h)
          </span>
        </div>
      </div>

      {/* Locker TVL */}
      <div className="bg-gradient-to-br from-orange-600/20 to-red-600/20 backdrop-blur-xl border border-orange-500/30 rounded-xl p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="text-slate-300 text-sm">Locker TVL</div>
          <DatabaseIcon className="w-5 h-5 text-orange-400" />
        </div>
        <div className="text-3xl font-bold text-white mb-1">
          {formatCurrency(lockerTVL.current)}
        </div>
        <div className="flex items-center space-x-2">
          <TrendIcon trend={lockerTVL.trend} />
          <span className={`text-sm ${lockerTVL.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
            {formatPercent(lockerTVL.changePercent)} (24h)
          </span>
        </div>
      </div>
    </div>
  )
}