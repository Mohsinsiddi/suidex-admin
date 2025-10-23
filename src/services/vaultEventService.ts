// services/vaultEventService.ts
import { suiClient } from '../utils/suiClient'
import { CONSTANTS } from '../constants'

export interface VaultEvent {
  id: string
  type: 'RewardVaultCreated' | 'VaultDeposit' | 'AdminVaultSweep' | 'LockedTokenVaultCreated' | 'VictoryRewardVaultCreated' | 'SUIRewardVaultCreated' | 'VictoryTokensDeposited'
  eventName: string
  admin?: string
  recipient?: string
  vaultType?: string
  vaultId?: string
  amount?: string
  data: any
  timestamp: string
  txDigest: string
  sender: string
  module: 'farm' | 'token_locker'
}

export interface VaultEventFilters {
  eventType: string
  adminAddress?: string
  vaultType?: string
  module?: string
  dateRange: string
  searchTerm: string
  limit: number
}

export interface VaultEventResponse {
  events: VaultEvent[]
  hasNextPage: boolean
  nextCursor?: string
  totalCount: number
}

export class VaultEventService {
  
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

  // === FARM VAULT EVENTS ===

  // Fetch Farm RewardVaultCreated events
  static async fetchFarmRewardVaultCreatedEvents(limit: number = 50): Promise<VaultEvent[]> {
    try {
      const events = await suiClient.queryEvents({
        query: {
          MoveEventType: `${CONSTANTS.PACKAGE_ID}::farm::RewardVaultCreated`
        },
        limit: Math.min(limit, 200),
        order: 'descending'
      })

      if (!events || !events.data || events.data.length === 0) {
        return []
      }

      const processedEvents: VaultEvent[] = events.data.map((event, index) => {
        const parsedEvent = event.parsedJson as any

        return {
          id: `farm-reward-vault-created-${event.id.txDigest}-${index}`,
          type: 'RewardVaultCreated',
          eventName: 'Farm Reward Vault Created',
          admin: parsedEvent.admin || '',
          vaultId: parsedEvent.vault_id || '',
          data: {
            vaultId: parsedEvent.vault_id || '',
            admin: parsedEvent.admin || '',
            timestamp: parsedEvent.timestamp || 0
          },
          timestamp: event.timestampMs || '0',
          txDigest: event.id.txDigest || '',
          sender: parsedEvent.admin || 'admin',
          module: 'farm'
        }
      })

      return processedEvents
    } catch (error) {
      console.error('Error fetching Farm RewardVaultCreated events:', error)
      return []
    }
  }

  // Fetch Farm VaultDeposit events
  static async fetchFarmVaultDepositEvents(limit: number = 50): Promise<VaultEvent[]> {
    try {
      const events = await suiClient.queryEvents({
        query: {
          MoveEventType: `${CONSTANTS.PACKAGE_ID}::farm::VaultDeposit`
        },
        limit: Math.min(limit, 200),
        order: 'descending'
      })

      if (!events || !events.data || events.data.length === 0) {
        return []
      }

      const processedEvents: VaultEvent[] = events.data.map((event, index) => {
        const parsedEvent = event.parsedJson as any

        return {
          id: `farm-vault-deposit-${event.id.txDigest}-${index}`,
          type: 'VaultDeposit',
          eventName: 'Farm Vault Deposit',
          amount: parsedEvent.amount || '0',
          data: {
            amount: parsedEvent.amount || '0',
            totalBalance: parsedEvent.total_balance || '0',
            timestamp: parsedEvent.timestamp || 0
          },
          timestamp: event.timestampMs || '0',
          txDigest: event.id.txDigest || '',
          sender: 'admin',
          module: 'farm'
        }
      })

      return processedEvents
    } catch (error) {
      console.error('Error fetching Farm VaultDeposit events:', error)
      return []
    }
  }

