// services/emissionService.ts
import { Transaction } from '@mysten/sui/transactions'
import { suiClient } from '../utils/suiClient'
import { CONSTANTS } from '../constants'
import { GlobalEmissionEventService } from './globalEmissionEventService'
import {
  formatDuration, 
  formatLargeNumber, 
  calculateCurrentWeek,
  calculateWeekProgress,
  calculateRemainingTimeInWeek,
  calculateTotalRemainingTime,
  getPhaseFromWeek,
  getPhaseName,
  getCurrentEmissionRates,
  getWeeklyBreakdown,
  calculateCumulativeEmissions,
  calculateRemainingEmissions,
  EMISSION_PHASES
} from '../utils/emissionUtils'
import {
  calculateTokenomicsSnapshot,
  formatVictoryTokens,
  formatLargeVictoryNumber,
  formatEmissionRate,
  validateTokenomicsData,
  calculateTotalScheduleEmissions,
  calculateWeekEmissionRate,
  calculateWeekTotalEmission,
  type TokenomicsSnapshot
} from '../utils/tokenomicsCalculator'

export interface EmissionConfig {
  emissionStartTimestamp: number
  paused: boolean
}

export interface SystemStatus {
  paused: boolean
  currentWeek: number
  weeksRemaining: number
  isActive: boolean
}

export interface EmissionMetrics {
  currentWeek: number
  totalEmittedSoFar: number
  remainingEmissions: number
  currentWeekRate: string
  // Enhanced metrics using tokenomics
  tokenomicsSnapshot?: TokenomicsSnapshot
  formattedEmitted?: string
  formattedRemaining?: string
  emissionProgress?: number
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

export interface EmissionOverview {
  status: EmissionStatus
  rates: CurrentEmissionRates
  metrics: EmissionMetrics
  systemStatus: SystemStatus
  nextPhaseInfo?: {
    phase: number
    name: string
    atWeek: number
    weeksUntil: number
  }
  debugInfo?: {
    emissionStartFromEvents: number
    emissionStartFromContract: number
    currentTimestamp: number
    calculatedWeek: number
    contractWeek: number
    dataSource: string
    errors: string[]
    tokenomicsValid?: boolean
    emissionProgress?: number
    totalScheduleTokens?: string
  }
}

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

export class EmissionService {
  
  // Fetch actual emission start timestamp from events
  static async fetchActualEmissionStartTime(): Promise<{ timestamp: number; source: string; error?: string }> {
    try {
      const scheduleStartedEvents = await GlobalEmissionEventService.fetchEmissionScheduleStartedEvents(1, 'all')
      
      if (scheduleStartedEvents && scheduleStartedEvents.length > 0) {
        const latestEvent = scheduleStartedEvents[0]
        const startTimestampRaw = latestEvent.data?.startTimestamp || 0
        const startTimestamp = typeof startTimestampRaw === 'string' ? parseInt(startTimestampRaw) : Number(startTimestampRaw)
        
        return {
          timestamp: startTimestamp,
          source: 'events'
        }
      }
      
      return {
        timestamp: 0,
        source: 'events_not_found'
      }
      
    } catch (error) {
      return {
        timestamp: 0,
        source: 'events_error',
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  // Fetch emission configuration
  static async fetchEmissionConfig(): Promise<EmissionConfig> {
    try {
      const eventResult = await this.fetchActualEmissionStartTime()
      
      const tx = new Transaction()
      tx.moveCall({
        target: `${CONSTANTS.PACKAGE_ID}::global_emission_controller::get_config_info`,
        arguments: [tx.object(CONSTANTS.GLOBAL_EMISSION_CONTROLLER_ID)]
      })

      const result = await suiClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: '0x0000000000000000000000000000000000000000000000000000000000000000'
      })

      let contractTimestamp = 0
      let paused = false

      const returnValues = result.results?.[0]?.returnValues
      if (returnValues && returnValues.length >= 2) {
        try {
          const timestampBytes = returnValues[0][0]
          const pausedByte = returnValues[1][0]
          
          if (typeof timestampBytes === 'string') {
            contractTimestamp = parseInt(timestampBytes)
          } else if (Array.isArray(timestampBytes)) {
            contractTimestamp = timestampBytes.reduce((acc, byte, index) => {
              return acc + (byte << (8 * index))
            }, 0)
          } else {
            contractTimestamp = Number(timestampBytes)
          }
          
          paused = pausedByte === 1 || pausedByte === true
          
        } catch (parseError) {
          contractTimestamp = 0
        }
      }

      let finalTimestamp = 0
      
      if (eventResult.timestamp > 0) {
        finalTimestamp = eventResult.timestamp
      } else if (contractTimestamp > 0) {
        finalTimestamp = contractTimestamp
      }

      const numericTimestamp = typeof finalTimestamp === 'string' ? parseInt(finalTimestamp) : finalTimestamp

      return {
        emissionStartTimestamp: numericTimestamp,
        paused
      }

    } catch (error) {
      return {
        emissionStartTimestamp: 0,
        paused: false
      }
    }
  }

  // Fetch system status
  static async fetchSystemStatus(): Promise<SystemStatus> {
    try {
      const tx = new Transaction()
      tx.moveCall({
        target: `${CONSTANTS.PACKAGE_ID}::global_emission_controller::get_system_status`,
        arguments: [
          tx.object(CONSTANTS.GLOBAL_EMISSION_CONTROLLER_ID),
          tx.object(CONSTANTS.CLOCK_ID)
        ]
      })

      const result = await suiClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: '0x0000000000000000000000000000000000000000000000000000000000000000'
      })

      const returnValues = result.results?.[0]?.returnValues
      if (returnValues && returnValues.length >= 4) {
        const paused = returnValues[0][0] === 1
        const currentWeek = parseInt(returnValues[1][0])
        const weeksRemaining = parseInt(returnValues[2][0])
        const isActive = returnValues[3][0] === 1
        
        return {
          paused,
          currentWeek,
          weeksRemaining,
          isActive
        }
      }

      throw new Error('Invalid response format')
    } catch (error) {
      return {
        paused: false,
        currentWeek: 0,
        weeksRemaining: 156,
        isActive: false
      }
    }
  }

