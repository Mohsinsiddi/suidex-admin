// utils/emissionUtils.ts - FIXED TIME CALCULATIONS
import { Transaction } from '@mysten/sui/transactions'
import { suiClient } from './suiClient'
import { CONSTANTS } from '../constants'

export interface EmissionStatus {
  currentWeek: number
  currentPhase: number
  phaseName: string
  isActive: boolean
  isPaused: boolean
  emissionStartTimestamp: number
  currentTimestamp: number
  weekProgress: number // 0-100 percentage
  remainingTimeInWeek: number // seconds
  totalRemainingTime: number // seconds until end of emissions
}

export interface CurrentEmissionRates {
  totalPerSecond: string // Total Victory tokens per second
  lpPerSecond: string
  singlePerSecond: string
  victoryStakingPerSecond: string
  devPerSecond: string
  // Allocation percentages
  lpPercent: number
  singlePercent: number
  victoryStakingPercent: number
  devPercent: number
}

export interface WeeklyBreakdown {
  week: number
  phase: number
  phaseName: string
  totalEmissionRate: string
  lpAllocation: string
  singleAllocation: string
  victoryStakingAllocation: string
  devAllocation: string
  weeklyTotal: string
  startDate: Date
  endDate: Date
  isActive: boolean
  isCompleted: boolean
}

export interface EmissionPhaseInfo {
  phase: number
  name: string
  description: string
  weekRange: string
  baseRate: string
  characteristics: string[]
  color: string
}

// Constants from the smart contract
const EMISSION_CONSTANTS = {
  SECONDS_PER_WEEK: 604800, // 7 * 24 * 60 * 60
  BASIS_POINTS: 10000,
  BOOTSTRAP_PHASE_EMISSION_RATE: 6600000, // 6.6 Victory/sec
  POST_BOOTSTRAP_START_RATE: 5470000, // 5.47 Victory/sec
  WEEKLY_DECAY_RATE: 9900, // 99% = 1% decay per week
  TOTAL_EMISSION_WEEKS: 156, // 3 years total
  VICTORY_DECIMALS: 6
}

// Phase information
export const EMISSION_PHASES: EmissionPhaseInfo[] = [
  {
    phase: 0,
    name: 'Not Started',
    description: 'Emission schedule has not been initialized',
    weekRange: 'N/A',
    baseRate: '0',
    characteristics: ['No emissions', 'Waiting for admin initialization'],
    color: 'bg-gray-500'
  },
  {
    phase: 1,
    name: 'Bootstrap Phase',
    description: 'High emission rate to incentivize early adopters',
    weekRange: 'Weeks 1-4',
    baseRate: '6.6 Victory/sec',
    characteristics: ['Highest emission rate', 'LP-focused incentives', 'Initial liquidity building'],
    color: 'bg-green-500'
  },
  {
    phase: 2,
    name: 'Post-Bootstrap Phase',
    description: 'Gradual decay with shifting allocation priorities',
    weekRange: 'Weeks 5-156',
    baseRate: '5.47 Victory/sec (Week 5, then 1% weekly decay)',
    characteristics: ['1% weekly decay', 'Shifting allocations', 'Long-term sustainability'],
    color: 'bg-blue-500'
  },
  {
    phase: 3,
    name: 'Ended',
    description: 'All emissions have been completed',
    weekRange: 'After Week 156',
    baseRate: '0',
    characteristics: ['No new emissions', 'System complete'],
    color: 'bg-red-500'
  }
]

// Get allocation percentages for any week
export const getWeekAllocationPercentages = (week: number): {
  lpPercent: number
  singlePercent: number
  victoryStakingPercent: number
  devPercent: number
} => {
  if (week <= 4) return { lpPercent: 6500, singlePercent: 1500, victoryStakingPercent: 1750, devPercent: 250 }
  if (week <= 12) return { lpPercent: 6200, singlePercent: 1200, victoryStakingPercent: 2350, devPercent: 250 }
  if (week <= 26) return { lpPercent: 5800, singlePercent: 700, victoryStakingPercent: 3250, devPercent: 250 }
  if (week <= 52) return { lpPercent: 5500, singlePercent: 200, victoryStakingPercent: 4050, devPercent: 250 }
  if (week <= 104) return { lpPercent: 5000, singlePercent: 0, victoryStakingPercent: 4750, devPercent: 250 }
  if (week <= 156) return { lpPercent: 4500, singlePercent: 0, victoryStakingPercent: 5250, devPercent: 250 }
  
  return { lpPercent: 0, singlePercent: 0, victoryStakingPercent: 0, devPercent: 0 }
}