  // Fetch Farm AdminVaultSweep events
  static async fetchFarmAdminVaultSweepEvents(limit: number = 50): Promise<VaultEvent[]> {
    try {
      const events = await suiClient.queryEvents({
        query: {
          MoveEventType: `${CONSTANTS.PACKAGE_ID}::farm::AdminVaultSweep`
        },
        limit: Math.min(limit, 200),
        order: 'descending'
      })

      if (!events || !events.data || events.data.length === 0) {
        return []
      }

      const processedEvents: VaultEvent[] = events.data.map((event, index) => {
        const parsedEvent = event.parsedJson as any

        return {
          id: `farm-admin-vault-sweep-${event.id.txDigest}-${index}`,
          type: 'AdminVaultSweep',
          eventName: 'Farm Admin Vault Sweep',
          admin: 'admin',
          recipient: parsedEvent.recipient || '',
          amount: parsedEvent.amount || '0',
          data: {
            amount: parsedEvent.amount || '0',
            recipient: parsedEvent.recipient || '',
            remainingVaultBalance: parsedEvent.remaining_vault_balance || '0',
            timestamp: parsedEvent.timestamp || 0
          },
          timestamp: event.timestampMs || '0',
          txDigest: event.id.txDigest || '',
          sender: 'admin',
          module: 'farm'
        }
      })

      return processedEvents
    } catch (error) {
      console.error('Error fetching Farm AdminVaultSweep events:', error)
      return []
    }
  }

  // === TOKEN LOCKER VAULT EVENTS ===

  // Fetch Token Locker VaultDeposit events
  static async fetchLockerVaultDepositEvents(limit: number = 50): Promise<VaultEvent[]> {
    try {
      const events = await suiClient.queryEvents({
        query: {
          MoveEventType: `${CONSTANTS.PACKAGE_ID}::victory_token_locker::VaultDeposit`
        },
        limit: Math.min(limit, 200),
        order: 'descending'
      })

      if (!events || !events.data || events.data.length === 0) {
        return []
      }

      const processedEvents: VaultEvent[] = events.data.map((event, index) => {
        const parsedEvent = event.parsedJson as any

        return {
          id: `locker-vault-deposit-${event.id.txDigest}-${index}`,
          type: 'VaultDeposit',
          eventName: 'Token Locker Vault Deposit',
          vaultType: parsedEvent.vault_type || 'Unknown',
          amount: parsedEvent.amount || '0',
          data: {
            vaultType: parsedEvent.vault_type || 'Unknown',
            amount: parsedEvent.amount || '0',
            totalBalance: parsedEvent.total_balance || '0',
            timestamp: parsedEvent.timestamp || 0
          },
          timestamp: event.timestampMs || '0',
          txDigest: event.id.txDigest || '',
          sender: 'admin',
          module: 'token_locker'
        }
      })

      return processedEvents
    } catch (error) {
      console.error('Error fetching Token Locker VaultDeposit events:', error)
      return []
    }
  }

  // === ENTRY FUNCTIONS FOR VAULT CREATION (Manual Check) ===

  // Check for vault creation transactions by analyzing create_reward_vault calls
  static async fetchVaultCreationTransactions(limit: number = 50): Promise<VaultEvent[]> {
    try {
      // This will find transactions that called vault creation functions
      // Note: This is a more complex query and might need adjustment based on your indexing
      
      const farmVaultEvents = await this.fetchFarmRewardVaultCreatedEvents(limit)
      const lockerVaultDeposits = await this.fetchLockerVaultDepositEvents(limit)
      
      // Combine and identify potential vault creation patterns
      const allVaultEvents: VaultEvent[] = []
      
      // Add farm vault creation events
      allVaultEvents.push(...farmVaultEvents)
      
      // For locker, we can infer vault creation from first deposits to new vault types
      const seenVaultTypes = new Set<string>()
      lockerVaultDeposits.forEach(event => {
        if (event.data.vaultType && !seenVaultTypes.has(event.data.vaultType)) {
          seenVaultTypes.add(event.data.vaultType)
          
          // Create a synthetic vault creation event
          allVaultEvents.push({
            id: `locker-vault-created-inferred-${event.id}`,
            type: event.data.vaultType === 'Victory Rewards' ? 'VictoryRewardVaultCreated' : 
                  event.data.vaultType === 'SUI Rewards' ? 'SUIRewardVaultCreated' : 'LockedTokenVaultCreated',
            eventName: `${event.data.vaultType} Vault Created (Inferred)`,
            vaultType: event.data.vaultType,
            data: {
              vaultType: event.data.vaultType,
              firstDepositAmount: event.amount,
              inferredFromTransaction: event.txDigest,
              timestamp: event.data.timestamp
            },
            timestamp: event.timestamp,
            txDigest: event.txDigest,
            sender: 'admin',
            module: 'token_locker'
          })
        }
      })
      
      return allVaultEvents.sort((a, b) => parseInt(b.timestamp) - parseInt(a.timestamp))
    } catch (error) {
      console.error('Error fetching vault creation transactions:', error)
      return []
    }
  }

