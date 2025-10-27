export const CONSTANTS = {
    // Main package ID from the deployment
    PACKAGE_ID: "0xf31ab44b3e301d1f874c23194a43337813c03c3d44ea33f77a20d7947911be23",
    
    // Core module IDs from the created objects
    ROUTER_ID: "0x37085bf55dcdba66a0bb11537754bdf50f11d1b8e6047bd3114da6e21563ee6f",
    FACTORY_ID: "0xe152b115685cfebe14e42b7afb1125fa418cacc9a95b2999cca3fceb981129f0",
    FARM_ID: "0x8f8bcc61642777b6cfedc30a2422f252fbbf1284c6c2097d0580d43aa8ccc179",
    TOKEN_LOCKER_ID: "0x4c7cba9c8755d01244ee9d98ec50fdbef3b4f1bd44e4e18243296b06e8b64be2",
    GLOBAL_EMISSION_CONTROLLER_ID: "0x7849ba6b55357f9bac4fbf66239927405833d96ce15fdc44047202b56a600330",
    
    // Admin capability IDs
    TOKEN_LOCKER_ADMIN_CAP_ID: "0x7abea3d4c25062c388b9439650c7dfa515c4814ee94f1db623f5a4833d253771",
    GLOBAL_EMISSION_ADMIN_CAP_ID: "0x3b359a97320447cb166ff8c70ed1ea0587358a0c32502596ed73faeee4c34333",
    FARM_ADMIN_CAP_ID: "0xe5b2a19dc39f704aa305ea67c924e65f6b2912905bb0969345847f6b560c19e4",
    PAIR_ADMIN_CAP_ID: "0xf919250de03a8320459c38ab4fa8805677acc660c6c31aef4e4ca3c7a99c087b",
    UPGRADE_CAP_ID: "0x76a9fe9183d1abe30fb55d5da552956e29b51337dbce94dd385b05c5e3632d3d",
    
    VICTORY_TOKEN: {
        TYPE: "0xf31ab44b3e301d1f874c23194a43337813c03c3d44ea33f77a20d7947911be23::victory_token::VICTORY_TOKEN",
        TREASURY_CAP_WRAPPER_ID: "0x0f57dd80f248e0d5232fa51df0eb81ca84781ef4c0360798c1c583ab4733832b",
        MINTER_CAP_ID: "0x8aaa96b42731cedbccb0b438868682d7770fb0fa0b91aa710b181a9d3d44c8df",
        METADATA_ID: "0x51f5a4d9046c78cba83841f69e38073d6c85c0252b5264bb359f85ea6f51769c"
    },
    
    // Native SUI configuration for mainnet
    SUI: {
        TYPE: "0x2::sui::SUI", // Native SUI type
        DECIMALS: 9
    },
    
    VAULT_IDS: {
        FARM_REWARD_VAULT_ID: "0x7a41c4a8b438949e2b1a0a36f57dcf27c68bc8a19f75bd7a6738acc43a84a4d8",
        LOCKER_REWARD_VAULT_ID: "0x8c767328fc210fd9353018b6b72670abd9093fc642a56506044966dd5c9a459f",
        LOCKER_LOCKED_VAULT_ID: "0xb1577c4737793cfb0a2060a1cbbaa004350eabddfdb612438c056ab71aec0071",
        SUI_REWARD_VAULT_ID: "0xf6f59bd2e51e2e4379f0c732ec90207f3800c466e201660eee4dcae5f7aa72cf"
    },
    
    MODULES: {
        FACTORY: "factory",
        PAIR: "pair",
        ROUTER: "router", 
        LIBRARY: "library",
        MATH_UTILS: "math_utils",
        FARM: "farm",
        VICTORY_TOKEN: "victory_token",
        TOKEN_LOCKER: "victory_token_locker",
        GLOBAL_EMISSION_CONTROLLER: "global_emission_controller"
    },
    
    CLOCK_ID: "0x6",
    getPairID: (token0: string, token1: string) => `${token0}_${token1}_pair`,
    
    // Network configuration
    NETWORK: 'mainnet' as const,
    RPC_URL: 'https://fullnode.mainnet.sui.io:443',
    ADMIN: '0x980a970a8bb90b5a9c63e550c4ef06161b0376c297fb3e35a9b710004cc1aac9'
}