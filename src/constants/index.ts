export const CONSTANTS = {
    PACKAGE_ID: "0x115a00aeeb5206ad23c67a4302c810eb3aa7bd0853bbe044fe7d6de5eaeb5472",
    ROUTER_ID: "0x6146a440bc802b34e0148004fc3d218fab826761217774fd784baa43be7cd40a",
    FACTORY_ID: "0x7705977f48e14a0e3d50f7fd0c6bab17cc7f0a815b2344383971f23a4df8fd09",
    FARM_ID: "0x1d9b67c39e1a79268359427eedfd76bcb7a80938e4d4cca48d9457967b980e0b",
    FARM_CONFIG_ID: "0x6b3c4e3f03717a9f42400f0489ab41731059213aba8816afc5e51c63bad03303", // Using GlobalEmissionConfig
    ADMIN_CAP_ID: "0x03cf7a783bd90c5e2fac005f4ac557c491ff24ab0d28ab93f7381a4b11d40ae4", // Farm AdminCap
    PAIR_ADMIN_CAP_ID: "0x06f06e49400d804f1c8b77d60c091636cef4a3cfb18b9e698bd89096c34d78df",
    UPGRADE_CAP_ID: "0xb360e3c8571abd06dc7c14051fab1ccc75cab4b9351d4f8da0b5750bfa68f1ad",
    TOKEN_LOCKER_ID: "0x9260455a723b4c60e1bd69ff4e9ee15dff5c393b2d310d7ff64e500449094b35",
    TOKEN_LOCKER_ADMIN_CAP_ID: "0xc10ce2ef84b6e69c1b68a731a81cd2da53307fa23ceca56c3c20dbc066be8eee",
    GLOBAL_EMISSION_CONTROLLER_ID: "0x6b3c4e3f03717a9f42400f0489ab41731059213aba8816afc5e51c63bad03303",
    GLOBAL_EMISSION_ADMIN_CAP_ID: "0x363466ef132683974a453b34754578d455d355eaf3d0eba03d0c90108dab0fc5",
    
    VICTORY_TOKEN: {
        TYPE: "0x115a00aeeb5206ad23c67a4302c810eb3aa7bd0853bbe044fe7d6de5eaeb5472::victory_token::VICTORY_TOKEN",
        TREASURY_CAP_WRAPPER_ID: "0xf19724391c99ade94f2d7aeef46094748a68d1fdf2206816335824a49d40199b",
        MINTER_CAP_ID: "0x8cc09c5e5fab659f8d960d7ab9b3c4495507666ee69f509edf77620f88eebc19",
        METADATA_ID: "0x0156c2c4e00aec4e33f889cc16dfb79284750097e39b348d5a008d35c957bffc"
    },
    
    TEST_SUI: {
        TYPE: "0x115a00aeeb5206ad23c67a4302c810eb3aa7bd0853bbe044fe7d6de5eaeb5472::test_sui::TEST_SUI",
        TREASURY_CAP_WRAPPER_ID: "0x75810f4e894f90a62e3bc72a9a1b716d16de9b7a30c0bd45fda4593f582f6ccd",
        MINTER_CAP_ID: "0x0da659f00cd2b518ce6ca8870a693246b5d406ed8490c8978e0b5ea4c1f9124e",
        METADATA_ID: "0xa182450dc517b742f74205615324f603441d493f78f9a36d53066d20aa58a4df"
    },
    
    VAULT_IDS: {
        FARM_REWARD_VAULT_ID: "0x9784a706a2397f0689acae82047197b43387844d2d9827e0beff72098abff778",
        LOCKER_REWARD_VAULT_ID: "0x9e7d8e8416acbf7ace9359d9db8a499d1b77a4a3c8906986299d00fb9ef7d881",
        LOCKER_LOCKED_VAULT_ID: "0x43bebdb9df5619a9826b5c68ed622b69177517f18f470e7830479bb0ccb02582",
        SUI_REWARD_VAULT_ID: "0x3d78721fbc3f2811cf302180f1d80e7eab44e501a81e569247a491e4fd04c41c"
    },
    
    MODULES: {
        FACTORY: "factory",
        PAIR: "pair",
        ROUTER: "router", 
        LIBRARY: "library",
        FIXED_POINT_MATH: "fixed_point_math",
        FARM: "farm",
        FARM_CONFIG: "farm",
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