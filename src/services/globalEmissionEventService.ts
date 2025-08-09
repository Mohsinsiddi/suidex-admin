// services/globalEmissionEventService.ts
import { suiClient } from '../utils/suiClient'
import { CONSTANTS } from '../constants'

export interface GlobalEmissionEvent {
  id: string
  type: 'EmissionScheduleStarted' | 'SystemPaused' | 'SystemUnpaused' | 'EmissionPaused' | 'WeekReset' | 'TimingAdjusted' | 'ContractAllocationRequested'
  eventName: string
  week?: number
  phase?: number
  amount?: string
  contractType?: string
  data: any
  timestamp: string
  txDigest: string
  sender: string
}

export interface GlobalEmissionEventFilters {
  eventType: string
  contractType?: string
  dateRange: string
  searchTerm: string
  limit: number
}

export interface GlobalEmissionEventResponse {
  events: GlobalEmissionEvent[]
  hasNextPage: boolean
  nextCursor?: string
  totalCount: number
}

export class GlobalEmissionEventService {
  
  // Helper to get time range filter
  static getTimeRangeFilter(dateRange: string): { startTime?: number; endTime?: number } | null {
    if (dateRange === 'all') return null
    
    const now = Date.now()
    const dayMs = 24 * 60 * 60 * 1000
    
    let startTime: number
    switch (dateRange) {
      case '1d':
        startTime = now - dayMs
        break
      case '7d':
        startTime = now - (7 * dayMs)
        break
      case '30d':
        startTime = now - (30 * dayMs)
        break
      default:
        return null
    }
    
    return { startTime, endTime: now }
  }

  // Fetch Emission Schedule Started events
  static async fetchEmissionScheduleStartedEvents(limit: number = 50, dateRange: string = 'all'): Promise<GlobalEmissionEvent[]> {
    try {
      const events = await suiClient.queryEvents({
        query: {
          MoveEventType: `${CONSTANTS.PACKAGE_ID}::global_emission_controller::EmissionScheduleStarted`
        },
        limit: Math.min(limit, 200),
        order: 'descending'
      })

      if (!events || !events.data || events.data.length === 0) {
        return []
      }

      const processedEvents: GlobalEmissionEvent[] = events.data.map((event, index) => {
        const parsedEvent = event.parsedJson as any

        return {
          id: `emission-started-${event.id.txDigest}-${index}`,
          type: 'EmissionScheduleStarted',
          eventName: 'Emission Schedule Started',
          data: {
            startTimestamp: parsedEvent.start_timestamp || 0,
            totalWeeks: parsedEvent.total_weeks || 156
          },
          timestamp: event.timestampMs || '0',
          txDigest: event.id.txDigest || '',
          sender: 'admin'
        }
      })

      return processedEvents
    } catch (error) {
      console.error('Error fetching EmissionScheduleStarted events:', error)
      return []
    }
  }

