export const CONSTANTS = {
    // Main package ID from the deployment
    PACKAGE_ID: "0xefc1dc4d0c85becd7c4a255c00bd2caa478163aa69c16570df62e58edc51d8f4",
    
    // Core module IDs from the created objects
    ROUTER_ID: "0x2628d18eb6a871e77f8071520e19d0f7a1dd133faa263b4a63ffd21cf1f9579b",
    FACTORY_ID: "0xdab6c52873485e4fc5210bf9a6736e00bec80a0def5adb6480eb7693237a4a40",
    FARM_ID: "0xf72bf1c6c1684294c5a86a817266a116485a681ccd1e98b6ab9f2e7a9dced194",
    TOKEN_LOCKER_ID: "0xf260053b8226345008ef356b2fd357b73c161e1dce086e53f8669bdb970eb9fe",
    GLOBAL_EMISSION_CONTROLLER_ID: "0x3f609548d22d1ef011a1a6ef37d9dda0ac6b7cf0973703c26d6717c60f5f90f3",
    
    // Admin capability IDs
    TOKEN_LOCKER_ADMIN_CAP_ID: "0x21cd31e542fb35ac07fe3e9d0500cf9cc0a4a604d33e8362bd8e1da9a7997320",
    GLOBAL_EMISSION_ADMIN_CAP_ID: "0x6be95f838051fca06030fa4dfdcd75301da4bfeee7e9297e659cbae0299a1a77",
    FARM_ADMIN_CAP_ID: "0xe25e7ccba9bb007c64b236766b2c9aa58f767ad6dcc6a6e659b64895f225bea3",
    PAIR_ADMIN_CAP_ID: "0x0aa6516db0bf302645d334377cbf569d2568ff14b1944a911d9850c82c1074ff",
    UPGRADE_CAP_ID: "0x13727c84d1d2d3e1e44bce2ec5fdd76ab956ebff66c78c90f76a320c81757482",
    
    VICTORY_TOKEN: {
        TYPE: "0xefc1dc4d0c85becd7c4a255c00bd2caa478163aa69c16570df62e58edc51d8f4::victory_token::VICTORY_TOKEN",
        TREASURY_CAP_WRAPPER_ID: "0x667d9edb7c30525ed155b187232ed32d1071fcca6cf76e5f3659b93b42047c2a",
        MINTER_CAP_ID: "0xd24c8c8b4892da3495d679e8e38698a09d09d699ce90afeb73494a3f40d2a34b",
        METADATA_ID: "0x2f69d1aa280f95ad1ee8e2c2a6a4f4522985ce61019296661734e02344f2784b"
    },
    
    // Native SUI configuration for mainnet
    SUI: {
        TYPE: "0x2::sui::SUI", // Native SUI type
        DECIMALS: 9
    },
    
    VAULT_IDS: {
        FARM_REWARD_VAULT_ID: "0x55810cb8e142ea85ad6c412c03ecf50434d41b14e9d646d058896271730ebe37",
        LOCKER_REWARD_VAULT_ID: "0x15138b08d446fded59f83b98cf51c62995ceb9cd2314796dbbfcd34c1bb2dbc7",
        LOCKER_LOCKED_VAULT_ID: "0xed27a3b552eb8aebc0a5ba66e8eb2c0e643ffb93640c973a6f4475f7a91cbefc",
        SUI_REWARD_VAULT_ID: "0x290e1c677fa541b9adb6ab4395531dbbbd02f6ff0a89ab460bc208fd689e11b6"
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