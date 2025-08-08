import { SuiClient, getFullnodeUrl } from '@mysten/sui/client'
import { CONSTANTS } from '../constants'

export const suiClient = new SuiClient({
  url: getFullnodeUrl(CONSTANTS.NETWORK)
})

// Transaction block helpers
export const createTxBlock = () => {
  // This will be imported from @mysten/sui/transactions
  // For now, we'll create a placeholder
  return {
    moveCall: (params: any) => console.log('Move call:', params),
    transferObjects: (objects: any[], recipient: string) => console.log('Transfer objects:', objects, recipient),
    publish: (modules: any) => console.log('Publish:', modules)
  }
}