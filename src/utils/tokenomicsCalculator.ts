// utils/tokenomicsCalculator.ts
// 🏆 Victory Token Emission Tokenomics Calculator

export interface TokenomicsSnapshot {
  // Current state
  currentWeek: number
  currentPhase: number
  weekProgress: number // 0-100
  
  // Time-based calculations
  totalElapsedSeconds: number
  currentWeekElapsedSeconds: number
  
  // Token calculations
  totalEmittedSoFar: number // Total Victory tokens emitted
  currentWeekEmitted: number // Tokens emitted in current week so far
  remainingInCurrentWeek: number // Tokens left to emit in current week
  totalRemainingEmissions: number // Total tokens left to emit
  
  // Rate information
  currentWeekRate: number // Victory/sec for current week
  currentWeekTotal: number // Total Victory tokens for entire current week
  
  // Grand totals
  totalScheduleEmissions: number // Total tokens across all 156 weeks
  emissionProgress: number // Percentage of total schedule completed (0-100)
  
  // Debug info
  calculationTimestamp: number
  emissionStartTimestamp: number
}

export interface WeeklyEmissionData {
  week: number
  phase: number
  ratePerSecond: number // Victory/sec (in microVictory)
  totalForWeek: number // Total Victory tokens for entire week
  startTimestamp: number
  endTimestamp: number
  isCompleted: boolean
  isActive: boolean
  emittedSoFar: number // How much has been emitted in this week
}

// Emission constants matching the smart contract
const TOKENOMICS_CONSTANTS = {
  SECONDS_PER_WEEK: 7 * 600, // 7 * 24 * 60 * 60, for testing 7 * 600
  VICTORY_DECIMALS: 6, // Victory token has 6 decimals
  TOTAL_WEEKS: 156,
  
  // Phase 1 (Bootstrap): Weeks 1-4
  BOOTSTRAP_RATE: 6600000, // 6.6 Victory/sec (in microVictory)
  
  // Phase 2 (Post-Bootstrap): Weeks 5-156
  POST_BOOTSTRAP_START_RATE: 5470000, // 5.47 Victory/sec (Week 5)
  WEEKLY_DECAY_RATE: 9900, // 99% (1% decay per week)
}

/**
 * Calculate the emission rate for a specific week
 */
export function calculateWeekEmissionRate(week: number): number {
  if (week <= 0 || week > TOKENOMICS_CONSTANTS.TOTAL_WEEKS) {
    return 0
  }
  
  if (week <= 4) {
    // Bootstrap phase: constant 6.6 Victory/sec
    return TOKENOMICS_CONSTANTS.BOOTSTRAP_RATE
  }
  
  if (week === 5) {
    // Week 5: starting rate for post-bootstrap
    return TOKENOMICS_CONSTANTS.POST_BOOTSTRAP_START_RATE
  }
  
  // Week 6+: apply 1% decay from week 5 rate
  const decayWeeks = week - 5
  let currentRate = TOKENOMICS_CONSTANTS.POST_BOOTSTRAP_START_RATE
  
  for (let i = 0; i < decayWeeks; i++) {
    currentRate = Math.floor((currentRate * TOKENOMICS_CONSTANTS.WEEKLY_DECAY_RATE) / 10000)
  }
  
  return currentRate
}

/**
 * Calculate total tokens for a complete week
 */
export function calculateWeekTotalEmission(week: number): number {
  const ratePerSecond = calculateWeekEmissionRate(week)
  return ratePerSecond * TOKENOMICS_CONSTANTS.SECONDS_PER_WEEK
}

/**
 * Calculate how much has been emitted in a specific week based on elapsed time (ENHANCED)
 */