  // Get comprehensive emission overview with tokenomics
  static async fetchEmissionOverview(): Promise<EmissionOverview> {
    console.log('🚀 EmissionService: Starting emission overview fetch...')
    
    try {
      const eventTimestampResult = await this.fetchActualEmissionStartTime()
      const [config, systemStatus] = await Promise.all([
        this.fetchEmissionConfig(),
        this.fetchSystemStatus()
      ])

      const emissionStartTime = typeof config.emissionStartTimestamp === 'string' 
        ? parseInt(config.emissionStartTimestamp) 
        : config.emissionStartTimestamp

      const currentTimestamp = Math.floor(Date.now() / 1000)
      
      console.log('🏆 EmissionService: Calculating tokenomics...', {
        emissionStartTime,
        currentTimestamp,
        elapsedDays: (currentTimestamp - emissionStartTime) / 86400
      })
      
      // Use tokenomics calculations
      const tokenomicsSnapshot = calculateTokenomicsSnapshot(emissionStartTime, currentTimestamp)
      
      console.log('📊 Tokenomics result:', {
        currentWeek: tokenomicsSnapshot.currentWeek,
        totalEmittedSoFar: tokenomicsSnapshot.totalEmittedSoFar,
        formattedEmitted: formatLargeVictoryNumber(tokenomicsSnapshot.totalEmittedSoFar),
        emissionProgress: tokenomicsSnapshot.emissionProgress.toFixed(2) + '%'
      })
      
      // Create enhanced metrics using tokenomics
      const metrics: EmissionMetrics = {
        currentWeek: tokenomicsSnapshot.currentWeek,
        totalEmittedSoFar: tokenomicsSnapshot.totalEmittedSoFar / Math.pow(10, 6),
        remainingEmissions: tokenomicsSnapshot.totalRemainingEmissions / Math.pow(10, 6),
        currentWeekRate: formatEmissionRate(tokenomicsSnapshot.currentWeekRate),
        tokenomicsSnapshot,
        formattedEmitted: formatLargeVictoryNumber(tokenomicsSnapshot.totalEmittedSoFar),
        formattedRemaining: formatLargeVictoryNumber(tokenomicsSnapshot.totalRemainingEmissions),
        emissionProgress: tokenomicsSnapshot.emissionProgress
      }

      const status: EmissionStatus = {
        currentWeek: tokenomicsSnapshot.currentWeek,
        currentPhase: tokenomicsSnapshot.currentPhase,
        phaseName: getPhaseName(tokenomicsSnapshot.currentPhase),
        isActive: systemStatus.isActive && tokenomicsSnapshot.currentWeek > 0 && tokenomicsSnapshot.currentWeek <= 156,
        isPaused: systemStatus.paused,
        emissionStartTimestamp: emissionStartTime,
        currentTimestamp,
        weekProgress: tokenomicsSnapshot.weekProgress,
        remainingTimeInWeek: calculateRemainingTimeInWeek(emissionStartTime, currentTimestamp, tokenomicsSnapshot.currentWeek),
        totalRemainingTime: calculateTotalRemainingTime(emissionStartTime, currentTimestamp)
      }

      const rates = getCurrentEmissionRates(tokenomicsSnapshot.currentWeek)

      let nextPhaseInfo
      if (tokenomicsSnapshot.currentWeek === 0) {
        nextPhaseInfo = { phase: 1, name: 'Bootstrap Phase', atWeek: 1, weeksUntil: 1 }
      } else if (tokenomicsSnapshot.currentWeek <= 4) {
        nextPhaseInfo = { phase: 2, name: 'Post-Bootstrap Phase', atWeek: 5, weeksUntil: 5 - tokenomicsSnapshot.currentWeek }
      } else if (tokenomicsSnapshot.currentWeek < 156) {
        nextPhaseInfo = { phase: 3, name: 'Ended', atWeek: 157, weeksUntil: 157 - tokenomicsSnapshot.currentWeek }
      }

      const debugInfo = {
        emissionStartFromEvents: eventTimestampResult.timestamp,
        emissionStartFromContract: emissionStartTime,
        currentTimestamp,
        calculatedWeek: tokenomicsSnapshot.currentWeek,
        contractWeek: systemStatus.currentWeek,
        dataSource: 'tokenomics',
        errors: eventTimestampResult.error ? [eventTimestampResult.error] : [],
        tokenomicsValid: validateTokenomicsData(tokenomicsSnapshot).isValid,
        emissionProgress: tokenomicsSnapshot.emissionProgress,
        totalScheduleTokens: formatLargeVictoryNumber(tokenomicsSnapshot.totalScheduleEmissions)
      }

      const overview = {
        status,
        rates,
        metrics,
        systemStatus,
        nextPhaseInfo,
        debugInfo
      }

      console.log('✅ EmissionService: Overview complete', {
        metricsWeek: overview.metrics.currentWeek,
        emittedSoFar: overview.metrics.formattedEmitted,
        remaining: overview.metrics.formattedRemaining
      })

      return overview

    } catch (error) {
      console.error('❌ EmissionService: Error fetching overview:', error)
      throw error
    }
  }