// Calculate total emission for any week
export const calculateTotalEmissionForWeek = (week: number): number => {
  if (week <= 4) {
    return EMISSION_CONSTANTS.BOOTSTRAP_PHASE_EMISSION_RATE
  } else if (week === 5) {
    return EMISSION_CONSTANTS.POST_BOOTSTRAP_START_RATE
  } else if (week <= EMISSION_CONSTANTS.TOTAL_EMISSION_WEEKS) {
    const decayWeeks = week - 5
    let currentEmission = EMISSION_CONSTANTS.POST_BOOTSTRAP_START_RATE
    
    for (let i = 0; i < decayWeeks; i++) {
      currentEmission = Math.floor((currentEmission * EMISSION_CONSTANTS.WEEKLY_DECAY_RATE) / 10000)
    }
    
    return currentEmission
  }
  
  return 0
}

// 🔥 FIXED: Calculate current week based on emission start timestamp
export const calculateCurrentWeek = (emissionStartTimestamp: number, currentTimestamp: number): number => {
  console.log('🔍 calculateCurrentWeek:', { emissionStartTimestamp, currentTimestamp })
  
  // Convert string timestamps to numbers if needed
  const startTime = typeof emissionStartTimestamp === 'string' ? parseInt(emissionStartTimestamp) : emissionStartTimestamp
  const currentTime = typeof currentTimestamp === 'string' ? parseInt(currentTimestamp) : currentTimestamp
  
  console.log('🔍 Converted timestamps:', { startTime, currentTime })
  
  if (startTime === 0 || isNaN(startTime) || isNaN(currentTime)) {
    console.log('⚠️ Emission not initialized or invalid timestamps')
    return 0
  }
  
  if (currentTime < startTime) {
    console.log('⚠️ Current time is before emission start')
    return 0
  }
  
  const elapsedSeconds = currentTime - startTime
  const weeksElapsed = Math.floor(elapsedSeconds / EMISSION_CONSTANTS.SECONDS_PER_WEEK)
  const currentWeek = weeksElapsed + 1 // Week 1 starts immediately
  
  console.log('📊 Week calculation:', {
    elapsedSeconds,
    weeksElapsed,
    currentWeek,
    elapsedDays: elapsedSeconds / 86400
  })
  
  return Math.min(currentWeek, EMISSION_CONSTANTS.TOTAL_EMISSION_WEEKS)
}

// 🔥 FIXED: Calculate week progress percentage
export const calculateWeekProgress = (emissionStartTimestamp: number, currentTimestamp: number, currentWeek: number): number => {
  console.log('🔍 calculateWeekProgress:', { emissionStartTimestamp, currentTimestamp, currentWeek })
  
  // Convert string timestamps to numbers if needed
  const startTime = typeof emissionStartTimestamp === 'string' ? parseInt(emissionStartTimestamp) : emissionStartTimestamp
  const currentTime = typeof currentTimestamp === 'string' ? parseInt(currentTimestamp) : currentTimestamp
  
  console.log('🔍 Converted timestamps:', { startTime, currentTime })
  
  if (currentWeek === 0 || startTime === 0 || isNaN(startTime) || isNaN(currentTime)) {
    console.log('⚠️ Week progress = 0 (not started or invalid timestamps)')
    return 0
  }
  
  // Calculate when the current week started and ends
  const weekStartTimestamp = startTime + ((currentWeek - 1) * EMISSION_CONSTANTS.SECONDS_PER_WEEK)
  const weekEndTimestamp = weekStartTimestamp + EMISSION_CONSTANTS.SECONDS_PER_WEEK
  
  // Validate timestamps before creating Date objects
  const isValidTimestamp = (ts: number) => ts > 0 && ts < 4102444800 // Valid until year 2100
  
  if (!isValidTimestamp(weekStartTimestamp) || !isValidTimestamp(weekEndTimestamp) || !isValidTimestamp(currentTime)) {
    console.log('⚠️ Invalid timestamps detected, returning 0')
    return 0
  }
  
  console.log('📊 Week time boundaries:', {
    weekStartTimestamp,
    weekEndTimestamp,
    currentTime,
    weekStartDate: new Date(weekStartTimestamp * 1000).toISOString(),
    weekEndDate: new Date(weekEndTimestamp * 1000).toISOString(),
    currentDate: new Date(currentTime * 1000).toISOString()
  })
  
  if (currentTime >= weekEndTimestamp) {
    console.log('✅ Week completed (100%)')
    return 100
  }
  
  if (currentTime <= weekStartTimestamp) {
    console.log('⚠️ Week not started yet (0%)')
    return 0
  }
  
  const weekElapsed = currentTime - weekStartTimestamp
  const progress = Math.floor((weekElapsed / EMISSION_CONSTANTS.SECONDS_PER_WEEK) * 100)
  
  console.log('📊 Week progress calculation:', {
    weekElapsed,
    weekDuration: EMISSION_CONSTANTS.SECONDS_PER_WEEK,
    progress: progress + '%'
  })
  
  return Math.min(100, Math.max(0, progress))
}

