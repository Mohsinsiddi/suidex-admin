// components/overview/PoolsDisplay.tsx - Enhanced with emission-based APR support
import React, { useState } from 'react'
import { 
  BarChart3Icon,
  DatabaseIcon,
  LockIcon,
  TrendingUpIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  InfoIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  DollarSignIcon,
  TrendingDownIcon,
  ZapIcon
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

  const [expandedPoolDetails, setExpandedPoolDetails] = useState<Set<string>>(new Set())

  const formatCurrency = (amount: number): string => {
    if (amount >= 1e9) return `$${(amount / 1e9).toFixed(2)}B`
    if (amount >= 1e6) return `$${(amount / 1e6).toFixed(2)}M`
    if (amount >= 1e3) return `$${(amount / 1e3).toFixed(1)}K`
    return `$${amount.toFixed(2)}`
  }

  const formatNumber = (amount: number, decimals: number = 2): string => {
    if (amount >= 1e9) return `${(amount / 1e9).toFixed(decimals)}B`
    if (amount >= 1e6) return `${(amount / 1e6).toFixed(decimals)}M`
    if (amount >= 1e3) return `${(amount / 1e3).toFixed(decimals)}K`
    return amount.toFixed(decimals)
  }

  const formatAPR = (apr: number): string => {
    return `${apr.toFixed(1)}%`
  }

  const getAPRColor = (apr: number): string => {
    if (apr >= 100) return 'text-red-400'
    if (apr >= 50) return 'text-orange-400'  
    if (apr >= 20) return 'text-yellow-400'
    if (apr >= 10) return 'text-green-400'
    if (apr > 0) return 'text-blue-400'
    return 'text-gray-400'
  }

  const getAPRStatus = (pool: PoolTVLData) => {
    if (!pool.aprBreakdown) {
      return {
        icon: <AlertCircleIcon className="w-4 h-4 text-yellow-400" />,
        status: 'Calculating...',
        color: 'text-yellow-400',
        tooltip: 'APR is being calculated using fallback method'
      }
    }
    
    if (pool.aprBreakdown.emissionWeek > 0) {
      return {
        icon: <CheckCircleIcon className="w-4 h-4 text-green-400" />,
        status: 'Live Emissions',
        color: 'text-green-400',
        tooltip: `Real-time APR based on week ${pool.aprBreakdown.emissionWeek} emissions`
      }
    }
    
    return {
      icon: <AlertCircleIcon className="w-4 h-4 text-orange-400" />,
      status: 'Estimated',
      color: 'text-orange-400', 
      tooltip: 'APR estimated - emission data not available'
    }
  }

  const getStakingStatus = (totalStakedFormatted: number) => {
    if (totalStakedFormatted === 0) {
      return {
        icon: <TrendingDownIcon className="w-4 h-4 text-gray-400" />,
        status: 'No Stakes',
        color: 'text-gray-400'
      }
    } else if (totalStakedFormatted < 1) {
      return {
        icon: <ClockIcon className="w-4 h-4 text-yellow-400" />,
        status: 'Low Activity',
        color: 'text-yellow-400'
      }
    } else {
      return {
        icon: <TrendingUpIcon className="w-4 h-4 text-green-400" />,
        status: 'Active',
        color: 'text-green-400'
      }
    }
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const togglePoolDetails = (poolId: string) => {
    setExpandedPoolDetails(prev => {
      const newSet = new Set(prev)
      if (newSet.has(poolId)) {
        newSet.delete(poolId)
      } else {
        newSet.add(poolId)
      }
      return newSet
    })
  }

  const PoolCard = ({ pool, type }: { pool: PoolTVLData, type: 'LP' | 'Single' }) => {
    const aprStatus = getAPRStatus(pool)
    const stakingStatus = getStakingStatus(pool.totalStakedFormatted)
    const isExpanded = expandedPoolDetails.has(pool.poolId)

    return (
      <div className="bg-slate-700/30 backdrop-blur-sm border border-slate-600/30 rounded-lg p-4 hover:bg-slate-700/50 transition-all">
        {/* Main Pool Info */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="text-white font-medium">{pool.poolName}</h4>
              <span className={`text-xs px-2 py-1 rounded ${
                type === 'LP' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
              }`}>
                {type}
              </span>
              <div className="flex items-center space-x-1" title={stakingStatus.status}>
                {stakingStatus.icon}
                <span className={`text-xs ${stakingStatus.color}`}>
                  {stakingStatus.status}
                </span>
              </div>
            </div>
            
            {/* Enhanced Staking Information */}
            <div className="text-slate-400 text-sm space-y-1">
              <div className="flex items-center space-x-3">
                <span>💰 {formatNumber(pool.totalStakedFormatted)} {type === 'LP' ? 'LP tokens' : 'tokens'}</span>
                <span>📊 ${pool.tokenPrice.toFixed(6)}</span>
                <span className="text-xs px-2 py-1 bg-slate-600/30 rounded">{pool.priceSource}</span>
              </div>
              <div className="flex items-center space-x-3 text-xs">
                <span>Allocation: {pool.allocationPoints} pts</span>
                <span className={pool.isActive ? 'text-green-400' : 'text-red-400'}>
                  {pool.isActive ? '🟢 Active' : '🔴 Inactive'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-white font-bold text-lg">{formatCurrency(pool.tvlUSD)}</div>
            <div className="text-slate-400 text-sm">TVL</div>
          </div>
        </div>
        
        {/* APR Section with Status */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center space-x-2">
            {aprStatus.icon}
            <span className="text-slate-300 text-sm">APR</span>
            <span className={`text-xs ${aprStatus.color}`} title={aprStatus.tooltip}>
              {aprStatus.status}
            </span>
            {pool.aprBreakdown && (
              <button
                onClick={() => togglePoolDetails(pool.poolId)}
                className="text-slate-400 hover:text-white transition-colors"
                title="Click for detailed APR breakdown"
              >
                <InfoIcon className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <span className={`text-xl font-bold ${getAPRColor(pool.apr)}`}>
              {formatAPR(pool.apr)}
            </span>
            {pool.apr === 0 && <span className="text-slate-400 text-sm">(Calculating...)</span>}
          </div>
        </div>
        
        {/* Quick APR Preview */}
        {pool.aprBreakdown && pool.apr > 0 && (
          <div className="mb-3 pt-3 border-t border-slate-600/30">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center space-x-1">
                <span className="text-slate-400">Base:</span>
                <span className="text-white">{pool.aprBreakdown.baseAPR.toFixed(1)}%</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-slate-400">Bonus:</span>
                <span className="text-green-400">+{pool.aprBreakdown.bonusAPR.toFixed(1)}%</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-slate-400">Daily Rewards:</span>
                <span className="text-purple-400">${pool.aprBreakdown.dailyRewardsUSD.toFixed(2)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-slate-400">Pool Share:</span>
                <span className="text-blue-400">{(pool.aprBreakdown.poolShare * 100).toFixed(2)}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Expanded Details */}
        {isExpanded && pool.aprBreakdown && (
          <div className="mt-4 pt-4 border-t border-slate-600/30 space-y-3">
            <h5 className="text-white font-medium flex items-center space-x-2">
              <ZapIcon className="w-4 h-4 text-yellow-400" />
              <span>Detailed APR Breakdown</span>
            </h5>
            
            {/* Emission Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h6 className="text-slate-300 text-sm font-medium">Emission Data</h6>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Emission Week:</span>
                    <span className="text-white">{pool.aprBreakdown.emissionWeek || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">VICTORY/Second:</span>
                    <span className="text-green-400">{pool.aprBreakdown.victoryRewardsPerSecond.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">VICTORY/Day:</span>
                    <span className="text-green-400">{formatNumber(pool.aprBreakdown.victoryRewardsPerDay, 2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">VICTORY/Year:</span>
                    <span className="text-green-400">{formatNumber(pool.aprBreakdown.victoryRewardsAnnual, 0)}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h6 className="text-slate-300 text-sm font-medium">USD Values</h6>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Daily USD:</span>
                    <span className="text-yellow-400">${pool.aprBreakdown.dailyRewardsUSD.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Annual USD:</span>
                    <span className="text-yellow-400">${formatNumber(pool.aprBreakdown.annualRewardsUSD, 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Base APR:</span>
                    <span className="text-blue-400">{pool.aprBreakdown.baseAPR.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total APR:</span>
                    <span className={getAPRColor(pool.aprBreakdown.totalAPR)}>
                      {pool.aprBreakdown.totalAPR.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pool Statistics */}
            <div className="pt-3 border-t border-slate-600/30">
              <h6 className="text-slate-300 text-sm font-medium mb-2">Pool Statistics</h6>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <div className="text-center p-2 bg-slate-800/30 rounded">
                  <div className="text-slate-400">Allocation Share</div>
                  <div className="text-white font-medium">
                    {(pool.aprBreakdown.poolShare * 100).toFixed(3)}%
                  </div>
                </div>
                <div className="text-center p-2 bg-slate-800/30 rounded">
                  <div className="text-slate-400">Reward Tokens</div>
                  <div className="text-purple-400 font-medium">
                    {pool.aprBreakdown.rewardTokens.join(', ')}
                  </div>
                </div>
                <div className="text-center p-2 bg-slate-800/30 rounded">
                  <div className="text-slate-400">Staking Ratio</div>
                  <div className="text-green-400 font-medium">
                    {pool.totalStakedFormatted > 0 ? 
                      `${(pool.tvlUSD / pool.totalStakedFormatted).toFixed(2)}x` : 
                      'N/A'
                    }
                  </div>
                </div>
                <div className="text-center p-2 bg-slate-800/30 rounded">
                  <div className="text-slate-400">Last Updated</div>
                  <div className="text-blue-400 font-medium">
                    {new Date(pool.lastUpdated).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  const LockerCard = ({ pool }: { pool: LockerTVLData }) => {
    const isExpanded = expandedPoolDetails.has(`locker_${pool.lockPeriod}`)
    const stakingStatus = getStakingStatus(pool.totalLockedFormatted)

    return (
      <div className="bg-slate-700/30 backdrop-blur-sm border border-slate-600/30 rounded-lg p-4 hover:bg-slate-700/50 transition-all">
        {/* Main Locker Info */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <LockIcon className="w-4 h-4 text-orange-400" />
              <h4 className="text-white font-medium">{pool.lockPeriodName}</h4>
              <span className="text-xs px-2 py-1 rounded bg-orange-500/20 text-orange-400">
                {pool.lockPeriod} days
              </span>
              <div className="flex items-center space-x-1" title={stakingStatus.status}>
                {stakingStatus.icon}
                <span className={`text-xs ${stakingStatus.color}`}>
                  {stakingStatus.status}
                </span>
              </div>
            </div>
            
            <div className="text-slate-400 text-sm space-y-1">
              <div className="flex items-center space-x-3">
                <span>🔒 {formatNumber(pool.totalLockedFormatted)} VICTORY</span>
                <span>💰 ${pool.victoryPrice.toFixed(4)}</span>
                <span className="text-xs px-2 py-1 bg-slate-600/30 rounded">
                  {pool.allocationPercentage.toFixed(1)}% allocation
                </span>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-white font-bold text-lg">{formatCurrency(pool.tvlUSD)}</div>
            <div className="text-slate-400 text-sm">Locked Value</div>
          </div>
        </div>
        
        {/* APR Section */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center space-x-2">
            <TrendingUpIcon className="w-4 h-4 text-orange-400" />
            <span className="text-slate-300 text-sm">Estimated APR</span>
            {pool.aprBreakdown && (
              <button
                onClick={() => togglePoolDetails(`locker_${pool.lockPeriod}`)}
                className="text-slate-400 hover:text-white transition-colors"
                title="Click for APR breakdown"
              >
                <InfoIcon className="w-4 h-4" />
              </button>
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
        <div className="mb-3 pt-3 border-t border-slate-600/30">
          <div className="flex justify-between items-center text-xs mb-2">
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

          {/* Quick APR Breakdown for Locker */}
          {pool.aprBreakdown && pool.estimatedAPR > 0 && (
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Base APR:</span>
                <span className="text-white">{pool.aprBreakdown.baseAPR.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Lock Bonus:</span>
                <span className="text-orange-400">+{pool.aprBreakdown.bonusAPR.toFixed(1)}%</span>
              </div>
            </div>
          )}
        </div>

        {/* Expanded Locker Details */}
        {isExpanded && pool.aprBreakdown && (
          <div className="mt-4 pt-4 border-t border-slate-600/30 space-y-3">
            <h5 className="text-white font-medium flex items-center space-x-2">
              <LockIcon className="w-4 h-4 text-orange-400" />
              <span>Victory Staking Details</span>
            </h5>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h6 className="text-slate-300 text-sm font-medium">Lock Period Info</h6>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Lock Duration:</span>
                    <span className="text-white">{pool.lockPeriod} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Allocation %:</span>
                    <span className="text-orange-400">{pool.allocationPercentage.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Emission Week:</span>
                    <span className="text-white">{pool.aprBreakdown.emissionWeek || 'N/A'}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h6 className="text-slate-300 text-sm font-medium">Reward Estimates</h6>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Daily VICTORY:</span>
                    <span className="text-green-400">{formatNumber(pool.aprBreakdown.victoryRewardsPerDay, 2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Daily USD:</span>
                    <span className="text-yellow-400">${pool.aprBreakdown.dailyRewardsUSD.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Annual USD:</span>
                    <span className="text-yellow-400">${formatNumber(pool.aprBreakdown.annualRewardsUSD, 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

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

  // Calculate some additional metrics for display
  const totalPools = systemTVL.farmTVL.lpPools.length + systemTVL.farmTVL.singlePools.length
  const poolsWithStaking = [...systemTVL.farmTVL.lpPools, ...systemTVL.farmTVL.singlePools]
    .filter(p => p.totalStakedFormatted > 0).length
  const avgAPR = totalPools > 0 
    ? [...systemTVL.farmTVL.lpPools, ...systemTVL.farmTVL.singlePools]
        .reduce((sum, p) => sum + p.apr, 0) / totalPools 
    : 0

  return (
    <div className="space-y-6">
      {/* System Overview */}
      <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/30 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center space-x-2">
          <DatabaseIcon className="w-5 h-5 text-blue-400" />
          <span>System Overview</span>
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-slate-400">Total Pools</div>
            <div className="text-white font-bold text-lg">{totalPools + systemTVL.lockerTVL.pools.length}</div>
          </div>
          <div className="text-center">
            <div className="text-slate-400">Active Pools</div>
            <div className="text-green-400 font-bold text-lg">{poolsWithStaking}</div>
          </div>
          <div className="text-center">
            <div className="text-slate-400">Avg Farm APR</div>
            <div className={`font-bold text-lg ${getAPRColor(avgAPR)}`}>
              {formatAPR(avgAPR)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-slate-400">Last Updated</div>
            <div className="text-blue-400 font-bold text-sm">
              {new Date(systemTVL.metadata.lastUpdated).toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

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
                <DollarSignIcon className="w-4 h-4 text-purple-400" />
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

      {/* Debug Information */}
      {systemTVL.metadata.errors.length > 0 || systemTVL.metadata.warnings.length > 0 ? (
        <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/30 rounded-lg p-4">
          <h4 className="text-slate-300 font-medium mb-3 flex items-center space-x-2">
            <AlertCircleIcon className="w-4 h-4 text-yellow-400" />
            <span>System Status</span>
          </h4>
          
          {systemTVL.metadata.warnings.length > 0 && (
            <div className="mb-3">
              <h5 className="text-yellow-400 text-sm font-medium mb-2">Warnings:</h5>
              <ul className="text-xs text-slate-400 space-y-1">
                {systemTVL.metadata.warnings.map((warning, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <AlertCircleIcon className="w-3 h-3 text-yellow-400 flex-shrink-0" />
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {systemTVL.metadata.errors.length > 0 && (
            <div>
              <h5 className="text-red-400 text-sm font-medium mb-2">Errors:</h5>
              <ul className="text-xs text-slate-400 space-y-1">
                {systemTVL.metadata.errors.map((error, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <AlertCircleIcon className="w-3 h-3 text-red-400 flex-shrink-0" />
                    <span>{error}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}