  // Get week emission comparison
  static getWeekEmissionComparison(tokenomicsSnapshot: TokenomicsSnapshot): {
    currentWeek: {
      week: number
      ratePerSecond: string
      totalForWeek: string
      emittedSoFar: string
      remainingInWeek: string
      progress: number
    }
    previousWeek: {
      week: number
      ratePerSecond: string
      totalForWeek: string
      changeFromPrevious: number
    } | null
    nextWeek: {
      week: number
      ratePerSecond: string
      totalForWeek: string
      changeToNext: number
    } | null
    weekOverWeekTrend: 'increasing' | 'decreasing' | 'stable'
  } {
    const currentWeek = tokenomicsSnapshot.currentWeek
    
    const currentWeekData = {
      week: currentWeek,
      ratePerSecond: formatEmissionRate(tokenomicsSnapshot.currentWeekRate),
      totalForWeek: formatLargeVictoryNumber(tokenomicsSnapshot.currentWeekTotal),
      emittedSoFar: formatLargeVictoryNumber(tokenomicsSnapshot.currentWeekEmitted),
      remainingInWeek: formatLargeVictoryNumber(tokenomicsSnapshot.remainingInCurrentWeek),
      progress: tokenomicsSnapshot.weekProgress
    }
    
    let previousWeekData = null
    if (currentWeek > 1) {
      const prevRate = calculateWeekEmissionRate(currentWeek - 1)
      const prevTotal = calculateWeekTotalEmission(currentWeek - 1)
      const changeFromPrevious = ((tokenomicsSnapshot.currentWeekRate - prevRate) / prevRate) * 100
      
      previousWeekData = {
        week: currentWeek - 1,
        ratePerSecond: formatEmissionRate(prevRate),
        totalForWeek: formatLargeVictoryNumber(prevTotal),
        changeFromPrevious
      }
    }
    
    let nextWeekData = null
    if (currentWeek < 156) {
      const nextRate = calculateWeekEmissionRate(currentWeek + 1)
      const nextTotal = calculateWeekTotalEmission(currentWeek + 1)
      const changeToNext = ((nextRate - tokenomicsSnapshot.currentWeekRate) / tokenomicsSnapshot.currentWeekRate) * 100
      
      nextWeekData = {
        week: currentWeek + 1,
        ratePerSecond: formatEmissionRate(nextRate),
        totalForWeek: formatLargeVictoryNumber(nextTotal),
        changeToNext
      }
    }
    
    let weekOverWeekTrend: 'increasing' | 'decreasing' | 'stable' = 'stable'
    if (previousWeekData && previousWeekData.changeFromPrevious > 0.1) {
      weekOverWeekTrend = 'increasing'
    } else if (previousWeekData && previousWeekData.changeFromPrevious < -0.1) {
      weekOverWeekTrend = 'decreasing'
    }
    
    return {
      currentWeek: currentWeekData,
      previousWeek: previousWeekData,
      nextWeek: nextWeekData,
      weekOverWeekTrend
    }
  }

