export const CONSTANTS = {
    // Main package ID from the deployment
    PACKAGE_ID: "0x381ff77a7fc9af27a9ca765bb0fb2a7daa4516621a44182dc01de2eb8a8053c7",
    
    // Core module IDs from the created objects
    ROUTER_ID: "0x0271b251241814376570f8ae6a6d9d13b7f8d56358ed304294ad299f60a74fa6",
    FACTORY_ID: "0x39067ad38b78b170fd71b2007a474910b63a2c56cd444f8d7fb53f2732fdc60c",
    FARM_ID: "0x440b5d207e63371e4925d07441b98c5bcd6e53b5993efff20431287f7f8cd0b4",
    TOKEN_LOCKER_ID: "0x8b4d6227a6b849a793b53619085120aed152d41104a6133b85034fa8ff4c7077",
    GLOBAL_EMISSION_CONTROLLER_ID: "0x500852299efbc3568d4d4f2e90df5c22959d4488dcfe1d2f20ac6388fc1ede1f",
    
    // Admin capability IDs
    TOKEN_LOCKER_ADMIN_CAP_ID: "0x847e8f6a569528ee54b0050a1eefdaaa4edcc1f9462b9431dcae2b9d6fb6439f",
    GLOBAL_EMISSION_ADMIN_CAP_ID: "0x2e0334603423712b2a40e180a9ba08c15d3544da2ad0c86396752dcc1137891f",
    FARM_ADMIN_CAP_ID: "0x6728c639a24cbef7ab379167864ef6c376977171e0535ae9b203e0815fd5de83",
    PAIR_ADMIN_CAP_ID: "0x7be137b334321ffe6bf009e577afb940867546e6a679276b9ef9d76e6af0dc68",
    UPGRADE_CAP_ID: "0x46e1ced1d1a751783f073c0ded5d4943a7db8a7ae0fa3d36392ea1108f5780ef",
    
    VICTORY_TOKEN: {
        TYPE: "0x381ff77a7fc9af27a9ca765bb0fb2a7daa4516621a44182dc01de2eb8a8053c7::victory_token::VICTORY_TOKEN",
        TREASURY_CAP_WRAPPER_ID: "0x60ad3d4e78fce2aa4a04785d1409889b2a0749e3f24c628fc7bb3e860c97d370",
        MINTER_CAP_ID: "0xc6472bdccb7a4557cb8cb2747f31360dcd06f0a7adf6ddee553f246fa200c99e",
        METADATA_ID: "0x1ae9ac768567cfe79b85a8acd680b42c38a972ad8840497dad30373231a0eb66"
    },
    
    TEST_SUI: {
        TYPE: "0x381ff77a7fc9af27a9ca765bb0fb2a7daa4516621a44182dc01de2eb8a8053c7::test_sui::TEST_SUI",
        TREASURY_CAP_WRAPPER_ID: "0x1244b32252d8377c803a4871a1aa6355933cc29d2f65dfd4d822439d30fcd18a",
        MINTER_CAP_ID: "0x4d3415fc9c2a5d3c9d1e927c2a2b2fd5b318e1222c37f47934a594b81a6afda9",
        METADATA_ID: "0x6193acc02e579c3fad6ecd64907131dda7750ba453e5c4da7c94899a2472ccfa"
    },
    
    // Note: Vault IDs need to be created in separate transactions
    // These placeholders should be replaced after vault creation
    VAULT_IDS: {
        FARM_REWARD_VAULT_ID: "0xdcad2a082d32809fe54d3eca5ef1b54d09fa836c883a9bab7f23320b39520cea",
        LOCKER_REWARD_VAULT_ID: "0x5e11d5c2c43289375d0a5a384d03afc5f9bdfff32534c600a268ead8daad6dd8",
        LOCKER_LOCKED_VAULT_ID: "0x5a6022994c6579d30fa97e84cd7677da9c6721492dca3e300b441a71b9bd0f2d",
        SUI_REWARD_VAULT_ID: "0xa40725a00381ca83dc0bbad01523f576853f1e94f018ac6c4107c1d406e1b0d0"
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