export function calculateWeekEmittedSoFar(
  week: number, 
  emissionStartTimestamp: number, 
  currentTimestamp: number
): number {
  console.log(`🔍 calculateWeekEmittedSoFar for Week ${week}:`, { emissionStartTimestamp, currentTimestamp })
  
  if (week <= 0 || emissionStartTimestamp === 0) {
    console.log(`⚠️ Week ${week}: Invalid week or not started`)
    return 0
  }
  
  const weekStartTime = emissionStartTimestamp + ((week - 1) * TOKENOMICS_CONSTANTS.SECONDS_PER_WEEK)
  const weekEndTime = weekStartTime + TOKENOMICS_CONSTANTS.SECONDS_PER_WEEK
  const ratePerSecond = calculateWeekEmissionRate(week)
  
  console.log(`📅 Week ${week} boundaries:`, {
    weekStartTime,
    weekEndTime,
    currentTimestamp,
    ratePerSecond,
    startDate: new Date(weekStartTime * 1000).toISOString(),
    endDate: new Date(weekEndTime * 1000).toISOString(),
    currentDate: new Date(currentTimestamp * 1000).toISOString()
  })
  
  // If current time is before this week starts
  if (currentTimestamp < weekStartTime) {
    console.log(`⚠️ Week ${week}: Current time before week start, returning 0`)
    return 0
  }
  
  // If this week is completed
  if (currentTimestamp >= weekEndTime) {
    const totalForWeek = calculateWeekTotalEmission(week)
    console.log(`✅ Week ${week}: Completed, total = ${(totalForWeek / 1e6).toFixed(2)} Victory tokens`)
    return totalForWeek
  }
  
  // Week is in progress - calculate partial emission
  const elapsedInWeek = currentTimestamp - weekStartTime
  const emittedSoFar = ratePerSecond * elapsedInWeek
  const progressPercent = (elapsedInWeek / TOKENOMICS_CONSTANTS.SECONDS_PER_WEEK) * 100
  
  console.log(`🔄 Week ${week}: In progress`, {
    elapsedInWeek,
    progressPercent: progressPercent.toFixed(1) + '%',
    emittedSoFar,
    emittedVictory: (emittedSoFar / 1e6).toFixed(2) + ' Victory tokens'
  })
  
  return emittedSoFar
}

/**
 * Calculate total emissions across all weeks up to current time (FIXED)
 */
export function calculateTotalEmittedSoFar(
  emissionStartTimestamp: number, 
  currentTimestamp: number
): number {
  console.log('🔍 calculateTotalEmittedSoFar:', { emissionStartTimestamp, currentTimestamp })
  
  if (emissionStartTimestamp === 0 || currentTimestamp < emissionStartTimestamp) {
    console.log('⚠️ Not started yet, returning 0')
    return 0
  }
  
  const elapsedSeconds = currentTimestamp - emissionStartTimestamp
  const currentWeek = Math.floor(elapsedSeconds / TOKENOMICS_CONSTANTS.SECONDS_PER_WEEK) + 1
  
  console.log('📊 Emission calculation:', {
    elapsedSeconds,
    elapsedDays: elapsedSeconds / 86400,
    currentWeek,
    weeksToCalculate: Math.min(currentWeek, TOKENOMICS_CONSTANTS.TOTAL_WEEKS)
  })
  
  let totalEmitted = 0
  
  // Calculate emissions for each completed + partial week
  for (let week = 1; week <= Math.min(currentWeek, TOKENOMICS_CONSTANTS.TOTAL_WEEKS); week++) {
    const weekEmitted = calculateWeekEmittedSoFar(week, emissionStartTimestamp, currentTimestamp)
    totalEmitted += weekEmitted
    
    console.log(`📅 Week ${week}: ${(weekEmitted / 1e6).toFixed(2)} Victory tokens (${weekEmitted.toLocaleString()} microVictory)`)
  }
  
  console.log('✅ Total emitted so far:', {
    totalMicroVictory: totalEmitted.toLocaleString(),
    totalVictory: (totalEmitted / 1e6).toFixed(2) + ' Victory tokens'
  })
  
  return totalEmitted
}

/**
 * Calculate total remaining emissions from current time
 */
export function calculateTotalRemainingEmissions(
  emissionStartTimestamp: number, 
  currentTimestamp: number
): number {
  if (emissionStartTimestamp === 0) {
    return calculateTotalScheduleEmissions() // All emissions remain if not started
  }
  
  const totalSchedule = calculateTotalScheduleEmissions()
  const emittedSoFar = calculateTotalEmittedSoFar(emissionStartTimestamp, currentTimestamp)
  
  return Math.max(0, totalSchedule - emittedSoFar)
}

/**
 * Calculate total emissions across the entire 156-week schedule
 */
export function calculateTotalScheduleEmissions(): number {
  let total = 0
  
  for (let week = 1; week <= TOKENOMICS_CONSTANTS.TOTAL_WEEKS; week++) {
    total += calculateWeekTotalEmission(week)
  }
  
  return total
}

/**
 * Get detailed weekly emission data
 */
