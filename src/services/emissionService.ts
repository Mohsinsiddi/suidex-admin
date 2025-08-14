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
  
  // 🔥 NEW: Fetch actual emission start timestamp from events
  static async fetchActualEmissionStartTime(): Promise<{ timestamp: number; source: string; error?: string }> {
    try {
      console.log('🔍 EmissionService: Fetching emission start time from events...')
      
      // Use the working GlobalEmissionEventService to get EmissionScheduleStarted events
      const scheduleStartedEvents = await GlobalEmissionEventService.fetchEmissionScheduleStartedEvents(1, 'all')
      
      if (scheduleStartedEvents && scheduleStartedEvents.length > 0) {
        const latestEvent = scheduleStartedEvents[0] // Most recent event
        const startTimestamp = latestEvent.data?.startTimestamp || 0
        
        console.log('✅ EmissionService: Found emission start from events:', {
          timestamp: startTimestamp,
          date: new Date(startTimestamp * 1000).toISOString(),
          eventId: latestEvent.id
        })
        
        return {
          timestamp: startTimestamp,
          source: 'events'
        }
      }
      
      console.log('⚠️ EmissionService: No EmissionScheduleStarted events found')
      return {
        timestamp: 0,
        source: 'events_not_found'
      }
      
    } catch (error) {
      console.error('❌ EmissionService: Error fetching emission start from events:', error)
      return {
        timestamp: 0,
        source: 'events_error',
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  // Updated: Fetch emission configuration with event-based timestamp
  static async fetchEmissionConfig(): Promise<EmissionConfig> {
    console.log('🚀 EmissionService: Starting fetchEmissionConfig...')
    
    try {
      // First, try to get timestamp from events (most reliable)
      const eventResult = await this.fetchActualEmissionStartTime()
      
      // Also try to get config from contract for paused status
      console.log('📡 EmissionService: Calling contract get_config_info...')
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

      // Parse contract result
      const returnValues = result.results?.[0]?.returnValues
      if (returnValues && returnValues.length >= 2) {
        // Try to properly decode the BCS bytes
        try {
          // returnValues[0][0] should be the timestamp bytes
          const timestampBytes = returnValues[0][0]
          const pausedByte = returnValues[1][0]
          
          console.log('📊 EmissionService: Contract raw values:', {
            timestampBytes,
            pausedByte,
            timestampType: typeof timestampBytes,
            pausedType: typeof pausedByte
          })
          
          // Try different parsing approaches
          if (typeof timestampBytes === 'string') {
            contractTimestamp = parseInt(timestampBytes)
          } else if (Array.isArray(timestampBytes)) {
            // If it's an array of bytes, try to reconstruct the number
            contractTimestamp = timestampBytes.reduce((acc, byte, index) => {
              return acc + (byte << (8 * index))
            }, 0)
          } else {
            contractTimestamp = Number(timestampBytes)
          }
          
          paused = pausedByte === 1 || pausedByte === true
          
        } catch (parseError) {
          console.error('❌ EmissionService: Error parsing contract values:', parseError)
          contractTimestamp = 0
        }
      }

      // Determine the best timestamp to use
      let finalTimestamp = 0
      let dataSource = 'unknown'
      
      if (eventResult.timestamp > 0) {
        finalTimestamp = eventResult.timestamp
        dataSource = 'events'
        console.log('✅ EmissionService: Using timestamp from events')
      } else if (contractTimestamp > 0) {
        finalTimestamp = contractTimestamp
        dataSource = 'contract'
        console.log('✅ EmissionService: Using timestamp from contract')
      } else {
        dataSource = 'not_initialized'
        console.log('⚠️ EmissionService: No valid timestamp found - system not initialized')
      }

      const config = {
        emissionStartTimestamp: finalTimestamp,
        paused
      }

      console.log('📋 EmissionService: Final emission config:', {
        ...config,
        dataSource,
        eventTimestamp: eventResult.timestamp,
        contractTimestamp,
        startDate: finalTimestamp > 0 ? new Date(finalTimestamp * 1000).toISOString() : 'Not set'
      })

      return config

    } catch (error) {
      console.error('❌ EmissionService: Error in fetchEmissionConfig:', error)
      return {
        emissionStartTimestamp: 0,
        paused: false
      }
    }
  }

  // Fetch system status
  static async fetchSystemStatus(): Promise<SystemStatus> {
    try {
      console.log('📡 EmissionService: Fetching system status...')
      
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
        
        const status = {
          paused,
          currentWeek,
          weeksRemaining,
          isActive
        }
        
        console.log('📊 EmissionService: System status from contract:', status)
        return status
      }

      throw new Error('Invalid response format')
    } catch (error) {
      console.error('❌ EmissionService: Error fetching system status:', error)
      return {
        paused: false,
        currentWeek: 0,
        weeksRemaining: 156,
        isActive: false
      }
    }
  }

  // Fetch emission metrics
  static async fetchEmissionMetrics(): Promise<EmissionMetrics> {
    try {
      console.log('📡 EmissionService: Fetching emission metrics...')
      
      const tx = new Transaction()
      tx.moveCall({
        target: `${CONSTANTS.PACKAGE_ID}::global_emission_controller::get_emission_metrics`,
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
        const currentWeek = parseInt(returnValues[0][0])
        const totalEmitted = returnValues[1][0]
        const remainingEmissions = returnValues[2][0]
        const currentWeekRate = returnValues[3][0]
        
        // Convert from mist to Victory tokens
        const totalEmittedFormatted = parseInt(totalEmitted) / Math.pow(10, 6)
        const remainingEmissionsFormatted = parseInt(remainingEmissions) / Math.pow(10, 6)
        const currentWeekRateFormatted = (parseInt(currentWeekRate) / Math.pow(10, 6)).toFixed(6)
        
        const metrics = {
          currentWeek,
          totalEmittedSoFar: totalEmittedFormatted,
          remainingEmissions: remainingEmissionsFormatted,
          currentWeekRate: currentWeekRateFormatted
        }
        
        console.log('📊 EmissionService: Emission metrics:', metrics)
        return metrics
      }

      throw new Error('Invalid response format')
    } catch (error) {
      console.error('❌ EmissionService: Error fetching emission metrics:', error)
      return {
        currentWeek: 0,
        totalEmittedSoFar: 0,
        remainingEmissions: 0,
        currentWeekRate: '0'
      }
    }
  }

  // Enhanced: Get comprehensive emission overview with debugging
  static async fetchEmissionOverview(): Promise<EmissionOverview> {
    console.log('🚀 EmissionService: Starting comprehensive emission overview fetch...')
    
    try {
      // Get event-based timestamp for debugging
      const eventTimestampResult = await this.fetchActualEmissionStartTime()
      
      // Fetch all data in parallel
      const [config, systemStatus, metrics] = await Promise.all([
        this.fetchEmissionConfig(),
        this.fetchSystemStatus(),
        this.fetchEmissionMetrics()
      ])

      const currentTimestamp = Math.floor(Date.now() / 1000)
      
      // Calculate week using our utils (based on config timestamp)
      const calculatedWeek = calculateCurrentWeek(config.emissionStartTimestamp, currentTimestamp)
      const contractWeek = systemStatus.currentWeek
      
      // Use the most reliable week number
      const currentWeek = config.emissionStartTimestamp > 0 ? calculatedWeek : contractWeek
      const phase = getPhaseFromWeek(currentWeek)
      
      console.log('🔍 EmissionService: Week calculation comparison:', {
        configTimestamp: config.emissionStartTimestamp,
        currentTimestamp,
        calculatedWeek,
        contractWeek,
        finalWeek: currentWeek,
        timeDiff: currentTimestamp - config.emissionStartTimestamp
      })
      
      // Calculate detailed status
      const status: EmissionStatus = {
        currentWeek,
        currentPhase: phase,
        phaseName: getPhaseName(phase),
        isActive: systemStatus.isActive,
        isPaused: systemStatus.paused,
        emissionStartTimestamp: config.emissionStartTimestamp,
        currentTimestamp,
        weekProgress: calculateWeekProgress(config.emissionStartTimestamp, currentTimestamp, currentWeek),
        remainingTimeInWeek: calculateRemainingTimeInWeek(config.emissionStartTimestamp, currentTimestamp, currentWeek),
        totalRemainingTime: calculateTotalRemainingTime(config.emissionStartTimestamp, currentTimestamp)
      }

      // Get current emission rates
      const rates = getCurrentEmissionRates(currentWeek)

      // Next phase info
      let nextPhaseInfo
      if (currentWeek === 0) {
        nextPhaseInfo = { phase: 1, name: 'Bootstrap Phase', atWeek: 1, weeksUntil: 1 }
      } else if (currentWeek <= 4) {
        nextPhaseInfo = { phase: 2, name: 'Post-Bootstrap Phase', atWeek: 5, weeksUntil: 5 - currentWeek }
      } else if (currentWeek < 156) {
        nextPhaseInfo = { phase: 3, name: 'Ended', atWeek: 157, weeksUntil: 157 - currentWeek }
      }

      // Debug information
      const debugInfo = {
        emissionStartFromEvents: eventTimestampResult.timestamp,
        emissionStartFromContract: config.emissionStartTimestamp,
        currentTimestamp,
        calculatedWeek,
        contractWeek,
        dataSource: eventTimestampResult.source,
        errors: eventTimestampResult.error ? [eventTimestampResult.error] : []
      }

      const overview = {
        status,
        rates,
        metrics,
        systemStatus,
        nextPhaseInfo,
        debugInfo
      }

      console.log('✅ EmissionService: Complete overview generated:', {
        currentWeek: overview.status.currentWeek,
        isActive: overview.status.isActive,
        isPaused: overview.status.isPaused,
        emissionStart: overview.status.emissionStartTimestamp,
        weekProgress: overview.status.weekProgress,
        debugInfo: overview.debugInfo
      })

      return overview

    } catch (error) {
      console.error('❌ EmissionService: Error fetching emission overview:', error)
      throw error
    }
  }

  // Rest of the methods remain unchanged...
  // [Include all the existing methods: fetchEmissionStatusDisplay, fetchCurrentAllocationDetails, etc.]
  
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
      console.error('Error fetching emission status display:', error)
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
      console.error('Error fetching allocation details:', error)
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

  // Initialize emission schedule
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

  // Pause system
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

  // Unpause system
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

  // Reset to specific week
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

  // Adjust emission timing
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

  // Legacy pause/unpause (if needed for backward compatibility)
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

  // [Include all other existing methods unchanged - preview functions, utility functions, etc.]
  // ... (rest of the class methods remain the same)
  
  // Real-time polling setup for dashboard
  static setupRealTimePolling(callback: (data: EmissionOverview) => void, intervalMs: number = 30000): () => void {
    const interval = setInterval(async () => {
      try {
        const overview = await this.fetchEmissionOverview()
        callback(overview)
      } catch (error) {
        console.error('Error in real-time polling:', error)
      }
    }, intervalMs)

    // Return cleanup function
    return () => clearInterval(interval)
  }

  // Get historical emission data for charts
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

  // Get weekly breakdown for table display
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

  // Format error messages for user display
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

  // Get transaction explorer URL
  static getTransactionExplorerUrl(txDigest: string, network: string = 'testnet'): string {
    const baseUrl = network === 'mainnet' ? 'https://suiexplorer.com' : 'https://suiexplorer.com'
    return `${baseUrl}/txblock/${txDigest}?network=${network}`
  }

  // Validate admin operations
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
}