  // Fetch System Pause/Unpause events
  static async fetchSystemPauseEvents(limit: number = 50, dateRange: string = 'all'): Promise<GlobalEmissionEvent[]> {
    try {
      const [pauseEvents, unpauseEvents, emissionPauseEvents] = await Promise.allSettled([
        // SystemPaused
        suiClient.queryEvents({
          query: { MoveEventType: `${CONSTANTS.PACKAGE_ID}::global_emission_controller::SystemPaused` },
          limit: Math.min(limit, 100),
          order: 'descending'
        }),
        // SystemUnpaused
        suiClient.queryEvents({
          query: { MoveEventType: `${CONSTANTS.PACKAGE_ID}::global_emission_controller::SystemUnpaused` },
          limit: Math.min(limit, 100),
          order: 'descending'
        }),
        // EmissionPaused (legacy)
        suiClient.queryEvents({
          query: { MoveEventType: `${CONSTANTS.PACKAGE_ID}::global_emission_controller::EmissionPaused` },
          limit: Math.min(limit, 100),
          order: 'descending'
        })
      ])

      const allEvents: GlobalEmissionEvent[] = []

      // Process SystemPaused events
      if (pauseEvents.status === 'fulfilled' && pauseEvents.value?.data) {
        pauseEvents.value.data.forEach((event, index) => {
          const parsedEvent = event.parsedJson as any
          allEvents.push({
            id: `system-paused-${event.id.txDigest}-${index}`,
            type: 'SystemPaused',
            eventName: 'System Paused',
            data: {
              timestamp: parsedEvent.timestamp || 0
            },
            timestamp: event.timestampMs || '0',
            txDigest: event.id.txDigest || '',
            sender: 'admin'
          })
        })
      }

      // Process SystemUnpaused events
      if (unpauseEvents.status === 'fulfilled' && unpauseEvents.value?.data) {
        unpauseEvents.value.data.forEach((event, index) => {
          const parsedEvent = event.parsedJson as any
          allEvents.push({
            id: `system-unpaused-${event.id.txDigest}-${index}`,
            type: 'SystemUnpaused',
            eventName: 'System Unpaused',
            data: {
              timestamp: parsedEvent.timestamp || 0
            },
            timestamp: event.timestampMs || '0',
            txDigest: event.id.txDigest || '',
            sender: 'admin'
          })
        })
      }

      // Process EmissionPaused events (legacy)
      if (emissionPauseEvents.status === 'fulfilled' && emissionPauseEvents.value?.data) {
        emissionPauseEvents.value.data.forEach((event, index) => {
          const parsedEvent = event.parsedJson as any
          allEvents.push({
            id: `emission-paused-${event.id.txDigest}-${index}`,
            type: 'EmissionPaused',
            eventName: 'Emission Paused (Legacy)',
            data: {
              paused: parsedEvent.paused || false,
              timestamp: parsedEvent.timestamp || 0,
              admin: parsedEvent.admin || ''
            },
            timestamp: event.timestampMs || '0',
            txDigest: event.id.txDigest || '',
            sender: parsedEvent.admin || 'admin'
          })
        })
      }

      return allEvents
    } catch (error) {
      console.error('Error fetching system pause events:', error)
      return []
    }
  }

  // Fetch Recovery events (WeekReset, TimingAdjusted)
  static async fetchRecoveryEvents(limit: number = 50, dateRange: string = 'all'): Promise<GlobalEmissionEvent[]> {
    try {
      const [weekResetEvents, timingAdjustedEvents] = await Promise.allSettled([
        // WeekReset
        suiClient.queryEvents({
          query: { MoveEventType: `${CONSTANTS.PACKAGE_ID}::global_emission_controller::WeekReset` },
          limit: Math.min(limit, 100),
          order: 'descending'
        }),
        // TimingAdjusted
        suiClient.queryEvents({
          query: { MoveEventType: `${CONSTANTS.PACKAGE_ID}::global_emission_controller::TimingAdjusted` },
          limit: Math.min(limit, 100),
          order: 'descending'
        })
      ])

      const allEvents: GlobalEmissionEvent[] = []

      // Process WeekReset events
      if (weekResetEvents.status === 'fulfilled' && weekResetEvents.value?.data) {
        weekResetEvents.value.data.forEach((event, index) => {
          const parsedEvent = event.parsedJson as any
          allEvents.push({
            id: `week-reset-${event.id.txDigest}-${index}`,
            type: 'WeekReset',
            eventName: 'Week Reset',
            week: parsedEvent.target_week || 0,
            data: {
              oldEmissionStart: parsedEvent.old_emission_start || 0,
              newEmissionStart: parsedEvent.new_emission_start || 0,
              targetWeek: parsedEvent.target_week || 0,
              timestamp: parsedEvent.timestamp || 0
            },
            timestamp: event.timestampMs || '0',
            txDigest: event.id.txDigest || '',
            sender: 'admin'
          })
        })
      }

      // Process TimingAdjusted events
      if (timingAdjustedEvents.status === 'fulfilled' && timingAdjustedEvents.value?.data) {
        timingAdjustedEvents.value.data.forEach((event, index) => {
          const parsedEvent = event.parsedJson as any
          allEvents.push({
            id: `timing-adjusted-${event.id.txDigest}-${index}`,
            type: 'TimingAdjusted',
            eventName: 'Timing Adjusted',
            data: {
              oldEmissionStart: parsedEvent.old_emission_start || 0,
              newEmissionStart: parsedEvent.new_emission_start || 0,
              hoursAdjusted: parsedEvent.hours_adjusted || 0,
              subtract: parsedEvent.subtract || false,
              timestamp: parsedEvent.timestamp || 0
            },
            timestamp: event.timestampMs || '0',
            txDigest: event.id.txDigest || '',
            sender: 'admin'
          })
        })
      }

      return allEvents
    } catch (error) {
      console.error('Error fetching recovery events:', error)
      return []
    }
  }

