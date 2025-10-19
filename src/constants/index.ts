export const CONSTANTS = {
    // Main package ID from the deployment
    PACKAGE_ID: "0xcc3cbaf7a6c29e4acf36689cf2d8bac965b798464e49b7d9e51990e892859d32",
    
    // Core module IDs from the created objects
    ROUTER_ID: "0xa0a360017eb33928d797802ef5655eb5c09d860fd8af50071b894beab781c492",
    FACTORY_ID: "0x4c3159270324e5b9a58f2339fce58c306094a1ce164869e3f755db7a5c220d80",
    FARM_ID: "0x818ea092b28c2ea0e996da445d23d26bb211d9decacb8719e69840d4d62004e5",
    TOKEN_LOCKER_ID: "0x9c5334bc7608cf5f5741305f790482caf0c2f7a2d5603ed6d31ac486f4fe5083",
    GLOBAL_EMISSION_CONTROLLER_ID: "0x4f89f0026ba04cefb7e5bbfbdb3f5def46db1f44abc2759ad91655ac9cddfdf6",
    
    // Admin capability IDs
    TOKEN_LOCKER_ADMIN_CAP_ID: "0x97b1ebd827570f8f6692ed7b5140517ca89f5b8a098a284e2d12533ec567d5d0",
    GLOBAL_EMISSION_ADMIN_CAP_ID: "0x52d917ca30866cfa07ee4590c49a1694f99667192f6c56fdfb9bf49b61f7df67",
    FARM_ADMIN_CAP_ID: "0x19794c6ea34e3f559e2f266e3a57e8ebf1a2878ba1d57e0fe8a5b9165b47f6c8",
    PAIR_ADMIN_CAP_ID: "0xc48364679d515c629860bb5cbb890e2bf7adc66d82ed139fe71c466629177b62",
    UPGRADE_CAP_ID: "0xfed6f28cbb7b56413673729910bd6bc36fe1243c190240e03239c1ea5a60fc54",
    
    VICTORY_TOKEN: {
        TYPE: "0xcc3cbaf7a6c29e4acf36689cf2d8bac965b798464e49b7d9e51990e892859d32::victory_token::VICTORY_TOKEN",
        TREASURY_CAP_WRAPPER_ID: "0x8c1fb46e24b898eabcc7a1eff9baf4d36af05f9895226a0d6ce5a6660d94c0d4",
        MINTER_CAP_ID: "0x67bc631c82e3014f63c2c9ee3de1d4a177fa337aec52923b39174da23af93896",
        METADATA_ID: "0x02f5ab9605d11d28e7fa240b1756c4fbcd3eb8e11dc82fe2525f4bfd1d055ff5"
    },
    
    TEST_SUI: {
        TYPE: "0xcc3cbaf7a6c29e4acf36689cf2d8bac965b798464e49b7d9e51990e892859d32::test_sui::TEST_SUI",
        TREASURY_CAP_WRAPPER_ID: "0xc96c37b4f99f4e502b2a73b3e5054f02483ea75fce353c123394090c99c703e0",
        MINTER_CAP_ID: "0x1c7dbc0e2c6230439f7b41e2c3eaa95c16f904b15afd60dfc4bebce37d574b52",
        METADATA_ID: "0x713134e2f91c61fb1dd81e4bbfb37a0600a6e40984e6b07811a946eda262cacc"
    },
    
    // Note: Vault IDs need to be created in separate transactions
    // These placeholders should be replaced after vault creation
    VAULT_IDS: {
        FARM_REWARD_VAULT_ID: "0x9b8bf27fb4feafdb88439c30b3fd14c40441c988950817bc187f9e71058f5fff",
        LOCKER_REWARD_VAULT_ID: "0xd827cb7851758cc0706ef7622b27a4305ec45f575079bf70f4c95ff798e538d5",
        LOCKER_LOCKED_VAULT_ID: "0xb09dadc3eb2adad636de97e6b7c9baf73e0f6965f94fa43a18e72867f930a2fa",
        SUI_REWARD_VAULT_ID: "0xa005cc730a48dee04f7efe63aca37acd44abe813314704c797a7c6160b2aeade"
    },
    
    MODULES: {
        FACTORY: "factory",
        PAIR: "pair",
        ROUTER: "router", 
        LIBRARY: "library",
        MATH_UTILS: "math_utils",
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