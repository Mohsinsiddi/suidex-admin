export const CONSTANTS = {
    // Main package ID from the deployment
    PACKAGE_ID: "0xfa5c3dd1022b14ab1ac91ad140f5e765ab5b993ef944a9caad33073b6c30df19",
    
    // Core module IDs from the created objects
    ROUTER_ID: "0x04c4640b32e11de3ffd8fd1e2e9389901bced7c8b74bdf0164c3b758afc30c9d",
    FACTORY_ID: "0xc044349b0c118a276e0459427a1b33affe7297d603c1d3c7ff54e05db3172b65",
    FARM_ID: "0x3ade71426f883c1999c59ae1249a841fe69bab426476ba083d07582cdc880024",
    TOKEN_LOCKER_ID: "0x8f063746bce868e8e854c2f438b53d4f7e3c5dc60d66d22a47f99b1995557872",
    GLOBAL_EMISSION_CONTROLLER_ID: "0x2fcf322a2f1bf49c7aa8b0dca0ac742a4adaeea9788c0ed951cbc4acea738c59",
    
    // Admin capability IDs
    TOKEN_LOCKER_ADMIN_CAP_ID: "0xd75afb97924909b1f7caaaba90d93a66dfdde5b6d4c0d10c679c67456bd4e807",
    GLOBAL_EMISSION_ADMIN_CAP_ID: "0xfa7450b78b6291cca1d7f0a6efd7db7205e939ca41c2c44dce11f7ffc1d55f93",
    FARM_ADMIN_CAP_ID: "0x08bb49655a9f46312f46cb2e080d9344616d6438c77412fb337201272347d88d",
    PAIR_ADMIN_CAP_ID: "0xaabfa4fa872b5be29c48193fb7f553da7e8b55ad17897b31110a6cf7829a498b",
    UPGRADE_CAP_ID: "0xa7f5016474b53e0137bd07d14526ccd3dad47f061b81aa4bfc51f3e0ef9951e0",
    
    VICTORY_TOKEN: {
        TYPE: "0xfa5c3dd1022b14ab1ac91ad140f5e765ab5b993ef944a9caad33073b6c30df19::victory_token::VICTORY_TOKEN",
        TREASURY_CAP_WRAPPER_ID: "0xd7659263dff44e998a1f578afd2eeb52bcf42230e319d35f961528325888483f",
        MINTER_CAP_ID: "0xcd4480ab6c2901a7e82a5be4b8876144ab6e865c098eac145d0cc22aa41e6e61",
        METADATA_ID: "0x57788ea99a95f92973acf25c66741b081f24589649669e9a468a06ed2699750a"
    },
    
    TEST_SUI: {
        TYPE: "0xfa5c3dd1022b14ab1ac91ad140f5e765ab5b993ef944a9caad33073b6c30df19::test_sui::TEST_SUI",
        TREASURY_CAP_WRAPPER_ID: "0xd93e8f2deda63e77d877eb179cec83520894ac4e477f7a4e5916603ad3ff5f3f",
        MINTER_CAP_ID: "0x61700a59fb78c1c1a7050f44f8db1d73c08573fa5203b0b2f3f4f7926918b563",
        METADATA_ID: "0xeef6f98968775822b972fc323899c7e9cdce986d4c805a7ce7282550340d7f77"
    },
    
    // Note: Vault IDs need to be created in separate transactions
    // These placeholders should be replaced after vault creation
   VAULT_IDS: {
        FARM_REWARD_VAULT_ID: "0x5ae9889acf66b9a10d859a34e5795ccd6cfa435a450a420080efb747a3cc10ad",
        LOCKER_REWARD_VAULT_ID: "0x73a65d5506e621669e964d52ec79ad847b58d5bd0286cefef719374ab95cc8ae",
        LOCKER_LOCKED_VAULT_ID: "0x2b238c684cbf26d1f50bca9912c44c7ca1e7000e079c636bc91363ca95f85459",
        SUI_REWARD_VAULT_ID: "0xaaa7c5a6ddf020236adf2ff64d6e27a76c19e55cb273721d3b71ad110468f91d"
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