  // 🆕 NEW: Fetch actual vault objects by admin address
  static async fetchVaultObjectsByAdmin(adminAddress: string): Promise<any[]> {
    try {
      console.log(`🔍 Fetching vault objects for admin: ${adminAddress}`)
      
      // Query for objects owned by the admin address
      const ownedObjects = await suiClient.getOwnedObjects({
        owner: adminAddress,
        filter: {
          StructType: `${CONSTANTS.PACKAGE_ID}::farm::RewardVault`
        },
        options: {
          showContent: true,
          showType: true,
          showDisplay: true
        }
      })

      const farmVaults = ownedObjects.data || []

      // Also check for Token Locker vaults
      const lockerVaults = await Promise.all([
        suiClient.getOwnedObjects({
          owner: adminAddress,
          filter: {
            StructType: `${CONSTANTS.PACKAGE_ID}::victory_token_locker::LockedTokenVault`
          },
          options: {
            showContent: true,
            showType: true,
            showDisplay: true
          }
        }),
        suiClient.getOwnedObjects({
          owner: adminAddress,
          filter: {
            StructType: `${CONSTANTS.PACKAGE_ID}::victory_token_locker::VictoryRewardVault`
          },
          options: {
            showContent: true,
            showType: true,
            showDisplay: true
          }
        }),
        suiClient.getOwnedObjects({
          owner: adminAddress,
          filter: {
            StructType: `${CONSTANTS.PACKAGE_ID}::victory_token_locker::SUIRewardVault`
          },
          options: {
            showContent: true,
            showType: true,
            showDisplay: true
          }
        })
      ])

      const allVaults = [
        ...farmVaults,
        ...(lockerVaults[0]?.data || []),
        ...(lockerVaults[1]?.data || []),
        ...(lockerVaults[2]?.data || [])
      ]

      console.log(`✅ Found ${allVaults.length} vault objects for admin`)
      return allVaults

    } catch (error) {
      console.error('❌ Error fetching vault objects:', error)
      return []
    }
  }

  // 🆕 NEW: Get vault objects with their current state
  static async fetchVaultObjectsWithState(adminAddress?: string): Promise<any[]> {
    try {
      const targetAdmin = adminAddress || CONSTANTS.ADMIN
      
      const vaultObjects = await this.fetchVaultObjectsByAdmin(targetAdmin)
      
      const vaultStates = await Promise.all(
        vaultObjects.map(async (vault) => {
          try {
            const objectDetails = await suiClient.getObject({
              id: vault.data?.objectId || '',
              options: {
                showContent: true,
                showType: true,
                showPreviousTransaction: true
              }
            })

            return {
              objectId: vault.data?.objectId,
              type: vault.data?.type,
              content: objectDetails.data?.content,
              previousTransaction: objectDetails.data?.previousTransaction,
              version: vault.data?.version,
              digest: vault.data?.digest
            }
          } catch (error) {
            console.error(`Error fetching vault details for ${vault.data?.objectId}:`, error)
            return null
          }
        })
      )

      return vaultStates.filter(state => state !== null)
    } catch (error) {
      console.error('Error fetching vault states:', error)
      return []
    }
  }

  // 🆕 NEW: Deduplicate events
  static deduplicateEvents(events: VaultEvent[]): VaultEvent[] {
    const seen = new Set<string>()
    const deduplicated: VaultEvent[] = []

    events.forEach(event => {
      // Create unique key: txDigest + eventType + timestamp + vaultId
      const uniqueKey = `${event.txDigest}-${event.type}-${event.timestamp}-${event.data.vaultId || event.data.amount}`
      
      if (!seen.has(uniqueKey)) {
        seen.add(uniqueKey)
        deduplicated.push(event)
      } else {
        console.log(`🔄 Duplicate event filtered: ${event.type} ${event.txDigest}`)
      }
    })

    console.log(`📊 Deduplication: ${events.length} → ${deduplicated.length} events`)
    return deduplicated
  }