  // Fetch Contract Allocation Requested events
  static async fetchContractAllocationEvents(limit: number = 50, dateRange: string = 'all'): Promise<GlobalEmissionEvent[]> {
    try {
      const events = await suiClient.queryEvents({
        query: {
          MoveEventType: `${CONSTANTS.PACKAGE_ID}::global_emission_controller::ContractAllocationRequested`
        },
        limit: Math.min(limit, 200),
        order: 'descending'
      })

      if (!events || !events.data || events.data.length === 0) {
        return []
      }

      const processedEvents: GlobalEmissionEvent[] = events.data.map((event, index) => {
        const parsedEvent = event.parsedJson as any

        // Format contract type for display
        const contractTypeMap: Record<string, string> = {
          'farm': 'Farm Contract',
          'victory_staking': 'Victory Staking',
          'dev_treasury': 'Dev Treasury'
        }
        
        const contractType = parsedEvent.contract_type || 'unknown'
        const displayName = contractTypeMap[contractType] || contractType

        return {
          id: `allocation-${event.id.txDigest}-${index}`,
          type: 'ContractAllocationRequested',
          eventName: 'Allocation Requested',
          week: parsedEvent.week || 0,
          phase: parsedEvent.phase || 0,
          amount: parsedEvent.allocation || '0',
          contractType: contractType,
          data: {
            contractType: contractType,
            displayName: displayName,
            week: parsedEvent.week || 0,
            phase: parsedEvent.phase || 0,
            allocation: parsedEvent.allocation || '0',
            timestamp: parsedEvent.timestamp || 0
          },
          timestamp: event.timestampMs || '0',
          txDigest: event.id.txDigest || '',
          sender: 'system'
        }
      })

      return processedEvents
    } catch (error) {
      console.error('Error fetching ContractAllocationRequested events:', error)
      return []
    }
  }

  // Main method to get all global emission events
  static async fetchAllGlobalEmissionEvents(filters: GlobalEmissionEventFilters): Promise<GlobalEmissionEventResponse> {
    try {
      let allEvents: GlobalEmissionEvent[] = []

      if (filters.eventType === 'all') {
        const eventLimit = Math.floor(filters.limit / 4) // Distribute across event categories
        const [scheduleEvents, pauseEvents, recoveryEvents, allocationEvents] = await Promise.all([
          this.fetchEmissionScheduleStartedEvents(eventLimit, filters.dateRange),
          this.fetchSystemPauseEvents(eventLimit, filters.dateRange),
          this.fetchRecoveryEvents(eventLimit, filters.dateRange),
          this.fetchContractAllocationEvents(Math.floor(filters.limit / 2), filters.dateRange) // More allocation events expected
        ])
        
        allEvents = [...scheduleEvents, ...pauseEvents, ...recoveryEvents, ...allocationEvents]
        
      } else {
        // Fetch specific event type
        switch (filters.eventType) {
          case 'EmissionScheduleStarted':
            allEvents = await this.fetchEmissionScheduleStartedEvents(filters.limit, filters.dateRange)
            break
          case 'SystemPaused':
          case 'SystemUnpaused':
          case 'EmissionPaused':
            allEvents = await this.fetchSystemPauseEvents(filters.limit, filters.dateRange)
            allEvents = allEvents.filter(event => event.type === filters.eventType)
            break
          case 'WeekReset':
          case 'TimingAdjusted':
            allEvents = await this.fetchRecoveryEvents(filters.limit, filters.dateRange)
            allEvents = allEvents.filter(event => event.type === filters.eventType)
            break
          case 'ContractAllocationRequested':
            allEvents = await this.fetchContractAllocationEvents(filters.limit, filters.dateRange)
            break
          default:
            allEvents = []
        }
      }

      // Sort by timestamp (newest first)
      allEvents.sort((a, b) => {
        const timeA = parseInt(a.timestamp)
        const timeB = parseInt(b.timestamp) 
        return timeB - timeA
      })

      // Apply contract type filter
      if (filters.contractType && filters.contractType !== 'all') {
        allEvents = allEvents.filter(event => 
          event.contractType === filters.contractType
        )
      }

      // Apply search filter
      if (filters.searchTerm && filters.searchTerm.trim()) {
        allEvents = this.applySearchFilter(allEvents, filters.searchTerm.trim())
      }
      
      // Apply final limit
      const limitedEvents = allEvents.slice(0, filters.limit)

      return {
        events: limitedEvents,
        hasNextPage: false,
        totalCount: limitedEvents.length
      }
    } catch (error) {
      console.error('Error in fetchAllGlobalEmissionEvents:', error)
      return {
        events: [],
        hasNextPage: false,
        totalCount: 0
      }
    }
  }

