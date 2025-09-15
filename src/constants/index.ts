export const CONSTANTS = {
    PACKAGE_ID: "0x71ce082be6fc3456cf4076c89f09e3dd8c3bbf8dc5ca0aab7b40545720518a5b",
    ROUTER_ID: "0x87f3477b3e7c5ac7c61399398b80eeeeec12076d2f6fe3c7aad9bb99ee138b2f",
    FACTORY_ID: "0x49e8887252485b14663d4fa11018ca4808ead49c2a027b5cf33286a2c80d1bf9",
    FARM_ID: "0x695884bcb1df016b51e82592f6cb0059761fc65b45333445798bf28d0148ea2f",
    TOKEN_LOCKER_ID: "0x5a47806c6abadff51f9b4cba9d1c0779c458c8a37d3a155f81a48934490291e7",
    TOKEN_LOCKER_ADMIN_CAP_ID: "0xd5ff5e0499a63eec1f42124aec35e0819dd9f667fd9308509844cbe46af49a5d",
    GLOBAL_EMISSION_CONTROLLER_ID: "0x7f40ff29e44c87f7784387df15bad7f19c7174340754676db81bf1698bb4c96a",
    GLOBAL_EMISSION_ADMIN_CAP_ID: "0x8efd7cabdd6faa7c02cb7f87840c556df2c5c681152f4dea1dfeaf2e79b5170d",
    FARM_ADMIN_CAP_ID: "0x93a5a54df0e2f5a95bcb34456f26802ae447200926224dc884b41f5887a3be2b",
    PAIR_ADMIN_CAP_ID: "0x373d5647edd00c1bafafba20899a556f5d78a7e81db434e1f04ca325a6eca6b1",
    UPGRADE_CAP_ID: "0x83feb4fbae87f40984a4e233c7558cbdd23bc57601f85eef01c94408111aba61",
    
    VICTORY_TOKEN: {
        TYPE: "0x71ce082be6fc3456cf4076c89f09e3dd8c3bbf8dc5ca0aab7b40545720518a5b::victory_token::VICTORY_TOKEN",
        TREASURY_CAP_WRAPPER_ID: "0x32b90f86ba745d4c485371b6274c4f86fe4857b0ebd1752550bbdc0a59d3ae1a",
        MINTER_CAP_ID: "0x6a2268c26fd42fb87aa2ea47184a039f671aa8572fbd3c41822b5336c718d808",
        METADATA_ID: "0x2076849fd3a85719df636d11225416ebc9a4ae159838042c1624966031f52826"
    },
    
    TEST_SUI: {
        TYPE: "0x71ce082be6fc3456cf4076c89f09e3dd8c3bbf8dc5ca0aab7b40545720518a5b::test_sui::TEST_SUI",
        TREASURY_CAP_WRAPPER_ID: "0xf2018c073cd9a5fcfd1b5b51dc1b2c0d57fbecabb058de9dbda46b20e76c5a88",
        MINTER_CAP_ID: "0xab7db767bad2871fa1c480662403e51c55eecaad61643ac5e304867f96161b15",
        METADATA_ID: "0x6f223ca4faa26084379cd8eb8ccd2e01f78d72b341a473cf43250ba4e9b13598"
    },
    
    VAULT_IDS: {
        FARM_REWARD_VAULT_ID: "0x7f872f41f5df79fdaf01ee0e18ed01383fed54f9f8013d24989e1d02a8fa6204",
        LOCKER_REWARD_VAULT_ID: "0xc1d5b28cbf2f7654cb68f49b50456486e929aecfd1dc066a7f68b1ab561c0b39",
        LOCKER_LOCKED_VAULT_ID: "0xa601cdf0da95626282bfda8466cc146278d304adbfbe6e1276fc05c26aa0c930",
        SUI_REWARD_VAULT_ID: "0xdd00cc9749160d6b13e7d600e34dc970c901aa8f8ce200e2cfd46669ff2f7c72"
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