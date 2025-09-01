// components/tokenlocker/TransactionModal.tsx
import React from 'react'
import { AlertTriangle, Hash, ExternalLink } from 'lucide-react'
import { TokenLockerService } from '../../services/tokenLockerService'

interface TransactionModalProps {
  action: string | null
  dashboardData: any
  victoryAllocations: any
  suiAllocations: any
  revenueAmount: string
  victoryDepositAmount: string
  singleLock?: {
    userAddress: string
    amount: string
    lockPeriod: number
  }
  batchLocks?: Array<{
    userAddress: string
    amount: string
    lockPeriod: number
    status: string
  }>
  onConfirm: (action: string) => void
  onCancel: () => void
  loading: boolean
}

export default function TransactionModal({ 
  action, 
  dashboardData, 
  victoryAllocations,
  suiAllocations,
  revenueAmount,
  victoryDepositAmount,
  singleLock,
  batchLocks,
  onConfirm, 
  onCancel, 
  loading 
}: TransactionModalProps) {
  if (!action) return null

  const getActionDetails = () => {
    switch (action) {
      case 'depositVictory':
        return {
          title: 'Deposit Victory Tokens',
          description: `Deposit ${TokenLockerService.formatVictoryAmount(victoryDepositAmount)} into the reward vault.`,
          warning: 'This will transfer Victory tokens from your wallet to the reward vault.',
          buttonText: 'Deposit Tokens',
          buttonColor: 'bg-purple-600 hover:bg-purple-700'
        }
      case 'updateVictoryAllocations':
        const victoryTotal = Object.values(victoryAllocations).filter((_, i) => i < 4).reduce((a: any, b: any) => a + b, 0)
        return {
          title: 'Update Victory Allocations',
          description: `Update Victory token reward distribution across lock periods.`,
          warning: `Total allocation: ${victoryTotal / 100}%. This affects future Victory token distributions.`,
          buttonText: 'Update Allocations',
          buttonColor: 'bg-purple-600 hover:bg-purple-700'
        }
      case 'updateSUIAllocations':
        const suiTotal = Object.values(suiAllocations).filter((_, i) => i < 4).reduce((a: any, b: any) => a + b, 0)
        return {
          title: 'Update SUI Allocations',
          description: `Update SUI revenue distribution across lock periods.`,
          warning: `Total allocation: ${suiTotal / 100}%. This affects future SUI revenue distributions.`,
          buttonText: 'Update Allocations',
          buttonColor: 'bg-blue-600 hover:bg-blue-700'
        }
      case 'addWeeklyRevenue':
        return {
          title: 'Add Weekly SUI Revenue',
          description: `Add ${TokenLockerService.formatSUIAmount(revenueAmount)} to the SUI reward vault.`,
          warning: 'This will distribute SUI to all lock periods and finalize the current epoch.',
          buttonText: 'Add Revenue',
          buttonColor: 'bg-green-600 hover:bg-green-700'
        }
      case 'createSingleLock':
        return {
          title: 'Create User Lock',
          description: `Create lock for user with ${TokenLockerService.formatVictoryAmount(singleLock?.amount || '0')}.`,
          warning: `This will create a ${TokenLockerService.getLockPeriodDisplayName(singleLock?.lockPeriod || 90)} lock for ${TokenLockerService.formatAddress(singleLock?.userAddress || '')}.`,
          buttonText: 'Create Lock',
          buttonColor: 'bg-green-600 hover:bg-green-700'
        }
      case 'createBatchLocks':
        const totalBatchAmount = batchLocks?.reduce((sum, lock) => sum + parseInt(lock.amount), 0) || 0
        return {
          title: 'Create Batch Locks',
          description: `Create ${batchLocks?.length || 0} user locks with total ${TokenLockerService.formatVictoryAmount(totalBatchAmount.toString())}.`,
          warning: 'This will create multiple locks for different users in a single transaction.',
          buttonText: 'Create Batch Locks',
          buttonColor: 'bg-orange-600 hover:bg-orange-700'
        }
      default:
        return {
          title: 'Confirm Action',
          description: 'Are you sure you want to proceed?',
          warning: 'This action may have significant effects.',
          buttonText: 'Confirm',
          buttonColor: 'bg-gray-600 hover:bg-gray-700'
        }
    }
  }

  const details = getActionDetails()

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-white mb-3">{details.title}</h3>
        <p className="text-slate-300 mb-4">{details.description}</p>
        
        {/* Show allocation details for allocation updates */}
        {(action === 'updateVictoryAllocations' || action === 'updateSUIAllocations') && (
          <div className="bg-slate-700/30 rounded-lg p-3 mb-4">
            <div className="text-slate-300 text-sm mb-2">New allocations:</div>
            {Object.entries(action === 'updateVictoryAllocations' ? victoryAllocations : suiAllocations)
              .filter(([key]) => key !== 'total')
              .map(([key, value]) => (
                <div key={key} className="text-xs text-slate-400 mb-1">
                  {TokenLockerService.getLockPeriodDisplayName(
                    key === 'week' ? 7 : key === 'threeMonth' ? 90 : key === 'year' ? 365 : 1095
                  )}: {TokenLockerService.formatAllocationPercentage(value as number)}
                </div>
              ))}
          </div>
        )}

        {/* Show revenue distribution preview */}
        {action === 'addWeeklyRevenue' && dashboardData?.config && (
          <div className="bg-slate-700/30 rounded-lg p-3 mb-4">
            <div className="text-slate-300 text-sm mb-2">Distribution preview:</div>
            {[
              { period: '1 Week', allocation: dashboardData.config.allocations.sui.week },
              { period: '3 Months', allocation: dashboardData.config.allocations.sui.threeMonth },
              { period: '1 Year', allocation: dashboardData.config.allocations.sui.year },
              { period: '3 Years', allocation: dashboardData.config.allocations.sui.threeYear }
            ].map(({ period, allocation }) => {
              const amount = (parseFloat(revenueAmount) * allocation) / 10000
              return (
                <div key={period} className="text-xs text-slate-400 mb-1">
                  {period}: {(amount / 1e9).toFixed(2)} SUI ({TokenLockerService.formatAllocationPercentage(allocation)})
                </div>
              )
            })}
          </div>
        )}

        {/* Show single lock details */}
        {action === 'createSingleLock' && singleLock && (
          <div className="bg-slate-700/30 rounded-lg p-3 mb-4">
            <div className="text-slate-300 text-sm mb-2">Lock details:</div>
            <div className="text-xs text-slate-400 mb-1">
              User: {TokenLockerService.formatAddress(singleLock.userAddress)}
            </div>
            <div className="text-xs text-slate-400 mb-1">
              Amount: {TokenLockerService.formatVictoryAmount(singleLock.amount)}
            </div>
            <div className="text-xs text-slate-400 mb-1">
              Period: {TokenLockerService.getLockPeriodDisplayName(singleLock.lockPeriod)}
            </div>
          </div>
        )}

        {/* Show batch lock details */}
        {action === 'createBatchLocks' && batchLocks && batchLocks.length > 0 && (
          <div className="bg-slate-700/30 rounded-lg p-3 mb-4 max-h-40 overflow-y-auto">
            <div className="text-slate-300 text-sm mb-2">Batch locks ({batchLocks.length}):</div>
            {batchLocks.slice(0, 5).map((lock, index) => (
              <div key={index} className="text-xs text-slate-400 mb-1">
                {TokenLockerService.formatAddress(lock.userAddress)}: {TokenLockerService.formatVictoryAmount(lock.amount)} ({TokenLockerService.getLockPeriodDisplayName(lock.lockPeriod)})
              </div>
            ))}
            {batchLocks.length > 5 && (
              <div className="text-xs text-slate-400">
                ... and {batchLocks.length - 5} more locks
              </div>
            )}
          </div>
        )}
        
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-400 text-sm font-medium">Warning</span>
          </div>
          <p className="text-yellow-300 text-sm mt-1">{details.warning}</p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(action)}
            disabled={loading}
            className={`flex-1 ${details.buttonColor} disabled:opacity-50 text-white font-medium px-4 py-2 rounded-lg transition-colors`}
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Processing...</span>
              </div>
            ) : (
              details.buttonText
            )}
          </button>
        </div>

        {/* Additional info for complex actions */}
        {(action === 'createBatchLocks' || action === 'addWeeklyRevenue') && (
          <div className="mt-4 pt-3 border-t border-slate-600/30">
            <p className="text-xs text-slate-400">
              This transaction may take longer than usual due to the complexity of the operation.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}