  // Apply search filter
  static applySearchFilter(events: GlobalEmissionEvent[], searchTerm: string): GlobalEmissionEvent[] {
    const searchLower = searchTerm.toLowerCase()
    
    return events.filter(event => {
      return (
        event.eventName.toLowerCase().includes(searchLower) ||
        event.txDigest.toLowerCase().includes(searchLower) ||
        event.contractType?.toLowerCase().includes(searchLower) ||
        event.type.toLowerCase().includes(searchLower) ||
        event.week?.toString().includes(searchLower)
      )
    })
  }

  // Get event statistics
  static getEventStats(events: GlobalEmissionEvent[]): Record<string, any> {
    const stats = {
      total: events.length,
      EmissionScheduleStarted: 0,
      SystemPaused: 0,
      SystemUnpaused: 0,
      WeekReset: 0,
      TimingAdjusted: 0,
      ContractAllocationRequested: 0,
      uniqueContracts: new Set<string>(),
      totalAllocations: 0n,
      currentWeek: 0
    }

    events.forEach(event => {
      // Count by type
      if (event.type in stats) {
        stats[event.type as keyof typeof stats] = (stats[event.type as keyof typeof stats] as number || 0) + 1
      }
      
      // Track unique contracts
      if (event.contractType) {
        stats.uniqueContracts.add(event.contractType)
      }
      
      // Sum allocations
      if (event.amount && event.type === 'ContractAllocationRequested') {
        try {
          stats.totalAllocations += BigInt(event.amount)
        } catch (e) {
          // Ignore invalid amounts
        }
      }

      // Track current week
      if (event.week && event.week > stats.currentWeek) {
        stats.currentWeek = event.week
      }
    })

    return {
      ...stats,
      uniqueContracts: stats.uniqueContracts.size,
      totalAllocations: stats.totalAllocations.toString()
    }
  }

  // Format large numbers for display
  static formatAmount(amount: string, decimals: number = 9): string {
    try {
      if (!amount || amount === '0') return '0'
      
      const amountBigInt = BigInt(amount)
      if (amountBigInt === 0n) return '0'
      
      const divisor = BigInt(10 ** decimals)
      const integerPart = amountBigInt / divisor
      const fractionalPart = amountBigInt % divisor
      
      if (fractionalPart === 0n) {
        return integerPart.toLocaleString()
      }
      
      const fractionalStr = fractionalPart.toString().padStart(decimals, '0')
      const trimmedFractional = fractionalStr.replace(/0+$/, '').substring(0, 4)
      
      if (trimmedFractional === '') {
        return integerPart.toLocaleString()
      }
      
      return `${integerPart.toLocaleString()}.${trimmedFractional}`
    } catch (error) {
      console.error('Error formatting amount:', error)
      return amount
    }
  }

  // Get phase name from number
  static getPhaseName(phase: number): string {
    switch (phase) {
      case 0: return 'Not Started'
      case 1: return 'Bootstrap'
      case 2: return 'Post-Bootstrap'
      case 3: return 'Ended'
      default: return 'Unknown'
    }
  }
}