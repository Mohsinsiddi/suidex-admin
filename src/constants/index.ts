export const CONSTANTS = {
    // Main package ID from the deployment
    PACKAGE_ID: "0x1c4e4703ee8437fb0e6aff11d8e371a4ea2bab91dff917460c621411e5b1460a",
    
    // Core module IDs from the created objects
    ROUTER_ID: "0x0bdc908c34c56a5b49e20bc5a2d119d593f6e933424ab47872c65c8ec0c65888",
    FACTORY_ID: "0x4833ab9872b79d795f3b1e9f52272ef3150f6ccdfd588a2bfe989f0019699f55",
    FARM_ID: "0xb5ab79d892b77acef1f9274aed799a57ff05ee5a5c3a9f47b11fd6987781b04f",
    TOKEN_LOCKER_ID: "0xec61078a8a9f4d678c817a1f7d59624a029cc14a4567b38e45317c406404238a",
    GLOBAL_EMISSION_CONTROLLER_ID: "0xc7226e2c2709b6c6000be6d17d7a4bff4a390b2126f3bed5bced7498307fb5fc",
    
    // Admin capability IDs
    TOKEN_LOCKER_ADMIN_CAP_ID: "0x6b9091b3a425e57d15ddf29a65f5ddc4ee9c91044e977756dda7c3029da94d3f",
    GLOBAL_EMISSION_ADMIN_CAP_ID: "0xb2df9c5a6828e89047aa1d41dc5749799b0b58dfb08dd03e970f2083934d1e10",
    FARM_ADMIN_CAP_ID: "0x6d81c887e7c4cb6ada045d212fe6ef04f5e00c08aba68c9c032f65f7ca22aa85",
    PAIR_ADMIN_CAP_ID: "0x5bf90333df47e4731b8a53e9f467db31ecf5ce900f3ceaa50bc8d87a825c743d",
    UPGRADE_CAP_ID: "0x612851872710c0ef0a42d0c1f21944eee19b317522693fa82016e0b54f5d361e",
    
    VICTORY_TOKEN: {
        TYPE: "0x1c4e4703ee8437fb0e6aff11d8e371a4ea2bab91dff917460c621411e5b1460a::victory_token::VICTORY_TOKEN",
        TREASURY_CAP_WRAPPER_ID: "0x8ddf1fad3e9e138c61908dded0ced168de076e5931aa05348ae1fa0847f28829",
        MINTER_CAP_ID: "0x49d7d3d98457792985f498f94a82efa466c2af0487d5f089dd74d8b629837c03",
        METADATA_ID: "0xad9cc15107a3770982c4b244c113f5853c3e44d5d4f7724a86480ea5ee09de38"
    },
    
    TEST_SUI: {
        TYPE: "0x1c4e4703ee8437fb0e6aff11d8e371a4ea2bab91dff917460c621411e5b1460a::test_sui::TEST_SUI",
        TREASURY_CAP_WRAPPER_ID: "0x34fefe1c577b6209f1780579db5254a4d3703badc25325e07571e42dbfe02d9a",
        MINTER_CAP_ID: "0x07fc14bc49b9052bf411c36a6aed72a45b64e0e1fd5a275fd83baf93e03e54e9",
        METADATA_ID: "0xbb376da80fb8caef8fd94f262de230f441e8674a4f9d3759a9b621f6452d84ba"
    },
    
    // Note: Vault IDs are not present in this deployment log
    // These would typically be created in separate transactions
    VAULT_IDS: {
        FARM_REWARD_VAULT_ID: "0x7d441d9c103f36184a07f5593efdcff4b81178e8ee9643bc3db77021c962b6e8",
        LOCKER_REWARD_VAULT_ID: "0xa1672957106853989b1e3334b5d41516f14acbec023131bad9ad17b3d9c587db",
        LOCKER_LOCKED_VAULT_ID: "0x48922a823fab3638b4083e31682995c711991edb7b159eaf40ded6fd8b9ce952",
        SUI_REWARD_VAULT_ID: "0x944329b2b3cffc2c52a8a6cc3068696b6b88035da1a7b67fba6e19c31c61d7dc"
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