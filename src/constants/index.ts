export const CONSTANTS = {
    // Main package ID from the deployment
    PACKAGE_ID: "0xd105cdce25525e55c862121b6674daf97c7392a1c4e22b66e76f02c13a0d2939",
    
    // Core module IDs from the created objects
    ROUTER_ID: "0xf06a37fd3f19daf7f6250825c9be29e3a2d56a805e37f01fb13f94b50314c723",
    FACTORY_ID: "0x19859b55670290c55200ab2716b9fada2820243d1f8b0feec66e58adbe253e09",
    FARM_ID: "0x7745043b1d6d119be1944b3522faf80405f7e96185b3ac71c5144922cad8101a",
    TOKEN_LOCKER_ID: "0x011a7415ea70028fa62991babd72f757d75b3c492eefd6e9fce7e519e61803c6",
    GLOBAL_EMISSION_CONTROLLER_ID: "0x8a7fa683bad17fab1f6176f5cf8bb397418377a4ae6ff07ba7aea83e8a49fc77",
    
    // Admin capability IDs
    TOKEN_LOCKER_ADMIN_CAP_ID: "0xedcab4c64ff0e0bdb0e6bb7103c96f5ab6f77275e3b5f4d6d386aa1f4f4c4efa",
    GLOBAL_EMISSION_ADMIN_CAP_ID: "0x2977a92ae5bf8c9fcde68f224b98a67e9633a536bd25ea1e9eb83ccaa3f7a2c7",
    FARM_ADMIN_CAP_ID: "0x4ff47350b54428f5b492b90515fcda2e016d602b4cdb918527f0b62a00f96928",
    PAIR_ADMIN_CAP_ID: "0x038b42d6e73946ce581e68be662aa3b2ced00f2d05cc464f3eb434bbf1046474",
    UPGRADE_CAP_ID: "0x1277cf4aa4d026a890fdd79ac06e35cf6008c929552a883c9f6e89f8f002069d",
    
    VICTORY_TOKEN: {
        TYPE: "0xd105cdce25525e55c862121b6674daf97c7392a1c4e22b66e76f02c13a0d2939::victory_token::VICTORY_TOKEN",
        TREASURY_CAP_WRAPPER_ID: "0xa070bf6d06f09cb59db8811f7e7ea5f971e34ee26c6a5ae503d136cf17c013db",
        MINTER_CAP_ID: "0x0053c3bf0355023c9513ea14ab238093b19b18294ecd407a5ccc107341c9451b",
        METADATA_ID: "0x5c39febaf9f738495b1d9d42beae40d85c891daaed44c1226d66be3961e3cea3"
    },
    
    TEST_SUI: {
        TYPE: "0xd105cdce25525e55c862121b6674daf97c7392a1c4e22b66e76f02c13a0d2939::test_sui::TEST_SUI",
        TREASURY_CAP_WRAPPER_ID: "0x5a40494891076323ff6c5178f6aed1d08fec6e4d4cba6ffe2ac886741c57c6a5",
        MINTER_CAP_ID: "0xd41a258bcaf9a5c7b90397f519c1b74def1a7e71606cb5545e590515221f98b2",
        METADATA_ID: "0x52ec085cc069fa5603c4f7d199788bea2edc408e9b31f077b5f063dae708fa46"
    },
    
    // Note: Vault IDs need to be created in separate transactions
    // These placeholders should be replaced after vault creation
    VAULT_IDS: {
        FARM_REWARD_VAULT_ID: "0x7676b33067c002f740fb01784381fe62750e8a170256b42c0a2fe0cbab2a0f62",
        LOCKER_REWARD_VAULT_ID: "0x7869ac42c81b6a1d2630ead5974fcfb59eed50578cac5f1b516aebe59de99500",
        LOCKER_LOCKED_VAULT_ID: "0x252bdac77e7680722d4294ada8f2b83ec1ba04b66d3a04d855409e94f9157407",
        SUI_REWARD_VAULT_ID: "0x93729bc4d2c4e710cd57727f36d062b16b46975a61dad6e3c08638829c8fa2dd"
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