export function getWeeklyEmissionData(
  week: number,
  emissionStartTimestamp: number,
  currentTimestamp: number
): WeeklyEmissionData {
  const ratePerSecond = calculateWeekEmissionRate(week)
  const totalForWeek = calculateWeekTotalEmission(week)
  const weekStartTime = emissionStartTimestamp + ((week - 1) * TOKENOMICS_CONSTANTS.SECONDS_PER_WEEK)
  const weekEndTime = weekStartTime + TOKENOMICS_CONSTANTS.SECONDS_PER_WEEK
  
  const isCompleted = currentTimestamp >= weekEndTime
  const isActive = currentTimestamp >= weekStartTime && currentTimestamp < weekEndTime
  const emittedSoFar = calculateWeekEmittedSoFar(week, emissionStartTimestamp, currentTimestamp)
  
  // Determine phase
  let phase: number
  if (week <= 4) phase = 1 // Bootstrap
  else if (week <= 156) phase = 2 // Post-Bootstrap
  else phase = 3 // Ended
  
  return {
    week,
    phase,
    ratePerSecond,
    totalForWeek,
    startTimestamp: weekStartTime,
    endTimestamp: weekEndTime,
    isCompleted,
    isActive,
    emittedSoFar
  }
}

/**
 * Get comprehensive tokenomics snapshot for current state
 */
export function calculateTokenomicsSnapshot(
  emissionStartTimestamp: number,
  currentTimestamp: number
): TokenomicsSnapshot {
  console.log('🏆 Calculating tokenomics snapshot:', { emissionStartTimestamp, currentTimestamp })
  
  // Handle not started case
  if (emissionStartTimestamp === 0) {
    const totalSchedule = calculateTotalScheduleEmissions()
    return {
      currentWeek: 0,
      currentPhase: 0,
      weekProgress: 0,
      totalElapsedSeconds: 0,
      currentWeekElapsedSeconds: 0,
      totalEmittedSoFar: 0,
      currentWeekEmitted: 0,
      remainingInCurrentWeek: 0,
      totalRemainingEmissions: totalSchedule,
      currentWeekRate: 0,
      currentWeekTotal: 0,
      totalScheduleEmissions: totalSchedule,
      emissionProgress: 0,
      calculationTimestamp: currentTimestamp,
      emissionStartTimestamp: 0
    }
  }
  
  // Calculate current week and timing
  const totalElapsedSeconds = Math.max(0, currentTimestamp - emissionStartTimestamp)
  const currentWeek = Math.min(
    Math.floor(totalElapsedSeconds / TOKENOMICS_CONSTANTS.SECONDS_PER_WEEK) + 1,
    TOKENOMICS_CONSTANTS.TOTAL_WEEKS
  )
  
  // Get current week data
  const weekData = getWeeklyEmissionData(currentWeek, emissionStartTimestamp, currentTimestamp)
  const weekStartTime = emissionStartTimestamp + ((currentWeek - 1) * TOKENOMICS_CONSTANTS.SECONDS_PER_WEEK)
  const currentWeekElapsedSeconds = Math.max(0, currentTimestamp - weekStartTime)
  const weekProgress = Math.min(100, (currentWeekElapsedSeconds / TOKENOMICS_CONSTANTS.SECONDS_PER_WEEK) * 100)
  
  // Calculate emissions
  const totalEmittedSoFar = calculateTotalEmittedSoFar(emissionStartTimestamp, currentTimestamp)
  const totalRemainingEmissions = calculateTotalRemainingEmissions(emissionStartTimestamp, currentTimestamp)
  const totalScheduleEmissions = calculateTotalScheduleEmissions()
  const emissionProgress = (totalEmittedSoFar / totalScheduleEmissions) * 100
  
  // Current week calculations
  const currentWeekEmitted = weekData.emittedSoFar
  const remainingInCurrentWeek = weekData.totalForWeek - currentWeekEmitted
  
  // Determine phase
  let currentPhase: number
  if (currentWeek === 0) currentPhase = 0
  else if (currentWeek <= 4) currentPhase = 1
  else if (currentWeek <= 156) currentPhase = 2
  else currentPhase = 3
  
  const snapshot: TokenomicsSnapshot = {
    currentWeek,
    currentPhase,
    weekProgress,
    totalElapsedSeconds,
    currentWeekElapsedSeconds,
    totalEmittedSoFar,
    currentWeekEmitted,
    remainingInCurrentWeek,
    totalRemainingEmissions,
    currentWeekRate: weekData.ratePerSecond,
    currentWeekTotal: weekData.totalForWeek,
    totalScheduleEmissions,
    emissionProgress,
    calculationTimestamp: currentTimestamp,
    emissionStartTimestamp
  }
  
  console.log('📊 Tokenomics snapshot:', {
    week: snapshot.currentWeek,
    phase: snapshot.currentPhase,
    totalEmitted: formatVictoryTokens(snapshot.totalEmittedSoFar),
    totalRemaining: formatVictoryTokens(snapshot.totalRemainingEmissions),
    weekProgress: snapshot.weekProgress.toFixed(1) + '%',
    emissionProgress: snapshot.emissionProgress.toFixed(2) + '%'
  })
  
  return snapshot
}

