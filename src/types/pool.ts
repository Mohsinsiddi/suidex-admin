// types/pool.ts
export interface Pool {
  id: string
  name: string
  type: 'LP' | 'Single'
  typeName: string
  token0?: string
  token1?: string
  singleToken?: string
  totalStaked: string
  allocationPoints: number
  depositFee: number
  withdrawalFee: number
  isActive: boolean
  isNativePair: boolean
  apy: string
  poolAddress?: string
}

export interface CreatePoolForm {
  poolType: 'LP' | 'Single'
  token0: string
  token1: string
  singleToken: string
  allocationPoints: number
  depositFee: number
  withdrawalFee: number
  isNativePair: boolean
}

export interface FarmData {
  admin: string
  burnAddress: string
  devAddress: string
  teamAddress: string
  lockerAddress: string
  paused: boolean
  totalAllocationPoints: string
  totalLpAllocationPoints: string
  totalSingleAllocationPoints: string
  totalVictoryDistributed: string
  poolList: Array<{
    name: string
  }>
  poolsTableId: string
  allowedLpTypesTableId: string
}

export interface StatCardProps {
  title: string
  value: string
  subtitle: string
  icon: React.ReactNode
  color: 'blue' | 'green' | 'purple' | 'yellow'
}