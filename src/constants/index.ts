export const CONSTANTS = {
    PACKAGE_ID: "0xae12b04f2a46546b7f83c412a467a0abb1f6424415c633a63be2e0377122bf98",
    ROUTER_ID: "0xb31a7d412e9d06a7a14eb75cf0f22bccfb33fa2b994daf8fbc0e1bde047aacce",
    FACTORY_ID: "0x84b970570e55c39e57888015ba7dfbbbe0de2a0e511734885b002e9a92e0f2e5",
    FARM_ID: "0x6dc97f5eea9ed415c9d56b6aac7362e22b9723058502333c23bc307dce0258e7",
    FARM_CONFIG_ID: "0x6dc97f5eea9ed415c9d56b6aac7362e22b9723058502333c23bc307dce0258e7",
    ADMIN_CAP_ID: "0xefd7be9e8cb1ca564ee1a4a39dadb62f79e9cf1587e10403c143c53871e25efe",
    PAIR_ADMIN_CAP_ID: "0x96dc9badddce6199853d7b4a50b40e53b20e4e17c5d6218d402088f2851646eb",
    UPGRADE_CAP_ID: "0x59e8971b7b31602ca7a16003b4ebbb850b7f2608f1ea5b703b01ff1b222c1aea",
    TOKEN_LOCKER_ID: "0x5def81b2fa87fa360ab75fcb73b4f0ee251982c3fe06c8eeabdc3b0374ceb343",
    TOKEN_LOCKER_ADMIN_CAP_ID: "0xf6c7cf72627adf63513401c9f3716e1d5471c1c050e1597f0152b72b8fe43a03",
    GLOBAL_EMISSION_CONTROLLER_ID: "0x828608c63d6057c1c7e7c9eb1f5be74364a47d2a2f1833709f35fcd82897c3da",
    GLOBAL_EMISSION_ADMIN_CAP_ID: "0x9c099d6817f238627051aeb135161d7d45c3042dbd09a481f749c20afaaa98d4",
    VICTORY_TOKEN: {
        TYPE: "0xae12b04f2a46546b7f83c412a467a0abb1f6424415c633a63be2e0377122bf98::victory_token::VICTORY_TOKEN",
        TREASURY_CAP_WRAPPER_ID: "0x6ad26800a80ed5fdc25870792fb6ef28a3aba6e4f84b90f13128799455e94a86",
        MINTER_CAP_ID: "0x308803405de679543c83fa0f6020b0912e11e469e742b8783eada7effe270c1b",
        METADATA_ID: "0xe190758eb52dc4064b98ce9edac03f8b37c951a1f517a0bf3bf345e90ddd995c"
    },
    VAULT_IDS: {
        FARM_REWARD_VAULT_ID: "0x829e6d462e6c9936e173f8c4f76163292bba6c1149316cc083f6fdc365cfbad0",
        LOCKER_REWARD_VAULT_ID: "0x747ed740e225a3df544d26992dc0ed007acec675b2def8e9bfb3efc10a192092", 
        LOCKER_LOCKED_VAULT_ID: "0xa58299cecfe2b9ae9442f02a79e39cf3a26fb8aa78fea2386aee68123838564c",
        SUI_REWARD_VAULT_ID: "0x15b4a95ba91b54eb9a7b8ba2c6d19579382f9cf19a7b6ab76d91ba2cf3fd4c68"
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