// 🔥 FIXED: Calculate remaining time in current week
export const calculateRemainingTimeInWeek = (emissionStartTimestamp: number, currentTimestamp: number, currentWeek: number): number => {
  console.log('🔍 calculateRemainingTimeInWeek:', { emissionStartTimestamp, currentTimestamp, currentWeek })
  
  // Convert string timestamps to numbers if needed
  const startTime = typeof emissionStartTimestamp === 'string' ? parseInt(emissionStartTimestamp) : emissionStartTimestamp
  const currentTime = typeof currentTimestamp === 'string' ? parseInt(currentTimestamp) : currentTimestamp
  
  console.log('🔍 Converted timestamps:', { startTime, currentTime })
  
  if (currentWeek === 0 || startTime === 0 || isNaN(startTime) || isNaN(currentTime)) {
    console.log('⚠️ No remaining time (not started or invalid timestamps)')
    return 0
  }
  
  // Calculate when the current week ends
  const weekStartTimestamp = startTime + ((currentWeek - 1) * EMISSION_CONSTANTS.SECONDS_PER_WEEK)
  const weekEndTimestamp = weekStartTimestamp + EMISSION_CONSTANTS.SECONDS_PER_WEEK
  
  // Validate timestamps
  const isValidTimestamp = (ts: number) => ts > 0 && ts < 4102444800 // Valid until year 2100
  
  if (!isValidTimestamp(weekEndTimestamp) || !isValidTimestamp(currentTime)) {
    console.log('⚠️ Invalid timestamps detected, returning 0')
    return 0
  }
  
  console.log('📊 Remaining time calculation:', {
    weekStartTimestamp,
    weekEndTimestamp,
    currentTime,
    weekEndDate: new Date(weekEndTimestamp * 1000).toISOString()
  })
  
  const remainingSeconds = Math.max(0, weekEndTimestamp - currentTime)
  
  console.log('⏰ Remaining time in week:', {
    remainingSeconds,
    remainingHours: remainingSeconds / 3600,
    remainingDays: remainingSeconds / 86400
  })
  
  return remainingSeconds
}

// 🔥 FIXED: Calculate total remaining time until emissions end
export const calculateTotalRemainingTime = (emissionStartTimestamp: number, currentTimestamp: number): number => {
  console.log('🔍 calculateTotalRemainingTime:', { emissionStartTimestamp, currentTimestamp })
  
  // Convert string timestamps to numbers if needed
  const startTime = typeof emissionStartTimestamp === 'string' ? parseInt(emissionStartTimestamp) : emissionStartTimestamp
  const currentTime = typeof currentTimestamp === 'string' ? parseInt(currentTimestamp) : currentTimestamp
  
  console.log('🔍 Converted timestamps:', { startTime, currentTime })
  
  if (startTime === 0 || isNaN(startTime) || isNaN(currentTime)) {
    console.log('⚠️ No total remaining time (not initialized or invalid timestamps)')
    return 0
  }
  
  // Calculate when all emissions end (after 156 weeks)
  const totalEndTimestamp = startTime + (EMISSION_CONSTANTS.TOTAL_EMISSION_WEEKS * EMISSION_CONSTANTS.SECONDS_PER_WEEK)
  
  // Validate timestamps
  const isValidTimestamp = (ts: number) => ts > 0 && ts < 4102444800 // Valid until year 2100
  
  if (!isValidTimestamp(totalEndTimestamp) || !isValidTimestamp(currentTime)) {
    console.log('⚠️ Invalid timestamps detected, returning 0')
    return 0
  }
  
  console.log('📊 Total remaining time calculation:', {
    totalEndTimestamp,
    currentTime,
    endDate: new Date(totalEndTimestamp * 1000).toISOString()
  })
  
  const remainingSeconds = Math.max(0, totalEndTimestamp - currentTime)
  
  console.log('⏰ Total remaining time:', {
    remainingSeconds,
    remainingWeeks: remainingSeconds / EMISSION_CONSTANTS.SECONDS_PER_WEEK,
    remainingDays: remainingSeconds / 86400
  })
  
  return remainingSeconds
}

