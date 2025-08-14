// services/emissionService.ts
import { Transaction } from '@mysten/sui/transactions'
import { suiClient } from '../utils/suiClient'
import { CONSTANTS } from '../constants'
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
  
  // Fetch current emission configuration
  static async fetchEmissionConfig(): Promise<EmissionConfig> {
    try {
      // Use devInspectTransactionBlock for view functions
      const tx = new Transaction()
      tx.moveCall({
        target: `${CONSTANTS.PACKAGE_ID}::global_emission_controller::get_config_info`,
        arguments: [tx.object(CONSTANTS.GLOBAL_EMISSION_CONTROLLER_ID)]
      })

      const result = await suiClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: '0x0000000000000000000000000000000000000000000000000000000000000000'
      })

      // Parse the result from the first moveCall
      const returnValues = result.results?.[0]?.returnValues
      if (returnValues && returnValues.length >= 2) {
        // Convert from BCS bytes to values
        const emissionStart = parseInt(returnValues[0][0])
        const paused = returnValues[1][0] === 1
        
        return {
          emissionStartTimestamp: emissionStart,
          paused
        }
      }

      throw new Error('Invalid response format')
    } catch (error) {
      console.error('Error fetching emission config:', error)
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
      console.error('Error fetching system status:', error)
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
        
        return {
          currentWeek,
          totalEmittedSoFar: totalEmittedFormatted,
          remainingEmissions: remainingEmissionsFormatted,
          currentWeekRate: currentWeekRateFormatted
        }
      }

      throw new Error('Invalid response format')
    } catch (error) {
      console.error('Error fetching emission metrics:', error)
      return {
        currentWeek: 0,
        totalEmittedSoFar: 0,
        remainingEmissions: 0,
        currentWeekRate: '0'
      }
    }
  }

  // Get comprehensive emission overview
  static async fetchEmissionOverview(): Promise<EmissionOverview> {
    try {
      const [config, systemStatus, metrics] = await Promise.all([
        this.fetchEmissionConfig(),
        this.fetchSystemStatus(),
        this.fetchEmissionMetrics()
      ])

      const currentTimestamp = Math.floor(Date.now() / 1000)
      const currentWeek = systemStatus.currentWeek
      const phase = getPhaseFromWeek(currentWeek)
      
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

      return {
        status,
        rates,
        metrics,
        systemStatus,
        nextPhaseInfo
      }
    } catch (error) {
      console.error('Error fetching emission overview:', error)
      throw error
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

  // PREVIEW FUNCTIONS (No transactions required)

  // Preview week allocations
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
      console.error('Error previewing week allocations:', error)
      return {
        lpAllocation: '0',
        singleAllocation: '0',
        victoryAllocation: '0',
        devAllocation: '0',
        phase: 0
      }
    }
  }

  // Calculate total schedule emissions
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
      console.error('Error calculating total schedule emissions:', error)
      return '0'
    }
  }

  // Check if emissions are active
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
      console.error('Error checking emissions active:', error)
      return false
    }
  }

  // Get emission phase parameters (constants)
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
      console.error('Error getting emission phase parameters:', error)
      return {
        bootstrapRate: '6.6',
        postBootstrapStartRate: '5.47',
        weeklyDecayRate: 99,
        totalWeeks: 156
      }
    }
  }

  // UTILITY FUNCTIONS

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
}