  // Get emission status for display
  static async fetchEmissionStatusDisplay(): Promise<{
    currentWeek: number
    phase: number
    totalEmission: string
    paused: boolean
    remainingWeeks: number
  }> {
    try {
      const tx = new Transaction()
      tx.moveCall({
        target: `${CONSTANTS.PACKAGE_ID}::global_emission_controller::get_emission_status`,
        arguments: [
          tx.object(CONSTANTS.GLOBAL_EMISSION_CONTROLLER_ID),
          tx.object(CONSTANTS.CLOCK_ID)
        ]
      })

      const result = await suiClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: '0x0000000000000000000000000000000000000000000000000000000000000000'
      })

      const returnValues = result.results?.[0]?.returnValues
      if (returnValues && returnValues.length >= 5) {
        const currentWeek = parseInt(returnValues[0][0])
        const phase = parseInt(returnValues[1][0])
        const totalEmission = returnValues[2][0]
        const paused = returnValues[3][0] === 1
        const remainingWeeks = parseInt(returnValues[4][0])
        
        return {
          currentWeek,
          phase,
          totalEmission: (parseInt(totalEmission) / Math.pow(10, 6)).toFixed(6),
          paused,
          remainingWeeks
        }
      }
      
      throw new Error('Invalid response format')
    } catch (error) {
      return {
        currentWeek: 0,
        phase: 0,
        totalEmission: '0',
        paused: false,
        remainingWeeks: 156
      }
    }
  }

  // Get allocation details for current week
  static async fetchCurrentAllocationDetails(): Promise<{
    lpEmission: string
    singleEmission: string
    victoryEmission: string
    devEmission: string
    lpPercent: number
    singlePercent: number
    victoryPercent: number
    devPercent: number
  }> {
    try {
      const tx = new Transaction()
      tx.moveCall({
        target: `${CONSTANTS.PACKAGE_ID}::global_emission_controller::get_allocation_details`,
        arguments: [
          tx.object(CONSTANTS.GLOBAL_EMISSION_CONTROLLER_ID),
          tx.object(CONSTANTS.CLOCK_ID)
        ]
      })

      const result = await suiClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: '0x0000000000000000000000000000000000000000000000000000000000000000'
      })

      const returnValues = result.results?.[0]?.returnValues
      if (returnValues && returnValues.length >= 8) {
        const lpEmission = returnValues[0][0]
        const singleEmission = returnValues[1][0]
        const victoryEmission = returnValues[2][0]
        const devEmission = returnValues[3][0]
        const lpPct = returnValues[4][0]
        const singlePct = returnValues[5][0]
        const victoryPct = returnValues[6][0]
        const devPct = returnValues[7][0]
        
        return {
          lpEmission: (parseInt(lpEmission) / Math.pow(10, 6)).toFixed(6),
          singleEmission: (parseInt(singleEmission) / Math.pow(10, 6)).toFixed(6),
          victoryEmission: (parseInt(victoryEmission) / Math.pow(10, 6)).toFixed(6),
          devEmission: (parseInt(devEmission) / Math.pow(10, 6)).toFixed(6),
          lpPercent: parseInt(lpPct) / 100,
          singlePercent: parseInt(singlePct) / 100,
          victoryPercent: parseInt(victoryPct) / 100,
          devPercent: parseInt(devPct) / 100
        }
      }

      throw new Error('Invalid response format')
    } catch (error) {
      return {
        lpEmission: '0',
        singleEmission: '0',
        victoryEmission: '0',
        devEmission: '0',
        lpPercent: 0,
        singlePercent: 0,
        victoryPercent: 0,
        devPercent: 0
      }
    }
  }

  // ADMIN TRANSACTION BUILDERS

  static buildInitializeEmissionTransaction(): Transaction {
    const tx = new Transaction()
    tx.moveCall({
      target: `${CONSTANTS.PACKAGE_ID}::global_emission_controller::initialize_emission_schedule`,
      arguments: [
        tx.object(CONSTANTS.GLOBAL_EMISSION_ADMIN_CAP_ID),
        tx.object(CONSTANTS.GLOBAL_EMISSION_CONTROLLER_ID),
        tx.object(CONSTANTS.CLOCK_ID)
      ]
    })
    return tx
  }

  static buildPauseSystemTransaction(): Transaction {
    const tx = new Transaction()
    tx.moveCall({
      target: `${CONSTANTS.PACKAGE_ID}::global_emission_controller::pause_system`,
      arguments: [
        tx.object(CONSTANTS.GLOBAL_EMISSION_ADMIN_CAP_ID),
        tx.object(CONSTANTS.GLOBAL_EMISSION_CONTROLLER_ID),
        tx.object(CONSTANTS.CLOCK_ID)
      ]
    })
    return tx
  }

  static buildUnpauseSystemTransaction(): Transaction {
    const tx = new Transaction()
    tx.moveCall({
      target: `${CONSTANTS.PACKAGE_ID}::global_emission_controller::unpause_system`,
      arguments: [
        tx.object(CONSTANTS.GLOBAL_EMISSION_ADMIN_CAP_ID),
        tx.object(CONSTANTS.GLOBAL_EMISSION_CONTROLLER_ID),
        tx.object(CONSTANTS.CLOCK_ID)
      ]
    })
    return tx
  }

  static buildResetToWeekTransaction(targetWeek: number): Transaction {
    const tx = new Transaction()
    tx.moveCall({
      target: `${CONSTANTS.PACKAGE_ID}::global_emission_controller::reset_to_week`,
      arguments: [
        tx.object(CONSTANTS.GLOBAL_EMISSION_ADMIN_CAP_ID),
        tx.object(CONSTANTS.GLOBAL_EMISSION_CONTROLLER_ID),
        tx.pure.u64(targetWeek),
        tx.object(CONSTANTS.CLOCK_ID)
      ]
    })
    return tx
  }

  static buildAdjustTimingTransaction(hours: number, subtract: boolean): Transaction {
    const tx = new Transaction()
    tx.moveCall({
      target: `${CONSTANTS.PACKAGE_ID}::global_emission_controller::adjust_emission_timing`,
      arguments: [
        tx.object(CONSTANTS.GLOBAL_EMISSION_ADMIN_CAP_ID),
        tx.object(CONSTANTS.GLOBAL_EMISSION_CONTROLLER_ID),
        tx.pure.u64(hours),
        tx.pure.bool(subtract),
        tx.object(CONSTANTS.CLOCK_ID)
      ]
    })
    return tx
  }

  static buildSetPauseStateTransaction(paused: boolean): Transaction {
    const tx = new Transaction()
    tx.moveCall({
      target: `${CONSTANTS.PACKAGE_ID}::global_emission_controller::set_pause_state`,
      arguments: [
        tx.object(CONSTANTS.GLOBAL_EMISSION_ADMIN_CAP_ID),
        tx.object(CONSTANTS.GLOBAL_EMISSION_CONTROLLER_ID),
        tx.pure.bool(paused),
        tx.object(CONSTANTS.CLOCK_ID)
      ]
    })
    return tx
  }

  // PREVIEW FUNCTIONS

  static async previewWeekAllocations(week: number): Promise<{
    lpAllocation: string
    singleAllocation: string
    victoryAllocation: string
    devAllocation: string
    phase: number
  }> {
    try {
      const tx = new Transaction()
      tx.moveCall({
        target: `${CONSTANTS.PACKAGE_ID}::global_emission_controller::preview_week_allocations`,
        arguments: [tx.pure.u64(week)]
      })

      const result = await suiClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: '0x0000000000000000000000000000000000000000000000000000000000000000'
      })

      const returnValues = result.results?.[0]?.returnValues
      if (returnValues && returnValues.length >= 5) {
        const lpAllocation = returnValues[0][0]
        const singleAllocation = returnValues[1][0]
        const victoryAllocation = returnValues[2][0]
        const devAllocation = returnValues[3][0]
        const phase = returnValues[4][0]
        
        return {
          lpAllocation: (parseInt(lpAllocation) / Math.pow(10, 6)).toFixed(6),
          singleAllocation: (parseInt(singleAllocation) / Math.pow(10, 6)).toFixed(6),
          victoryAllocation: (parseInt(victoryAllocation) / Math.pow(10, 6)).toFixed(6),
          devAllocation: (parseInt(devAllocation) / Math.pow(10, 6)).toFixed(6),
          phase: parseInt(phase)
        }
      }

      throw new Error('Invalid response format')
    } catch (error) {
      return {
        lpAllocation: '0',
        singleAllocation: '0',
        victoryAllocation: '0',
        devAllocation: '0',
        phase: 0
      }
    }
  }

  static async calculateTotalScheduleEmissions(): Promise<string> {
    try {
      const tx = new Transaction()
      tx.moveCall({
        target: `${CONSTANTS.PACKAGE_ID}::global_emission_controller::calculate_total_schedule_emissions`,
        arguments: []
      })

      const result = await suiClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: '0x0000000000000000000000000000000000000000000000000000000000000000'
      })

      const returnValues = result.results?.[0]?.returnValues
      if (returnValues && returnValues.length >= 1) {
        const totalEmissions = returnValues[0][0]
        return (parseInt(totalEmissions) / Math.pow(10, 6)).toFixed(2)
      }

      throw new Error('Invalid response format')
    } catch (error) {
      return '0'
    }
  }

  static async checkEmissionsActive(): Promise<boolean> {
    try {
      const tx = new Transaction()
      tx.moveCall({
        target: `${CONSTANTS.PACKAGE_ID}::global_emission_controller::is_emissions_active`,
        arguments: [
          tx.object(CONSTANTS.GLOBAL_EMISSION_CONTROLLER_ID),
          tx.object(CONSTANTS.CLOCK_ID)
        ]
      })

      const result = await suiClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: '0x0000000000000000000000000000000000000000000000000000000000000000'
      })

      const returnValues = result.results?.[0]?.returnValues
      if (returnValues && returnValues.length >= 1) {
        return returnValues[0][0] === 1
      }

      throw new Error('Invalid response format')
    } catch (error) {
      return false
    }
  }

  static async getEmissionPhaseParameters(): Promise<{
    bootstrapRate: string
    postBootstrapStartRate: string
    weeklyDecayRate: number
    totalWeeks: number
  }> {
    try {
      const tx = new Transaction()
      tx.moveCall({
        target: `${CONSTANTS.PACKAGE_ID}::global_emission_controller::get_emission_phase_parameters`,
        arguments: []
      })

      const result = await suiClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: '0x0000000000000000000000000000000000000000000000000000000000000000'
      })

      const returnValues = result.results?.[0]?.returnValues
      if (returnValues && returnValues.length >= 4) {
        const bootstrapRate = returnValues[0][0]
        const postBootstrapRate = returnValues[1][0]
        const decayRate = returnValues[2][0]
        const totalWeeks = returnValues[3][0]
        
        return {
          bootstrapRate: (parseInt(bootstrapRate) / Math.pow(10, 6)).toFixed(6),
          postBootstrapStartRate: (parseInt(postBootstrapRate) / Math.pow(10, 6)).toFixed(6),
          weeklyDecayRate: parseInt(decayRate) / 100,
          totalWeeks: parseInt(totalWeeks)
        }
      }

      throw new Error('Invalid response format')
    } catch (error) {
      return {
        bootstrapRate: '6.6',
        postBootstrapStartRate: '5.47',
        weeklyDecayRate: 99,
        totalWeeks: 156
      }
    }
  }

  // UTILITY FUNCTIONS

  static getEmissionOperationErrorMessage(error: any): string {
    if (typeof error === 'string') return error
    
    if (error?.message) {
      if (error.message.includes('E_NOT_AUTHORIZED')) {
        return 'Only admin can perform this operation'
      }
      if (error.message.includes('E_NOT_INITIALIZED')) {
        return 'Emission schedule has not been initialized'
      }
      if (error.message.includes('E_ALREADY_INITIALIZED')) {
        return 'Emission schedule has already been initialized'
      }
      if (error.message.includes('E_NOT_PAUSED')) {
        return 'System must be paused to perform this operation'
      }
      if (error.message.includes('E_INVALID_WEEK')) {
        return 'Invalid week number (must be 1-156)'
      }
      if (error.message.includes('E_INVALID_ADJUSTMENT')) {
        return 'Invalid timing adjustment (max 168 hours)'
      }
      if (error.message.includes('rejected')) {
        return 'Transaction was rejected by user'
      }
      
      return error.message
    }
    
    return 'An unknown error occurred'
  }

  static getTransactionExplorerUrl(txDigest: string, network: string = 'testnet'): string {
    const baseUrl = network === 'mainnet' ? 'https://suiexplorer.com' : 'https://suiexplorer.com'
    return `${baseUrl}/txblock/${txDigest}?network=${network}`
  }

  static validateAdminOperation(operation: string, value?: any): { isValid: boolean; error?: string } {
    switch (operation) {
      case 'resetToWeek':
        if (!value || typeof value !== 'number') {
          return { isValid: false, error: 'Week number is required' }
        }
        if (value < 1 || value > 156) {
          return { isValid: false, error: 'Week must be between 1 and 156' }
        }
        break
      
      case 'adjustTiming':
        if (!value || typeof value !== 'number') {
          return { isValid: false, error: 'Hours value is required' }
        }
        if (value < 1 || value > 168) {
          return { isValid: false, error: 'Hours must be between 1 and 168' }
        }
        break
    }
    
    return { isValid: true }
  }

  static setupRealTimePolling(callback: (data: EmissionOverview) => void, intervalMs: number = 30000): () => void {
    const interval = setInterval(async () => {
      try {
        const overview = await this.fetchEmissionOverview()
        callback(overview)
      } catch (error) {
        console.error('Error in real-time polling:', error)
      }
    }, intervalMs)

    return () => clearInterval(interval)
  }

  static getHistoricalEmissionData(startWeek: number, endWeek: number, emissionStartTimestamp: number): Array<{
    week: number
    date: string
    totalRate: number
    lpRate: number
    singleRate: number
    victoryRate: number
    devRate: number
    phase: number
  }> {
    const data = []
    
    for (let week = startWeek; week <= endWeek; week++) {
      const weekStartTimestamp = emissionStartTimestamp + ((week - 1) * 604800)
      const date = new Date(weekStartTimestamp * 1000).toISOString().split('T')[0]
      
      const rates = getCurrentEmissionRates(week)
      const phase = getPhaseFromWeek(week)
      
      data.push({
        week,
        date,
        totalRate: parseFloat(rates.totalPerSecond),
        lpRate: parseFloat(rates.lpPerSecond),
        singleRate: parseFloat(rates.singlePerSecond),
        victoryRate: parseFloat(rates.victoryStakingPerSecond),
        devRate: parseFloat(rates.devPerSecond),
        phase
      })
    }
    
    return data
  }

  static getWeeklyBreakdownForTable(
    emissionStartTimestamp: number,
    currentTimestamp: number,
    page: number = 1,
    pageSize: number = 10
  ): { 
    data: WeeklyBreakdown[], 
    totalPages: number, 
    currentPage: number,
    totalWeeks: number 
  } {
    const totalWeeks = 156
    const totalPages = Math.ceil(totalWeeks / pageSize)
    const startWeek = ((page - 1) * pageSize) + 1
    const endWeek = Math.min(startWeek + pageSize - 1, totalWeeks)
    
    const data = getWeeklyBreakdown(startWeek, endWeek, emissionStartTimestamp, currentTimestamp)
    
    return {
      data,
      totalPages,
      currentPage: page,
      totalWeeks
    }
  }
}