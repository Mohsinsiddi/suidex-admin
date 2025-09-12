// components/tokenlocker/TransactionModal.tsx - DYNAMIC VERSION FOR ALL ACTIONS
import React from 'react'
import { AlertTriangle, Hash, ExternalLink, Calendar, DollarSign, Users, Settings } from 'lucide-react'
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
        const depositAmount = TokenLockerService.formatVictoryAmount(victoryDepositAmount)
        const currentVictoryBalance = dashboardData?.config ? 
          TokenLockerService.formatVictoryAmount(dashboardData.config.vaultBalances.victoryRewards) : '0 VICTORY'
        
        return {
          title: 'Deposit Victory Tokens',
          description: `Deposit ${depositAmount} into the reward vault for user distributions.`,
          warning: 'This will transfer Victory tokens from your wallet to the reward vault.',
          buttonText: 'Deposit Tokens',
          buttonColor: 'bg-purple-600 hover:bg-purple-700',
          icon: DollarSign,
          details: [
            { label: 'Deposit Amount', value: depositAmount },
            { label: 'Current Vault Balance', value: currentVictoryBalance },
            { label: 'New Balance', value: TokenLockerService.formatVictoryAmount((parseInt(victoryDepositAmount || '0') + parseInt(dashboardData?.config?.vaultBalances?.victoryRewards || '0')).toString()) }
          ]
        }

      case 'updateVictoryAllocations':
        const victoryTotal = Object.values(victoryAllocations).filter((_, i) => i < 4).reduce((a: any, b: any) => a + b, 0)
        const victoryAllocDetails = Object.entries(victoryAllocations)
          .filter(([key]) => key !== 'total')
          .map(([key, value]) => ({
            label: TokenLockerService.getLockPeriodDisplayName(
              key === 'week' ? 7 : key === 'threeMonth' ? 90 : key === 'year' ? 365 : 1095
            ),
            value: TokenLockerService.formatAllocationPercentage(value as number)
          }))

        return {
          title: 'Update Victory Allocations',
          description: `Update Victory token reward distribution across all lock periods.`,
          warning: `Total allocation: ${victoryTotal / 100}%. This affects all future Victory token distributions.`,
          buttonText: 'Update Allocations',
          buttonColor: 'bg-purple-600 hover:bg-purple-700',
          icon: Settings,
          details: victoryAllocDetails,
          isValid: victoryTotal === 10000
        }

      case 'updateSUIAllocations':
        const suiTotal = Object.values(suiAllocations).filter((_, i) => i < 4).reduce((a: any, b: any) => a + b, 0)
        const suiAllocDetails = Object.entries(suiAllocations)
          .filter(([key]) => key !== 'total')
          .map(([key, value]) => ({
            label: TokenLockerService.getLockPeriodDisplayName(
              key === 'week' ? 7 : key === 'threeMonth' ? 90 : key === 'year' ? 365 : 1095
            ),
            value: TokenLockerService.formatAllocationPercentage(value as number)
          }))

        return {
          title: 'Update SUI Allocations',
          description: `Update SUI revenue distribution across all lock periods.`,
          warning: `Total allocation: ${suiTotal / 100}%. This affects all future SUI revenue distributions.`,
          buttonText: 'Update Allocations',
          buttonColor: 'bg-blue-600 hover:bg-blue-700',
          icon: Settings,
          details: suiAllocDetails,
          isValid: suiTotal === 10000
        }

      case 'addWeeklyRevenue':
        const revenueAmountFormatted = TokenLockerService.formatSUIAmount(revenueAmount)
        const currentSUIBalance = dashboardData?.config ? 
          TokenLockerService.formatSUIAmount(dashboardData.config.vaultBalances.suiRewards) : '0 SUI'
        const isFirstRevenue = !dashboardData?.timing?.protocol?.initialized
        
        // Calculate distribution preview
        const distributionDetails = dashboardData?.config ? [
          { period: '1 Week', allocation: dashboardData.config.allocations.sui.week },
          { period: '3 Months', allocation: dashboardData.config.allocations.sui.threeMonth },
          { period: '1 Year', allocation: dashboardData.config.allocations.sui.year },
          { period: '3 Years', allocation: dashboardData.config.allocations.sui.threeYear }
        ].map(({ period, allocation }) => {
          const amount = (parseFloat(revenueAmount) * allocation) / 10000
          return {
            label: period,
            value: `${(amount / 1e9).toFixed(2)} SUI (${TokenLockerService.formatAllocationPercentage(allocation)})`
          }
        }) : []

        return {
          title: 'Add Weekly SUI Revenue',
          description: `Add ${revenueAmountFormatted} to distribute across all lock periods.`,
          warning: isFirstRevenue ? 
            'This will initialize the protocol timing and create the first epoch automatically.' :
            'This will distribute SUI to all lock periods and finalize the current epoch for user claims.',
          buttonText: 'Add Revenue',
          buttonColor: 'bg-green-600 hover:bg-green-700',
          icon: DollarSign,
          details: [
            { label: 'Revenue Amount', value: revenueAmountFormatted },
            { label: 'Current Vault Balance', value: currentSUIBalance },
            { label: 'Protocol Status', value: isFirstRevenue ? 'Will Initialize' : 'Initialized' },
            ...distributionDetails
          ],
          specialNote: isFirstRevenue ? 'This is the first revenue addition and will automatically initialize the protocol timing system.' : undefined
        }

      case 'createNextEpoch':
        const nextPendingEpoch = dashboardData?.epochs?.find((e: any) => e.status === 'pending')
        const nextEpochId = nextPendingEpoch?.epochId || 1
        const pendingCount = dashboardData?.epochs?.filter((e: any) => e.status === 'pending')?.length || 0
        const protocolInfo = dashboardData?.timing?.protocol

        return {
          title: 'Create Next Epoch',
          description: `Create Epoch #${nextEpochId} to maintain the predictable schedule.`,
          warning: 'This will create the next epoch in sequence and make it available for revenue distribution.',
          buttonText: 'Create Epoch',
          buttonColor: 'bg-orange-600 hover:bg-orange-700',
          icon: Calendar,
          details: [
            { label: 'Next Epoch ID', value: `#${nextEpochId}` },
            { label: 'Pending Epochs', value: pendingCount.toString() },
            { label: 'Epoch Duration', value: protocolInfo?.epochDuration || '7 days' },
            { label: 'Total Expected', value: protocolInfo?.totalEpochs?.toString() || 'Unknown' }
          ]
        }
       
      case 'initializeProtocol':
        const protocolStatus = dashboardData?.timing?.protocol
        
        return {
          title: 'Initialize Protocol Timing',
          description: 'Initialize the protocol timing system to enable predictable epoch scheduling.',
          warning: 'This will set the protocol start time and enable the epoch system. This can only be done once.',
          buttonText: 'Initialize Protocol',
          buttonColor: 'bg-orange-600 hover:bg-orange-700',
          icon: Calendar,
          details: [
            { label: 'Current Status', value: protocolStatus?.initialized ? 'Already Initialized' : 'Not Initialized' },
            { label: 'Action', value: 'Set protocol timing' },
            { label: 'Epoch Duration', value: '7 days' },
            { label: 'Expected Epochs', value: '156 total' }
          ],
          isValid: !protocolStatus?.initialized,
          specialNote: 'After initialization, you can create epochs and add weekly SUI revenue.'
        }  

      case 'createSingleLock':
        if (!singleLock) {
          return {
            title: 'Create User Lock',
            description: 'Lock data not available.',
            warning: 'Please check the form data and try again.',
            buttonText: 'Create Lock',
            buttonColor: 'bg-gray-600 hover:bg-gray-700',
            icon: Users,
            details: [],
            isValid: false
          }
        }

        const lockAmount = TokenLockerService.formatVictoryAmount(singleLock.amount)
        const lockPeriodName = TokenLockerService.getLockPeriodDisplayName(singleLock.lockPeriod)
        const isValidAddress = TokenLockerService.validateUserAddress(singleLock.userAddress).isValid
        const isValidAmount = TokenLockerService.validateAmount(singleLock.amount).isValid
        const isValidPeriod = TokenLockerService.validateLockPeriod(singleLock.lockPeriod).isValid
        const isValidLock = isValidAddress && isValidAmount && isValidPeriod

        return {
          title: 'Create User Lock',
          description: `Create ${lockPeriodName} lock for user with ${lockAmount}.`,
          warning: `This will create a lock for ${TokenLockerService.formatAddress(singleLock.userAddress)} and transfer tokens from your wallet.`,
          buttonText: 'Create Lock',
          buttonColor: isValidLock ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600',
          icon: Users,
          details: [
            { 
              label: 'User Address', 
              value: TokenLockerService.formatAddress(singleLock.userAddress),
              isValid: isValidAddress,
              error: !isValidAddress ? 'Invalid address format' : undefined
            },
            { 
              label: 'Lock Amount', 
              value: lockAmount,
              isValid: isValidAmount,
              error: !isValidAmount ? 'Invalid amount' : undefined
            },
            { 
              label: 'Lock Period', 
              value: lockPeriodName,
              isValid: isValidPeriod
            },
            { 
              label: 'Min Required', 
              value: TokenLockerService.formatVictoryAmount(
                TokenLockerService.getMinimumLockAmounts()[singleLock.lockPeriod] || '1000000'
              )
            }
          ],
          isValid: isValidLock
        }

      case 'createBatchLocks':
        if (!batchLocks || batchLocks.length === 0) {
          return {
            title: 'Create Batch Locks',
            description: 'No batch lock data available.',
            warning: 'Please add lock entries and try again.',
            buttonText: 'Create Batch Locks',
            buttonColor: 'bg-gray-600',
            icon: Users,
            details: [],
            isValid: false
          }
        }

        const totalBatchAmount = batchLocks.reduce((sum, lock) => sum + parseInt(lock.amount || '0'), 0)
        const batchValidation = TokenLockerService.validateBatchLockOperations(batchLocks)
        const validLocks = batchLocks.filter(lock => {
          const addressValid = TokenLockerService.validateUserAddress(lock.userAddress).isValid
          const amountValid = TokenLockerService.validateAmount(lock.amount).isValid
          const periodValid = TokenLockerService.validateLockPeriod(lock.lockPeriod).isValid
          return addressValid && amountValid && periodValid
        }).length

        return {
          title: 'Create Batch Locks',
          description: `Create ${batchLocks.length} user locks with total ${TokenLockerService.formatVictoryAmount(totalBatchAmount.toString())}.`,
          warning: 'This will create multiple locks for different users in a single transaction.',
          buttonText: 'Create Batch Locks',
          buttonColor: batchValidation.isValid ? 'bg-orange-600 hover:bg-orange-700' : 'bg-gray-600',
          icon: Users,
          details: [
            { label: 'Total Locks', value: batchLocks.length.toString() },
            { label: 'Valid Locks', value: validLocks.toString() },
            { label: 'Total Amount', value: TokenLockerService.formatVictoryAmount(totalBatchAmount.toString()) },
            { label: 'Estimated Gas', value: 'High (Complex Transaction)' }
          ],
          isValid: batchValidation.isValid,
          batchPreview: batchLocks.slice(0, 3).map(lock => ({
            address: TokenLockerService.formatAddress(lock.userAddress),
            amount: TokenLockerService.formatVictoryAmount(lock.amount),
            period: TokenLockerService.getLockPeriodDisplayName(lock.lockPeriod),
            isValid: TokenLockerService.validateUserAddress(lock.userAddress).isValid &&
                    TokenLockerService.validateAmount(lock.amount).isValid &&
                    TokenLockerService.validateLockPeriod(lock.lockPeriod).isValid
          })),
          hasMore: batchLocks.length > 3,
          validationErrors: batchValidation.errors
        }

      default:
        return {
          title: 'Confirm Action',
          description: `Execute ${action} operation.`,
          warning: 'This action may have significant effects on the system.',
          buttonText: 'Confirm',
          buttonColor: 'bg-gray-600 hover:bg-gray-700',
          icon: AlertTriangle,
          details: [
            { label: 'Action', value: action },
            { label: 'Status', value: 'Unknown operation' }
          ]
        }
    }
  }

  const details = getActionDetails()
  const Icon = details.icon

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-slate-700/50 rounded-lg p-2">
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{details.title}</h3>
            <p className="text-slate-300 text-sm">{details.description}</p>
          </div>
        </div>

        {/* Special Note */}
        {details.specialNote && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-4">
            <div className="text-blue-400 text-sm font-medium mb-1">Special Notice</div>
            <div className="text-blue-300 text-sm">{details.specialNote}</div>
          </div>
        )}

        {/* Details Section */}
        {details.details && details.details.length > 0 && (
          <div className="bg-slate-700/30 rounded-lg p-4 mb-4">
            <div className="text-slate-300 text-sm font-medium mb-3">Operation Details</div>
            <div className="space-y-2">
              {details.details.map((detail, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">{detail.label}:</span>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-medium ${
                      detail.isValid === false ? 'text-red-400' : 'text-white'
                    }`}>
                      {detail.value}
                    </span>
                    {detail.isValid === false && detail.error && (
                      <span className="text-red-400 text-xs">({detail.error})</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Batch Preview */}
        {details.batchPreview && (
          <div className="bg-slate-700/30 rounded-lg p-4 mb-4">
            <div className="text-slate-300 text-sm font-medium mb-3">Lock Preview</div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {details.batchPreview.map((lock, index) => (
                <div key={index} className={`text-xs p-2 rounded ${
                  lock.isValid ? 'bg-slate-600/30' : 'bg-red-500/10 border border-red-500/20'
                }`}>
                  <div className="flex justify-between">
                    <span className="text-slate-400">{lock.address}</span>
                    <span className="text-white">{lock.amount}</span>
                  </div>
                  <div className="text-slate-500">{lock.period}</div>
                </div>
              ))}
              {details.hasMore && (
                <div className="text-xs text-slate-400 text-center py-1">
                  ... and {batchLocks!.length - 3} more locks
                </div>
              )}
            </div>
          </div>
        )}

        {/* Validation Errors */}
        {details.validationErrors && details.validationErrors.length > 0 && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
            <div className="text-red-400 text-sm font-medium mb-2">Validation Errors</div>
            <div className="space-y-1">
              {details.validationErrors.slice(0, 5).map((error, index) => (
                <div key={index} className="text-red-300 text-xs">• {error}</div>
              ))}
              {details.validationErrors.length > 5 && (
                <div className="text-red-300 text-xs">... and {details.validationErrors.length - 5} more errors</div>
              )}
            </div>
          </div>
        )}

        {/* Warning Section */}
        <div className={`border rounded-lg p-3 mb-4 ${
          details.isValid === false ? 'bg-red-500/10 border-red-500/20' : 'bg-yellow-500/10 border-yellow-500/20'
        }`}>
          <div className="flex items-center space-x-2">
            <AlertTriangle className={`w-4 h-4 ${
              details.isValid === false ? 'text-red-400' : 'text-yellow-400'
            }`} />
            <span className={`text-sm font-medium ${
              details.isValid === false ? 'text-red-400' : 'text-yellow-400'
            }`}>
              {details.isValid === false ? 'Validation Failed' : 'Warning'}
            </span>
          </div>
          <p className={`text-sm mt-1 ${
            details.isValid === false ? 'text-red-300' : 'text-yellow-300'
          }`}>
            {details.warning}
          </p>
        </div>

        {/* Action Buttons */}
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
            disabled={loading || details.isValid === false}
            className={`flex-1 ${details.buttonColor} disabled:opacity-50 disabled:bg-gray-600 text-white font-medium px-4 py-2 rounded-lg transition-colors`}
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

        {/* Additional Info */}
        {(action === 'createBatchLocks' || action === 'addWeeklyRevenue' || action === 'createNextEpoch') && (
          <div className="mt-4 pt-3 border-t border-slate-600/30">
            <p className="text-xs text-slate-400 text-center">
              {action === 'createBatchLocks' && 'This transaction may take longer due to multiple lock creations.'}
              {action === 'addWeeklyRevenue' && 'This will finalize the current epoch and enable user claims.'}
              {action === 'createNextEpoch' && 'This creates the next epoch in the predictable sequence.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}