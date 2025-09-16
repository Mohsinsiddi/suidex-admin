export const CONSTANTS = {
    // Main package ID from the deployment
    PACKAGE_ID: "0xc63789b2d084efc93098baeb67fadfeb22d050d474f7c1a3fa25489400300d87",
    
    // Core module IDs from the created objects
    ROUTER_ID: "0xd61c716286bd13fafc4d3c62feaaf75a2417f9b8e6e616dd7a81ba683e7ada41",
    FACTORY_ID: "0x2bd78a399b24fa67310898287af5bd28e58a44693daa7a9e7c2de9fcb83ad446",
    FARM_ID: "0x218c97c91b6db6555bd52627e335124bf5bcec64f2d4dcb2d74b78cad03da121",
    TOKEN_LOCKER_ID: "0x69175b8a4a1383277ddc61af39b85b026605116312c412d2029d0a2ec7505d09",
    GLOBAL_EMISSION_CONTROLLER_ID: "0xb475bf1724e7fe2520d0f2031c816eb54250d172dda3e0e22756bcc563afe332",
    
    // Admin capability IDs
    TOKEN_LOCKER_ADMIN_CAP_ID: "0x958081504314a471133f0a5b49b78e9dd7c88c7f22d1e06e2d46ed0309fb3557",
    GLOBAL_EMISSION_ADMIN_CAP_ID: "0x866673c562eab06fdba6d9dea2c9cf710119f76a746091591c3b1b1f9f60a4b0",
    FARM_ADMIN_CAP_ID: "0x4a63ada046dceb70d2e8b6b1133b4b219226179d1feb28dc3f3b057c30b2cf38",
    PAIR_ADMIN_CAP_ID: "0xc5f8df2eccc4d18e9c3ad99b4fe542412618acdc66072382c009111c534686b0",
    UPGRADE_CAP_ID: "0xa4f28c7f489cca1591644fcf6f445a70e88101f26a6c483136e8796bce380af5",
    
    VICTORY_TOKEN: {
        TYPE: "0xc63789b2d084efc93098baeb67fadfeb22d050d474f7c1a3fa25489400300d87::victory_token::VICTORY_TOKEN",
        TREASURY_CAP_WRAPPER_ID: "0x7b50f5eb1eb41b9470118db740ecded8a8c9900be7c8f9cbda038370f47fcd36",
        MINTER_CAP_ID: "0xc8c41179758a7df8afedecaec09c1d2ffe583c84cacb943e555b20f445066091",
        METADATA_ID: "0x6b0a57d7f24a9c43a5ba98e21f6d60c8b3cd01fecee88616797da4d5db99406c"
    },
    
    TEST_SUI: {
        TYPE: "0xc63789b2d084efc93098baeb67fadfeb22d050d474f7c1a3fa25489400300d87::test_sui::TEST_SUI",
        TREASURY_CAP_WRAPPER_ID: "0x446610c128bccc20a9b8c84eccba7a993214e1214355d7913f1180961ff7c936",
        MINTER_CAP_ID: "0x685634c25ea83bf2377f427c3ef8087c4b333c6ac12d7927417cfe2bc26afbb2",
        METADATA_ID: "0xe739a6134d2165033718976c195c5e0c9d76a39d82b850cd04a7c6679d3d6901"
    },
    
    // Note: Vault IDs are not present in this deployment log
    // These would typically be created in separate transactions
    VAULT_IDS: {
        FARM_REWARD_VAULT_ID: "0xbe1a46829711d743c969119c6aad03a7adde756341868d9656d12650bec9a909",
        LOCKER_REWARD_VAULT_ID: "0x3aeec18a316b25dc68b16ad6a70e24c2d2275c7166fb39642e505682ecd4d8fa",
        LOCKER_LOCKED_VAULT_ID: "0x5feabb2ff9cd69943d19fce81704ba95cc838717529711975bf69d9db33552bd",
        SUI_REWARD_VAULT_ID: "0x6b892d9d195224106dec6c9341333006d00ae4ce3d6846166430390cba6e265c"
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