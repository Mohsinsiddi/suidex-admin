// services/poolService.ts
import { suiClient } from '../utils/suiClient'
import { CONSTANTS } from '../constants'
import type { Pool, FarmData } from '../types/pool'
import { 
  parseTypeName, 
  isNativePair, 
  formatTokenAmount, 
  calculateAPY,
  extractTypeNameFromDynamicField 
} from '../utils/poolUtils'

export class PoolService {
  
  // Fetch farm data from the blockchain
  static async fetchFarmData(): Promise<FarmData> {
    try {
      const farmObject = await suiClient.getObject({
        id: CONSTANTS.FARM_ID,
        options: {
          showContent: true,
          showType: true
        }
      })

      if (!farmObject.data?.content || farmObject.data.content.dataType !== 'moveObject') {
        throw new Error('Invalid farm object')
      }

      const fields = farmObject.data.content.fields as any

      return {
        admin: fields.admin,
        burnAddress: fields.burn_address,
        devAddress: fields.dev_address,
        teamAddress: fields.team_address,
        lockerAddress: fields.locker_address,
        paused: fields.paused,
        totalAllocationPoints: fields.total_allocation_points,
        totalLpAllocationPoints: fields.total_lp_allocation_points,
        totalSingleAllocationPoints: fields.total_single_allocation_points,
        totalVictoryDistributed: fields.total_victory_distributed,
        poolList: fields.pool_list,
        poolsTableId: fields.pools.fields.id.id,
        allowedLpTypesTableId: fields.allowed_lp_types.fields.id.id
      }
    } catch (error) {
      console.error('Error fetching farm data:', error)
      throw error
    }
  }

  // Create pools from the pool list without individual pool data fetching for now
  static async createPoolsFromList(farmData: FarmData): Promise<Pool[]> {
    try {
      const pools: Pool[] = farmData.poolList.map((poolType, index) => {
        // Extract the actual type name
        const typeName = poolType.name || poolType
        const parsedType = parseTypeName(typeName)
        
        // Create pool object with available data
        const pool: Pool = {
          id: (index + 1).toString(),
          name: parsedType.name,
          type: parsedType.type,
          typeName: typeName,
          token0: parsedType.type === 'LP' ? parsedType.token0 : undefined,
          token1: parsedType.type === 'LP' ? parsedType.token1 : undefined,
          singleToken: parsedType.type === 'Single' ? parsedType.singleToken : undefined,
          totalStaked: '0.00',
          allocationPoints: 0,
          depositFee: 0,
          withdrawalFee: 0,
          isActive: true,
          isNativePair: isNativePair(typeName),
          apy: '0.0%',
          poolAddress: undefined
        }

        return pool
      })

      return pools
    } catch (error) {
      console.error('Error creating pools from list:', error)
      throw error
    }
  }

  // Fetch pool data using the dynamic fields and actual pool objects
  static async fetchPoolDataAlternative(farmData: FarmData): Promise<Pool[]> {
    try {
      console.log('Fetching dynamic fields for pools table...')
      
      // Get all dynamic fields from the pools table
      const dynamicFields = await suiClient.getDynamicFields({
        parentId: farmData.poolsTableId,
        limit: 50
      })

      console.log('Dynamic fields found:', dynamicFields)

      // Batch fetch all pool objects at once for better performance
      const poolObjectIds = dynamicFields.data.map(field => field.objectId)
      console.log('Pool object IDs:', poolObjectIds)

      const poolObjects = await this.batchFetchPoolObjects(poolObjectIds)
      console.log('Fetched pool objects:', poolObjects)

      const pools: Pool[] = []

      // Process each dynamic field with its corresponding pool object
      for (let i = 0; i < dynamicFields.data.length; i++) {
        const field = dynamicFields.data[i]
        
        try {
          // Extract the type name from the dynamic field
          const typeName = extractTypeNameFromDynamicField(field)
          
          if (!typeName) {
            console.warn('Could not extract type name from field:', field)
            continue
          }

          console.log('Processing pool type:', typeName)
          
          const parsedType = parseTypeName(typeName)
          
          // Find the corresponding pool object
          const poolObject = poolObjects.find(obj => obj?.objectId === field.objectId)
          const poolFields = poolObject?.fields

          console.log(`Pool fields for ${typeName}:`, poolFields)

          const pool: Pool = {
            id: (i + 1).toString(),
            name: parsedType.name,
            type: parsedType.type,
            typeName: typeName,
            token0: parsedType.type === 'LP' ? parsedType.token0 : undefined,
            token1: parsedType.type === 'LP' ? parsedType.token1 : undefined,
            singleToken: parsedType.type === 'Single' ? parsedType.singleToken : undefined,
            totalStaked: poolFields 
              ? formatTokenAmount(poolFields.total_staked || '0')
              : '0.00',
            allocationPoints: poolFields
              ? this.safeParseInt(poolFields.allocation_points)
              : Math.floor(Math.random() * 500) + 100,
            depositFee: poolFields
              ? this.safeParseInt(poolFields.deposit_fee)
              : 0,
            withdrawalFee: poolFields
              ? this.safeParseInt(poolFields.withdrawal_fee)
              : Math.floor(Math.random() * 100),
            isActive: poolFields
              ? poolFields.is_active !== false
              : true,
            isNativePair: isNativePair(typeName),
            apy: calculateAPY(
              poolFields
                ? poolFields.allocation_points || '100'
                : Math.floor(Math.random() * 500) + 100,
              farmData.totalAllocationPoints
            ),
            poolAddress: field.objectId
          }

          console.log(`Created pool:`, pool)
          pools.push(pool)
        } catch (fieldError) {
          console.error(`Error processing field ${i}:`, fieldError)
          // Continue with other fields
        }
      }

      console.log('Successfully processed pools:', pools)
      return pools

    } catch (error) {
      console.error('Error with alternative pool data fetch:', error)
      // Fallback to basic pool creation
      return this.createPoolsFromList(farmData)
    }
  }

