// components/overview/PoolsDisplay.tsx
import React, { useState } from 'react'
import { 
  BarChart3Icon,
  DatabaseIcon,
  LockIcon,
  TrendingUpIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  InfoIcon
} from '../icons'
import type { SystemTVL, PoolTVLData, LockerTVLData } from '../../services/tvlAprService'

interface PoolsDisplayProps {
  systemTVL: SystemTVL
}

export function PoolsDisplay({ systemTVL }: PoolsDisplayProps) {
  const [expandedSections, setExpandedSections] = useState({
    lpPools: true,
    singlePools: true,
    lockerPools: true
  })

  const formatCurrency = (amount: number): string => {
    if (amount >= 1e9) return `$${(amount / 1e9).toFixed(2)}B`
    if (amount >= 1e6) return `$${(amount / 1e6).toFixed(2)}M`
    if (amount >= 1e3) return `$${(amount / 1e3).toFixed(1)}K`
    return `$${amount.toFixed(2)}`
  }

  const formatAPR = (apr: number): string => {
    return `${apr.toFixed(1)}%`
  }

  const getAPRColor = (apr: number): string => {
    if (apr >= 100) return 'text-red-400'
    if (apr >= 50) return 'text-orange-400'
    if (apr >= 20) return 'text-yellow-400'
    if (apr >= 10) return 'text-green-400'
    return 'text-blue-400'
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const PoolCard = ({ pool, type }: { pool: PoolTVLData, type: 'LP' | 'Single' }) => (
    <div className="bg-slate-700/30 backdrop-blur-sm border border-slate-600/30 rounded-lg p-4 hover:bg-slate-700/50 transition-all">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <h4 className="text-white font-medium">{pool.poolName}</h4>
            <span className={`text-xs px-2 py-1 rounded ${
              type === 'LP' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
            }`}>
              {type}
            </span>
          </div>
          <div className="text-slate-400 text-sm">
            {pool.totalStakedFormatted.toLocaleString()} {type === 'LP' ? 'LP tokens' : 'tokens'} • 
            ${pool.tokenPrice.toFixed(6)} • {pool.priceSource}
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-white font-bold text-lg">{formatCurrency(pool.tvlUSD)}</div>
          <div className="text-slate-400 text-sm">{pool.allocationPoints} pts</div>
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <TrendingUpIcon className="w-4 h-4 text-green-400" />
          <span className="text-slate-300 text-sm">APR</span>
          {pool.aprBreakdown && (
            <InfoIcon className="w-4 h-4 text-slate-400" title="Click for APR breakdown" />
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={`text-xl font-bold ${getAPRColor(pool.apr)}`}>
            {formatAPR(pool.apr)}
          </span>
          {pool.apr === 0 && <span className="text-slate-400 text-sm">(Calculating...)</span>}
        </div>
      </div>
      
      {/* APR Breakdown Preview */}
      {pool.aprBreakdown && pool.apr > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-600/30">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400">Base APR:</span>
              <span className="text-white ml-1">{pool.aprBreakdown.baseAPR.toFixed(1)}%</span>
            </div>
            <div>
              <span className="text-slate-400">Bonus:</span>
              <span className="text-green-400 ml-1">+{pool.aprBreakdown.bonusAPR.toFixed(1)}%</span>
            </div>
            <div>
              <span className="text-slate-400">Daily Rewards:</span>
              <span className="text-purple-400 ml-1">${pool.aprBreakdown.dailyRewardsUSD.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-slate-400">Pool Share:</span>
              <span className="text-blue-400 ml-1">{(pool.aprBreakdown.poolShare * 100).toFixed(2)}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const LockerCard = ({ pool }: { pool: LockerTVLData }) => (
    <div className="bg-slate-700/30 backdrop-blur-sm border border-slate-600/30 rounded-lg p-4 hover:bg-slate-700/50 transition-all">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <LockIcon className="w-4 h-4 text-orange-400" />
            <h4 className="text-white font-medium">{pool.lockPeriodName}</h4>
            <span className="text-xs px-2 py-1 rounded bg-orange-500/20 text-orange-400">
              {pool.lockPeriod} days
            </span>
          </div>
          <div className="text-slate-400 text-sm">
            {pool.totalLockedFormatted.toLocaleString()} VICTORY • 
            ${pool.victoryPrice.toFixed(4)} • {pool.allocationPercentage.toFixed(1)}% allocation
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-white font-bold text-lg">{formatCurrency(pool.tvlUSD)}</div>
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <TrendingUpIcon className="w-4 h-4 text-orange-400" />
          <span className="text-slate-300 text-sm">Estimated APR</span>
          {pool.aprBreakdown && (
            <InfoIcon className="w-4 h-4 text-slate-400" title="APR breakdown available" />
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={`text-xl font-bold ${getAPRColor(pool.estimatedAPR)}`}>
            {formatAPR(pool.estimatedAPR)}
          </span>
          {pool.estimatedAPR === 0 && <span className="text-slate-400 text-sm">(Calculating...)</span>}
        </div>
      </div>

      {/* Lock Period Incentive */}
      <div className="mt-3 pt-3 border-t border-slate-600/30">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-400">Lock Incentive:</span>
          <div className="flex items-center space-x-2">
            {pool.lockPeriod >= 1095 && (
              <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded">Max Yield</span>
            )}
            {pool.lockPeriod >= 365 && pool.lockPeriod < 1095 && (
              <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded">High Yield</span>
            )}
            {pool.lockPeriod >= 90 && pool.lockPeriod < 365 && (
              <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded">Medium Yield</span>
            )}
            {pool.lockPeriod < 90 && (
              <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded">Flexible</span>
            )}
          </div>
        </div>

        {/* APR Breakdown for Locker */}
        {pool.aprBreakdown && pool.estimatedAPR > 0 && (
          <div className="grid grid-cols-2 gap-3 text-xs mt-2">
            <div>
              <span className="text-slate-400">Base APR:</span>
              <span className="text-white ml-1">{pool.aprBreakdown.baseAPR.toFixed(1)}%</span>
            </div>
            <div>
              <span className="text-slate-400">Lock Bonus:</span>
              <span className="text-orange-400 ml-1">+{pool.aprBreakdown.bonusAPR.toFixed(1)}%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  const SectionHeader = ({ 
    title, 
    icon, 
    count, 
    totalTVL, 
    sectionKey, 
    color 
  }: {
    title: string
    icon: React.ReactNode
    count: number
    totalTVL: number
    sectionKey: keyof typeof expandedSections
    color: string
  }) => (
    <div 
      className="flex items-center justify-between p-4 bg-slate-800/50 backdrop-blur-sm border border-slate-700/30 rounded-lg cursor-pointer hover:bg-slate-800/70 transition-all"
      onClick={() => toggleSection(sectionKey)}
    >
      <div className="flex items-center space-x-3">
        <div className={`w-10 h-10 rounded-lg bg-${color}-500/20 flex items-center justify-center`}>
          {icon}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <div className="text-slate-400 text-sm">{count} pools • {formatCurrency(totalTVL)} TVL</div>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <div className="text-right mr-2">
          <div className={`text-lg font-bold text-${color}-400`}>{formatCurrency(totalTVL)}</div>
          <div className="text-slate-400 text-sm">{count} pools</div>
        </div>
        {expandedSections[sectionKey] ? 
          <ChevronUpIcon className="w-5 h-5 text-slate-400" /> : 
          <ChevronDownIcon className="w-5 h-5 text-slate-400" />
        }
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* LP Pools Section */}
      <div>
        <SectionHeader 
          title="LP Pools"
          icon={<BarChart3Icon className="w-5 h-5 text-green-400" />}
          count={systemTVL.farmTVL.lpPools.length}
          totalTVL={systemTVL.farmTVL.totalLPTVL}
          sectionKey="lpPools"
          color="green"
        />
        
        {expandedSections.lpPools && (
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
            {systemTVL.farmTVL.lpPools.map((pool) => (
              <PoolCard key={pool.poolId} pool={pool} type="LP" />
            ))}
            {systemTVL.farmTVL.lpPools.length === 0 && (
              <div className="col-span-2 text-center text-slate-400 py-8">
                No LP pools found
              </div>
            )}
          </div>
        )}
      </div>

      {/* Single Asset Pools Section */}
      <div>
        <SectionHeader 
          title="Single Asset Pools"
          icon={<BarChart3Icon className="w-5 h-5 text-blue-400" />}
          count={systemTVL.farmTVL.singlePools.length}
          totalTVL={systemTVL.farmTVL.totalSingleTVL}
          sectionKey="singlePools"
          color="blue"
        />
        
        {expandedSections.singlePools && (
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
            {systemTVL.farmTVL.singlePools.map((pool) => (
              <PoolCard key={pool.poolId} pool={pool} type="Single" />
            ))}
            {systemTVL.farmTVL.singlePools.length === 0 && (
              <div className="col-span-2 text-center text-slate-400 py-8">
                No single asset pools found
              </div>
            )}
          </div>
        )}
      </div>

      {/* Victory Locker Section */}
      <div>
        <SectionHeader 
          title="Victory Staking Pools"
          icon={<DatabaseIcon className="w-5 h-5 text-orange-400" />}
          count={systemTVL.lockerTVL.pools.length}
          totalTVL={systemTVL.lockerTVL.totalLockerTVL}
          sectionKey="lockerPools"
          color="orange"
        />
        
        {expandedSections.lockerPools && (
          <div className="mt-4 space-y-4">
            {/* Lock Period Pools */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {systemTVL.lockerTVL.pools.map((pool) => (
                <LockerCard key={pool.lockPeriod} pool={pool} />
              ))}
            </div>

            {/* Reward Pools Info */}
            <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/30 rounded-lg p-4">
              <h4 className="text-slate-300 font-medium mb-3 flex items-center space-x-2">
                <DatabaseIcon className="w-4 h-4 text-purple-400" />
                <span>Reward Pools</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex justify-between items-center p-3 bg-slate-700/20 rounded-lg">
                  <span className="text-slate-300">SUI Rewards Pool</span>
                  <span className="text-blue-400 font-medium">
                    {formatCurrency(systemTVL.lockerTVL.suiRewardsPool)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-700/20 rounded-lg">
                  <span className="text-slate-300">Victory Rewards Pool</span>
                  <span className="text-purple-400 font-medium">
                    {formatCurrency(systemTVL.lockerTVL.victoryRewardsPool)}
                  </span>
                </div>
              </div>
            </div>

            {systemTVL.lockerTVL.pools.length === 0 && (
              <div className="text-center text-slate-400 py-8">
                No victory staking pools found
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}