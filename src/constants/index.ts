export const CONSTANTS = {
    // Main package ID from the deployment
    PACKAGE_ID: "0xc391e4dc080541c2d1a2d9decc787c751bda1c5fc5372a93d69c54f20c5e93f6",
    
    // Core module IDs from the created objects
    ROUTER_ID: "0xfde2330e0ea788870e5db4f103745b3c72e7901cdee4c5ee321cdc70f417d0cc",
    FACTORY_ID: "0x92438465fd12b6d174feaef83820451b0fee7563a2433dd4ca61e0e18be63c97",
    FARM_ID: "0xb941aef775559f045a9dd334a7860cd15b241c4497ab8d6f6891ab05fbbfa20f",
    TOKEN_LOCKER_ID: "0x32d2c7df1515232137062c9ff0d37c7cb5d81097fd8719f4c69c4a54e940c44d",
    GLOBAL_EMISSION_CONTROLLER_ID: "0x175b225b58f8228bb7451f8928d1bb948f6992aea96462aa3c779fc284b8e280",
    
    // Admin capability IDs
    TOKEN_LOCKER_ADMIN_CAP_ID: "0x4edfbe971a3bcf0708c95da0e5a2d3ae8ad9dad8262e181f0e9d4d1f73bd24b8",
    GLOBAL_EMISSION_ADMIN_CAP_ID: "0xb7540b92dca62d3333bdb304050609f3bed825e4dad9e8b740405dffa1979ad7",
    FARM_ADMIN_CAP_ID: "0x7cb6e88d1b7abf4537ce24045bfb0e717400c5526736dc3d4bfa39ad0d7dedcf",
    PAIR_ADMIN_CAP_ID: "0x69aa87c2c6a9751994fb24fb5cf0dd818cbb8fee73068c58cac3249180445194",
    UPGRADE_CAP_ID: "0x4c5e13a48f4a2e3058259bc49eeb534e12c67567ef75026bf533486fb2d65ab7",
    
    VICTORY_TOKEN: {
        TYPE: "0xc391e4dc080541c2d1a2d9decc787c751bda1c5fc5372a93d69c54f20c5e93f6::victory_token::VICTORY_TOKEN",
        TREASURY_CAP_WRAPPER_ID: "0xf8efc5246a6a4ca4842de8e468f8a395bd5c2e8d45e11b95f237cad6d7ec7723",
        MINTER_CAP_ID: "0x7f731491d3417a9b4416de44dfabed00b99cb34497613447d22a926ce74f7ad5",
        METADATA_ID: "0x40c988625c86472af8e07408696194c02552b9a611130eb93b14b872b926f976"
    },
    
    TEST_SUI: {
        TYPE: "0xc391e4dc080541c2d1a2d9decc787c751bda1c5fc5372a93d69c54f20c5e93f6::test_sui::TEST_SUI",
        TREASURY_CAP_WRAPPER_ID: "0x1fc761c37189331a94cc55da93d88665e0d47d2e3f5cd1436ddfd104a4f031db",
        MINTER_CAP_ID: "0x6e04ff8212f12f4feafea987c6b1e4ead7108e1dc65b111aedfa8bf1bb0d020b",
        METADATA_ID: "0xa2e83d747504be582e753b545174b0394adca3cf842c8d2e6684f2b928d61037"
    },
    
    // Note: Vault IDs are not present in this deployment log
    // These would typically be created in separate transactions
    VAULT_IDS: {
        FARM_REWARD_VAULT_ID: "0xdd722c9a390e92d9e0ec2e3daba26312f8b9e8a55ad5103aaa9ec81f26d77996",
        LOCKER_REWARD_VAULT_ID: "0x92f8e9b06d404f6f5260d6f77ee1ba6371c69817d925711c9050b5a8dbf63d3c",
        LOCKER_LOCKED_VAULT_ID: "0x7258fd0c3bc8d17f53738592725f6681d9d1634a2444dd18722f7cd74d54e8f4",
        SUI_REWARD_VAULT_ID: "0x644de5eeaddca1ac79f86f5e21ac9d5235a0bd42a9ee8b2b0744c01d9301ca05"
    },
    
    MODULES: {
        FACTORY: "factory",
        PAIR: "pair",
        ROUTER: "router", 
        LIBRARY: "library",
        FIXED_POINT_MATH: "fixed_point_math",
        FARM: "farm",
        VICTORY_TOKEN: "victory_token",
        TOKEN_LOCKER: "victory_token_locker",
        GLOBAL_EMISSION_CONTROLLER: "global_emission_controller",
        TEST_SUI: "test_sui"
    },
    
    CLOCK_ID: "0x6",
    getPairID: (token0: string, token1: string) => `${token0}_${token1}_pair`,
    
    // Network configuration
    NETWORK: 'testnet' as const,
    RPC_URL: 'https://fullnode.testnet.sui.io:443',
    ADMIN: '0x9b15baa31a2d308bd09f9258f0a9db09da3d4e8e113cf1888efa919d9778fa7c'
}