// Get phase from week number
export const getPhaseFromWeek = (week: number): number => {
  if (week === 0) return 0
  if (week <= 4) return 1
  if (week <= EMISSION_CONSTANTS.TOTAL_EMISSION_WEEKS) return 2
  return 3
}

// Get phase name
export const getPhaseName = (phase: number): string => {
  const phaseInfo = EMISSION_PHASES.find(p => p.phase === phase)
  return phaseInfo?.name || 'Unknown'
}

// Get current emission rates for all contracts
export const getCurrentEmissionRates = (week: number): CurrentEmissionRates => {
  const totalPerSecond = calculateTotalEmissionForWeek(week)
  const allocations = getWeekAllocationPercentages(week)
  
  const lpPerSecond = (totalPerSecond * allocations.lpPercent) / EMISSION_CONSTANTS.BASIS_POINTS
  const singlePerSecond = (totalPerSecond * allocations.singlePercent) / EMISSION_CONSTANTS.BASIS_POINTS
  const victoryStakingPerSecond = (totalPerSecond * allocations.victoryStakingPercent) / EMISSION_CONSTANTS.BASIS_POINTS
  const devPerSecond = (totalPerSecond * allocations.devPercent) / EMISSION_CONSTANTS.BASIS_POINTS
  
  return {
    totalPerSecond: formatEmissionRate(totalPerSecond),
    lpPerSecond: formatEmissionRate(lpPerSecond),
    singlePerSecond: formatEmissionRate(singlePerSecond),
    victoryStakingPerSecond: formatEmissionRate(victoryStakingPerSecond),
    devPerSecond: formatEmissionRate(devPerSecond),
    lpPercent: allocations.lpPercent / 100,
    singlePercent: allocations.singlePercent / 100,
    victoryStakingPercent: allocations.victoryStakingPercent / 100,
    devPercent: allocations.devPercent / 100
  }
}

// Format emission rate (convert from mist to Victory tokens)
export const formatEmissionRate = (rateInMist: number): string => {
  return (rateInMist / Math.pow(10, EMISSION_CONSTANTS.VICTORY_DECIMALS)).toFixed(6)
}