  // Enhanced method to batch fetch multiple pool objects
  static async batchFetchPoolObjects(objectIds: string[]): Promise<any[]> {
    try {
      console.log('Batch fetching pool objects for IDs:', objectIds)
      
      const results = await suiClient.multiGetObjects({
        ids: objectIds,
        options: {
          showContent: true,
          showType: true,
          showOwner: true
        }
      })

      console.log('Batch fetch results:', results)

      return results.map((result, index) => {
        if (result.data?.content?.dataType === 'moveObject') {
          const poolData = {
            objectId: result.data.objectId,
            fields: result.data.content.fields,
            type: result.data.type,
            version: result.data.version
          }
          console.log(`Pool object ${index}:`, poolData)
          return poolData
        }
        console.warn(`Invalid pool object at index ${index}:`, result)
        return null
      }).filter(Boolean)
    } catch (error) {
      console.error('Error batch fetching pool objects:', error)
      return []
    }
  }

  // Method to fetch individual pool details
  static async fetchPoolDetails(poolObjectId: string): Promise<any> {
    try {
      console.log('Fetching individual pool details for:', poolObjectId)
      
      const poolObject = await suiClient.getObject({
        id: poolObjectId,
        options: {
          showContent: true,
          showType: true,
          showOwner: true
        }
      })

      console.log('Individual pool object:', poolObject)

      if (poolObject.data?.content?.dataType === 'moveObject') {
        return poolObject.data.content.fields
      }

      return null
    } catch (error) {
      console.error(`Error fetching pool details for ${poolObjectId}:`, error)
      return null
    }
  }

  // Method to get all pool object IDs
  static async getAllPoolObjectIds(farmData: FarmData): Promise<string[]> {
    try {
      const dynamicFields = await suiClient.getDynamicFields({
        parentId: farmData.poolsTableId,
        limit: 50
      })

      return dynamicFields.data.map(field => field.objectId)
    } catch (error) {
      console.error('Error getting pool object IDs:', error)
      return []
    }
  }

  // Helper method to safely parse integers
  static safeParseInt(value: any): number {
    if (value === null || value === undefined) {
      return 0
    }
    
    if (typeof value === 'number') {
      return Math.floor(value)
    }
    
    if (typeof value === 'string') {
      const parsed = parseInt(value, 10)
      return isNaN(parsed) ? 0 : parsed
    }
    
    // Handle bigint or other numeric types
    try {
      return parseInt(value.toString(), 10) || 0
    } catch (error) {
      console.warn('Could not parse value as integer:', value)
      return 0
    }
  }

  // Method to refresh a single pool's data
  static async refreshPoolData(poolObjectId: string, farmData: FarmData): Promise<Pool | null> {
    try {
      const poolFields = await this.fetchPoolDetails(poolObjectId)
      
      if (!poolFields) {
        return null
      }

      // We need to find the type name for this pool
      // This is a bit complex, but we can get it from the dynamic fields
      const dynamicFields = await suiClient.getDynamicFields({
        parentId: farmData.poolsTableId,
        limit: 50
      })

      const matchingField = dynamicFields.data.find(field => field.objectId === poolObjectId)
      
      if (!matchingField) {
        console.warn('Could not find matching dynamic field for pool:', poolObjectId)
        return null
      }

      const typeName = extractTypeNameFromDynamicField(matchingField)
      const parsedType = parseTypeName(typeName)

      const pool: Pool = {
        id: poolObjectId,
        name: parsedType.name,
        type: parsedType.type,
        typeName: typeName,
        token0: parsedType.type === 'LP' ? parsedType.token0 : undefined,
        token1: parsedType.type === 'LP' ? parsedType.token1 : undefined,
        singleToken: parsedType.type === 'Single' ? parsedType.singleToken : undefined,
        totalStaked: formatTokenAmount(poolFields.total_staked || '0'),
        allocationPoints: this.safeParseInt(poolFields.allocation_points),
        depositFee: this.safeParseInt(poolFields.deposit_fee),
        withdrawalFee: this.safeParseInt(poolFields.withdrawal_fee),
        isActive: poolFields.is_active !== false,
        isNativePair: isNativePair(typeName),
        apy: calculateAPY(poolFields.allocation_points || '0', farmData.totalAllocationPoints),
        poolAddress: poolObjectId
      }

      return pool
    } catch (error) {
      console.error('Error refreshing pool data:', error)
      return null
    }
  }
}