// components/tokenlocker/index.ts
export { default as TokenLockerTab } from './TokenLockerTab'
export { default as SystemMonitor } from './SystemMonitor'
export { default as AdminPanel } from './AdminPanel'
export { default as EpochManager } from './EpochManager'
export { default as EpochHistory } from './EpochHistory'
export { default as TransactionModal } from './TransactionModal'
export { default as LoadingSkeleton } from './LoadingSkeleton'

// Re-export the enhanced service
export { TokenLockerService } from '../../services/tokenLockerService'

// Export types for external use
export type {
  TokenLockerConfig,
  TokenLockerStats,
  LockerAdminEvent,
  SystemHealth,
  BatchLockOperation
} from '../../services/tokenLockerService'