  // === MAIN FETCH FUNCTION ===

  // Main method to get all vault events
  static async fetchAllVaultEvents(filters: VaultEventFilters): Promise<VaultEventResponse> {
    try {
      let allEvents: VaultEvent[] = []

      if (filters.eventType === 'all') {
        const eventLimit = Math.floor(filters.limit / 4) // Distribute across categories
        const [farmVaultEvents, farmDepositEvents, farmSweepEvents, lockerDepositEvents] = await Promise.all([
          this.fetchFarmRewardVaultCreatedEvents(eventLimit),
          this.fetchFarmVaultDepositEvents(eventLimit),
          this.fetchFarmAdminVaultSweepEvents(eventLimit),
          this.fetchLockerVaultDepositEvents(eventLimit)
        ])
        
        allEvents = [...farmVaultEvents, ...farmDepositEvents, ...farmSweepEvents, ...lockerDepositEvents]
        
        // Also get inferred vault creation events
        const creationEvents = await this.fetchVaultCreationTransactions(filters.limit)
        allEvents.push(...creationEvents)
        
      } else {
        // Fetch specific event type
        switch (filters.eventType) {
          case 'RewardVaultCreated':
            allEvents = await this.fetchFarmRewardVaultCreatedEvents(filters.limit)
            break
          case 'VaultDeposit':
            if (filters.module === 'farm') {
              allEvents = await this.fetchFarmVaultDepositEvents(filters.limit)
            } else if (filters.module === 'token_locker') {
              allEvents = await this.fetchLockerVaultDepositEvents(filters.limit)
            } else {
              const [farmEvents, lockerEvents] = await Promise.all([
                this.fetchFarmVaultDepositEvents(filters.limit / 2),
                this.fetchLockerVaultDepositEvents(filters.limit / 2)
              ])
              allEvents = [...farmEvents, ...lockerEvents]
            }
            break
          case 'AdminVaultSweep':
            allEvents = await this.fetchFarmAdminVaultSweepEvents(filters.limit)
            break
          case 'VaultCreation':
            allEvents = await this.fetchVaultCreationTransactions(filters.limit)
            break
          default:
            allEvents = []
        }
      }

      // 🆕 DEDUPLICATE EVENTS: Remove duplicates based on transaction + event type
      allEvents = this.deduplicateEvents(allEvents)

      // Sort by timestamp (newest first)
      allEvents.sort((a, b) => {
        const timeA = parseInt(a.timestamp)
        const timeB = parseInt(b.timestamp) 
        return timeB - timeA
      })

      // Apply module filter
      if (filters.module && filters.module !== 'all') {
        allEvents = allEvents.filter(event => event.module === filters.module)
      }

      // Apply vault type filter
      if (filters.vaultType && filters.vaultType.trim()) {
        allEvents = allEvents.filter(event => 
          event.vaultType?.toLowerCase().includes(filters.vaultType!.toLowerCase()) ||
          event.data.vaultType?.toLowerCase().includes(filters.vaultType!.toLowerCase())
        )
      }

      // Apply admin filter
      if (filters.adminAddress && filters.adminAddress.trim()) {
        allEvents = allEvents.filter(event => 
          event.admin?.toLowerCase().includes(filters.adminAddress!.toLowerCase()) ||
          event.sender?.toLowerCase().includes(filters.adminAddress!.toLowerCase())
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
      console.error('Error in fetchAllVaultEvents:', error)
      return {
        events: [],
        hasNextPage: false,
        totalCount: 0
      }
    }
  }

  // Apply search filter
  static applySearchFilter(events: VaultEvent[], searchTerm: string): VaultEvent[] {
    const searchLower = searchTerm.toLowerCase()
    
    return events.filter(event => {
      return (
        event.eventName.toLowerCase().includes(searchLower) ||
        event.txDigest.toLowerCase().includes(searchLower) ||
        event.sender.toLowerCase().includes(searchLower) ||
        event.admin?.toLowerCase().includes(searchLower) ||
        event.vaultType?.toLowerCase().includes(searchLower) ||
        event.type.toLowerCase().includes(searchLower) ||
        event.module.toLowerCase().includes(searchLower) ||
        JSON.stringify(event.data).toLowerCase().includes(searchLower)
      )
    })
  }

  // Get event statistics
  static getEventStats(events: VaultEvent[]): Record<string, any> {
    const stats = {
      total: events.length,
      RewardVaultCreated: 0,
      VaultDeposit: 0,
      AdminVaultSweep: 0,
      LockedTokenVaultCreated: 0,
      VictoryRewardVaultCreated: 0,
      SUIRewardVaultCreated: 0,
      VictoryTokensDeposited: 0,
      farmEvents: 0,
      lockerEvents: 0,
      uniqueAdmins: new Set<string>(),
      uniqueVaultTypes: new Set<string>(),
      totalDeposited: 0,
      totalSwept: 0
    }

    events.forEach(event => {
      // Count by type
      if (event.type in stats) {
        stats[event.type as keyof typeof stats] = (stats[event.type as keyof typeof stats] as number || 0) + 1
      }

      // Count by module
      if (event.module === 'farm') {
        stats.farmEvents += 1
      } else if (event.module === 'token_locker') {
        stats.lockerEvents += 1
      }
      
      // Track unique admins
      if (event.admin && event.admin !== 'unknown') {
        stats.uniqueAdmins.add(event.admin)
      }
      if (event.sender && event.sender !== 'unknown' && event.sender !== 'system') {
        stats.uniqueAdmins.add(event.sender)
      }

      // Track unique vault types
      if (event.vaultType) {
        stats.uniqueVaultTypes.add(event.vaultType)
      }
      if (event.data.vaultType) {
        stats.uniqueVaultTypes.add(event.data.vaultType)
      }

      // Track amounts
      if (event.amount && event.type === 'VaultDeposit') {
        try {
          stats.totalDeposited += parseFloat(event.amount)
        } catch (e) {
          // Ignore parsing errors
        }
      }
      if (event.amount && event.type === 'AdminVaultSweep') {
        try {
          stats.totalSwept += parseFloat(event.amount)
        } catch (e) {
          // Ignore parsing errors
        }
      }
    })

    return {
      ...stats,
      uniqueAdmins: stats.uniqueAdmins.size,
      uniqueVaultTypes: stats.uniqueVaultTypes.size
    }
  }

  // Format amount for display with smart decimal detection
  static formatAmount(amount: string, decimals?: number): string {
    try {
      if (!amount || amount === '0') return '0'
      
      // Smart decimal detection based on context
      const actualDecimals = decimals || 6 // Default to 6 for Victory tokens
      
      const amountBigInt = BigInt(amount)
      if (amountBigInt === 0n) return '0'
      
      const divisor = BigInt(10 ** actualDecimals)
      const integerPart = amountBigInt / divisor
      const fractionalPart = amountBigInt % divisor
      
      if (fractionalPart === 0n) {
        return integerPart.toLocaleString()
      }
      
      const fractionalStr = fractionalPart.toString().padStart(actualDecimals, '0')
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

  // Format Victory token amounts specifically
  static formatVictoryAmount(amount: string): string {
    return this.formatAmount(amount, 6)
  }

  // Format SUI amounts specifically  
  static formatSUIAmount(amount: string): string {
    return this.formatAmount(amount, 9)
  }

  // Format timestamp for display
  static formatTimestamp(timestamp: string): string {
    try {
      const date = new Date(parseInt(timestamp))
      return date.toLocaleString()
    } catch (error) {
      console.error('Error formatting timestamp:', error)
      return timestamp
    }
  }

  // Get vault type display name
  static getVaultTypeDisplayName(vaultType: string): string {
    const typeMap: Record<string, string> = {
      'Victory Rewards': 'Victory Reward Vault',
      'SUI Rewards': 'SUI Reward Vault',
      'Locked Tokens': 'Locked Token Vault',
      'farm_reward': 'Farm Reward Vault',
      'locker_victory': 'Locker Victory Vault',
      'locker_sui': 'Locker SUI Vault'
    }
    
    return typeMap[vaultType] || vaultType
  }

  // Get module display name
  static getModuleDisplayName(module: string): string {
    return module === 'farm' ? 'Farm Module' : 
           module === 'token_locker' ? 'Token Locker Module' : 
           module
  }
}