/**
 * Format microVictory to Victory tokens with proper decimals
 */
export function formatVictoryTokens(microVictory: number, decimals: number = 2): string {
  const victoryTokens = microVictory / Math.pow(10, TOKENOMICS_CONSTANTS.VICTORY_DECIMALS)
  return victoryTokens.toLocaleString('en-US', { 
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals 
  })
}

/**
 * Format large Victory token numbers with K/M/B suffixes
 */
export function formatLargeVictoryNumber(microVictory: number): string {
  const victoryTokens = microVictory / Math.pow(10, TOKENOMICS_CONSTANTS.VICTORY_DECIMALS)
  
  if (victoryTokens >= 1e9) return (victoryTokens / 1e9).toFixed(2) + 'B'
  if (victoryTokens >= 1e6) return (victoryTokens / 1e6).toFixed(2) + 'M'
  if (victoryTokens >= 1e3) return (victoryTokens / 1e3).toFixed(2) + 'K'
  return victoryTokens.toFixed(2)
}

/**
 * Get emission rate in Victory/sec (formatted)
 */
export function formatEmissionRate(microVictoryPerSecond: number): string {
  const victoryPerSecond = microVictoryPerSecond / Math.pow(10, TOKENOMICS_CONSTANTS.VICTORY_DECIMALS)
  return victoryPerSecond.toFixed(6)
}

/**
 * Calculate emissions for a specific time range
 */
export function calculateEmissionsForTimeRange(
  startTimestamp: number,
  endTimestamp: number,
  emissionStartTimestamp: number
): number {
  if (emissionStartTimestamp === 0 || startTimestamp >= endTimestamp) {
    return 0
  }
  
  // Adjust timestamps to emission schedule
  const adjustedStart = Math.max(startTimestamp, emissionStartTimestamp)
  const adjustedEnd = Math.min(endTimestamp, emissionStartTimestamp + (TOKENOMICS_CONSTANTS.TOTAL_WEEKS * TOKENOMICS_CONSTANTS.SECONDS_PER_WEEK))
  
  if (adjustedStart >= adjustedEnd) {
    return 0
  }
  
  let totalEmissions = 0
  let currentTime = adjustedStart
  
  while (currentTime < adjustedEnd) {
    const currentWeek = Math.floor((currentTime - emissionStartTimestamp) / TOKENOMICS_CONSTANTS.SECONDS_PER_WEEK) + 1
    const weekStartTime = emissionStartTimestamp + ((currentWeek - 1) * TOKENOMICS_CONSTANTS.SECONDS_PER_WEEK)
    const weekEndTime = weekStartTime + TOKENOMICS_CONSTANTS.SECONDS_PER_WEEK
    
    const segmentStart = Math.max(currentTime, weekStartTime)
    const segmentEnd = Math.min(adjustedEnd, weekEndTime)
    const segmentDuration = segmentEnd - segmentStart
    
    if (segmentDuration > 0) {
      const weekRate = calculateWeekEmissionRate(currentWeek)
      totalEmissions += weekRate * segmentDuration
    }
    
    currentTime = weekEndTime
  }
  
  return totalEmissions
}

/**
 * Validate tokenomics calculations
 */
export function validateTokenomicsData(snapshot: TokenomicsSnapshot): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Basic validation
  if (snapshot.currentWeek < 0 || snapshot.currentWeek > TOKENOMICS_CONSTANTS.TOTAL_WEEKS) {
    errors.push(`Invalid current week: ${snapshot.currentWeek}`)
  }
  
  if (snapshot.totalEmittedSoFar < 0) {
    errors.push('Total emitted cannot be negative')
  }
  
  if (snapshot.totalRemainingEmissions < 0) {
    errors.push('Total remaining cannot be negative')
  }
  
  if (snapshot.weekProgress < 0 || snapshot.weekProgress > 100) {
    errors.push(`Invalid week progress: ${snapshot.weekProgress}%`)
  }
  
  // Check if totals add up
  const calculatedTotal = snapshot.totalEmittedSoFar + snapshot.totalRemainingEmissions
  const expectedTotal = snapshot.totalScheduleEmissions
  const difference = Math.abs(calculatedTotal - expectedTotal)
  const tolerance = expectedTotal * 0.001 // 0.1% tolerance
  
  if (difference > tolerance) {
    warnings.push(`Total emissions mismatch: ${formatVictoryTokens(difference)} difference`)
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}