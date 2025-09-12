export const CONSTANTS = {
    PACKAGE_ID: "0x9abcbf28330273c488f7c53c1be4edacabf80bab7166877f85d8c225ec995b82",
    ROUTER_ID: "0xb20902322f41b9f1f6bda9b6bfd62780617396d6c0cf8634eba747c1a0d1cf0c",
    FACTORY_ID: "0x87b2c81fab6e7ffb0178ca0c9dc965766f6ef62f3ae1eee236b7171aeb74539d",
    FARM_ID: "0x2bcc0d3b4501b556e549c1afde19819fa068642a1912e16a9acc7bdd024d34d2",
    FARM_CONFIG_ID: "0x3ab65d3dde3cbcb16a83e648b3c7071580d2fa437d6c0aa5e977dd8b2fed44be",
    ADMIN_CAP_ID: "0xfb694c4e0d8ec4c5e44fff12e557d944b424699f11a9b9df66d5d2d0d6cc5bc2",
    PAIR_ADMIN_CAP_ID: "0x0dfbd6bd3246ceaa3179e4c8b5e05c29d5eeed0f31b30ebf4efd63364847a643",
    UPGRADE_CAP_ID: "0x8a93da9b327cbe5ba610fe2fc72320031078b2785b8d2b80ec00bfd427e7342d",
    TOKEN_LOCKER_ID: "0x95fecce535309f13932b34f2d7ee59083289b72b1ef997cc50aaa837e56e2090",
    TOKEN_LOCKER_ADMIN_CAP_ID: "0x899cf2ceb23101d32052ba268e389eff610b36ede23ae2691fffac6d26064e6b",
    GLOBAL_EMISSION_CONTROLLER_ID: "0x3ab65d3dde3cbcb16a83e648b3c7071580d2fa437d6c0aa5e977dd8b2fed44be",
    GLOBAL_EMISSION_ADMIN_CAP_ID: "0xfe0f9b0057ea50645b8cf26afa28e7a6d85d1be3d0e7e6237c2384c462c9d175",
    VICTORY_TOKEN: {
        TYPE: "0x9abcbf28330273c488f7c53c1be4edacabf80bab7166877f85d8c225ec995b82::victory_token::VICTORY_TOKEN",
        TREASURY_CAP_WRAPPER_ID: "0x576970e11e0d22fee752070bed9a57d72ff624209c98e88db86d1d9306263610",
        MINTER_CAP_ID: "0x33bf0a0e7e1570dc1f0383fc145c5e78c459487363df8dbb0354f53e5621de60",
        METADATA_ID: "0xb7c8ede0061352958efc3fbe022934b72dd24f3a6f0f171973a18385513917b4"
    },
    VAULT_IDS: {
        FARM_REWARD_VAULT_ID: "0x8737bfece70dec1b78f2b78ac004290e6313650f82084bd6c40b9f9e37603dff",
        LOCKER_REWARD_VAULT_ID: "0x6d0cc688b4750308615cf950f80549c353baf6b5055254af304c14c0b83f6ebe", 
        LOCKER_LOCKED_VAULT_ID: "0x0226f38f5cfec8a32386068e3b34b08f7b0f72d13440d21dbaa307b469dcd564",
        SUI_REWARD_VAULT_ID: "0xcf916351d7185b1f4ee3f733d3035b2177782673139aa7b9f83f38ce5a4c8b38"
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
        GLOBAL_EMISSION_CONTROLLER: "global_emission_controller"
    },
    CLOCK_ID: "0x6",
    getPairID: (token0: string, token1: string) => `${token0}_${token1}_pair`,
    
    // Network configuration
    NETWORK: 'testnet' as const,
    RPC_URL: 'https://fullnode.testnet.sui.io:443',
    ADMIN: '0x9b15baa31a2d308bd09f9258f0a9db09da3d4e8e113cf1888efa919d9778fa7c'
}