// 🔥 FIXED: Format time duration
export const formatDuration = (seconds: number): string => {
  console.log('🔍 formatDuration input:', seconds)
  
  if (seconds <= 0) return '0s'
  
  // Handle very large numbers gracefully
  if (seconds > 1e10) {
    console.log('⚠️ Very large duration detected, capping')
    return '> 100 years'
  }
  
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  const parts = []
  if (days > 0) parts.push(`${days}d`)
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`)
  
  const result = parts.slice(0, 2).join(' ')
  console.log('✅ formatDuration result:', result)
  return result
}

// Format large numbers
export const formatLargeNumber = (num: number): string => {
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B'
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M'
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K'
  return num.toFixed(2)
}

// Get weekly breakdown for a range of weeks
export const getWeeklyBreakdown = (
  startWeek: number, 
  endWeek: number, 
  emissionStartTimestamp: number,
  currentTimestamp: number
): WeeklyBreakdown[] => {
  const breakdown: WeeklyBreakdown[] = []
  
  for (let week = startWeek; week <= endWeek; week++) {
    const totalEmissionRate = calculateTotalEmissionForWeek(week)
    const allocations = getWeekAllocationPercentages(week)
    const phase = getPhaseFromWeek(week)
    
    const lpAllocation = (totalEmissionRate * allocations.lpPercent) / EMISSION_CONSTANTS.BASIS_POINTS
    const singleAllocation = (totalEmissionRate * allocations.singlePercent) / EMISSION_CONSTANTS.BASIS_POINTS
    const victoryStakingAllocation = (totalEmissionRate * allocations.victoryStakingPercent) / EMISSION_CONSTANTS.BASIS_POINTS
    const devAllocation = (totalEmissionRate * allocations.devPercent) / EMISSION_CONSTANTS.BASIS_POINTS
    
    const weeklyTotal = totalEmissionRate * EMISSION_CONSTANTS.SECONDS_PER_WEEK
    
    // Calculate week dates
    const weekStartTimestamp = emissionStartTimestamp + ((week - 1) * EMISSION_CONSTANTS.SECONDS_PER_WEEK)
    const weekEndTimestamp = weekStartTimestamp + EMISSION_CONSTANTS.SECONDS_PER_WEEK
    
    const startDate = new Date(weekStartTimestamp * 1000)
    const endDate = new Date(weekEndTimestamp * 1000)
    
    const currentWeek = calculateCurrentWeek(emissionStartTimestamp, currentTimestamp)
    const isActive = week === currentWeek
    const isCompleted = week < currentWeek
    
    breakdown.push({
      week,
      phase,
      phaseName: getPhaseName(phase),
      totalEmissionRate: formatEmissionRate(totalEmissionRate),
      lpAllocation: formatEmissionRate(lpAllocation),
      singleAllocation: formatEmissionRate(singleAllocation),
      victoryStakingAllocation: formatEmissionRate(victoryStakingAllocation),
      devAllocation: formatEmissionRate(devAllocation),
      weeklyTotal: formatLargeNumber(weeklyTotal / Math.pow(10, EMISSION_CONSTANTS.VICTORY_DECIMALS)),
      startDate,
      endDate,
      isActive,
      isCompleted
    })
  }
  
  return breakdown
}

// Calculate cumulative emissions up to a week
export const calculateCumulativeEmissions = (upToWeek: number): number => {
  let total = 0
  for (let week = 1; week <= upToWeek; week++) {
    const weeklyRate = calculateTotalEmissionForWeek(week)
    total += weeklyRate * EMISSION_CONSTANTS.SECONDS_PER_WEEK
  }
  return total / Math.pow(10, EMISSION_CONSTANTS.VICTORY_DECIMALS)
}

// Calculate remaining total emissions
export const calculateRemainingEmissions = (fromWeek: number): number => {
  let total = 0
  for (let week = fromWeek; week <= EMISSION_CONSTANTS.TOTAL_EMISSION_WEEKS; week++) {
    const weeklyRate = calculateTotalEmissionForWeek(week)
    total += weeklyRate * EMISSION_CONSTANTS.SECONDS_PER_WEEK
  }
  return total / Math.pow(10, EMISSION_CONSTANTS.VICTORY_DECIMALS)
}

// Validate week number
export const validateWeekNumber = (week: number): { isValid: boolean; error?: string } => {
  if (!Number.isInteger(week)) {
    return { isValid: false, error: 'Week must be a whole number' }
  }
  
  if (week < 1) {
    return { isValid: false, error: 'Week must be at least 1' }
  }
  
  if (week > EMISSION_CONSTANTS.TOTAL_EMISSION_WEEKS) {
    return { isValid: false, error: `Week cannot exceed ${EMISSION_CONSTANTS.TOTAL_EMISSION_WEEKS}` }
  }
  
  return { isValid: true }
}

// Validate timing adjustment
export const validateTimingAdjustment = (hours: number): { isValid: boolean; error?: string } => {
  if (!Number.isInteger(hours)) {
    return { isValid: false, error: 'Hours must be a whole number' }
  }
  
  if (hours < 1) {
    return { isValid: false, error: 'Hours must be at least 1' }
  }
  
  if (hours > 168) {
    return { isValid: false, error: 'Hours cannot exceed 168 (1 week)' }
  }
  
  return { isValid: true }
}

// Get next phase transition info
export const getNextPhaseTransition = (currentWeek: number): { nextPhase: number; atWeek: number; weeksUntil: number } | null => {
  if (currentWeek === 0) {
    return { nextPhase: 1, atWeek: 1, weeksUntil: 1 }
  }
  if (currentWeek <= 4) {
    return { nextPhase: 2, atWeek: 5, weeksUntil: 5 - currentWeek }
  }
  if (currentWeek < EMISSION_CONSTANTS.TOTAL_EMISSION_WEEKS) {
    return { nextPhase: 3, atWeek: EMISSION_CONSTANTS.TOTAL_EMISSION_WEEKS + 1, weeksUntil: EMISSION_CONSTANTS.TOTAL_EMISSION_WEEKS + 1 - currentWeek }
  }
  
  return null
}

// Get week performance metrics
export const getWeekPerformanceMetrics = (week: number) => {
  const currentRate = calculateTotalEmissionForWeek(week)
  const previousRate = week > 1 ? calculateTotalEmissionForWeek(week - 1) : 0
  const nextRate = week < EMISSION_CONSTANTS.TOTAL_EMISSION_WEEKS ? calculateTotalEmissionForWeek(week + 1) : 0
  
  const changeFromPrevious = previousRate > 0 ? ((currentRate - previousRate) / previousRate) * 100 : 0
  const changeToNext = currentRate > 0 ? ((nextRate - currentRate) / currentRate) * 100 : 0
  
  return {
    currentRate: formatEmissionRate(currentRate),
    previousRate: formatEmissionRate(previousRate),
    nextRate: formatEmissionRate(nextRate),
    changeFromPrevious: changeFromPrevious.toFixed(2),
    changeToNext: changeToNext.toFixed(2)
  }
}