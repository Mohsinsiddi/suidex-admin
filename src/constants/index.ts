export const CONSTANTS = {
    // Main package ID from the deployment
    PACKAGE_ID: "0xdf7a15624ba560171fd2aa44d43e38947a2e72ca2067e02c71408f966c04b79b",
    
    // Core module IDs from the created objects
    ROUTER_ID: "0x63ab6b5a2ccb014aa7e7873c14021cb10c2f6cf3220592b8ef92b56951da6822",
    FACTORY_ID: "0x103fd26145a01a481fd913c20882d2662d6d10b7f95e5336690613640aac07cb",
    FARM_ID: "0x16811c633f4105188246ccd5bfadb98afee0241df8cfa19b6f4a57d3be638677",
    TOKEN_LOCKER_ID: "0xe85d1c8ed55e0914f53463f0e2b0f3c7447a74bd838a78c3cb3bbcbef10c38a5",
    GLOBAL_EMISSION_CONTROLLER_ID: "0x5f4679cba4925486980a9c2180f3d00136d8d915e60167c6595023fb53c0728c",
    
    // Admin capability IDs
    TOKEN_LOCKER_ADMIN_CAP_ID: "0x5ce2f4aed4b7567b03a323899b1069980528ef7b4b40b9d80080295eae3febe4",
    GLOBAL_EMISSION_ADMIN_CAP_ID: "0x270342e0a1679f1f449f6669f5b58761e485d2fd3ec92ad474012277346535e2",
    FARM_ADMIN_CAP_ID: "0x32c5735e2a918a4c03b6799a12c465ea215ebe2a5bf19d36e9ab6dd6626fa36a",
    PAIR_ADMIN_CAP_ID: "0x91db5f8f399e719ea5e6fb1e26800be734b960476e694928373d05e9e7ec2281",
    UPGRADE_CAP_ID: "0x91c9790e5b2ae391acbdb0fe951d8d8a42869ece9286ab3e4b2e8f15184eee34",
    
    VICTORY_TOKEN: {
        TYPE: "0xdf7a15624ba560171fd2aa44d43e38947a2e72ca2067e02c71408f966c04b79b::victory_token::VICTORY_TOKEN",
        TREASURY_CAP_WRAPPER_ID: "0x4f61ac9658a686078e21ac778a203a4deb0d8dbef49817429e3c95456132e094",
        MINTER_CAP_ID: "0x21a6a06def836da7355ebdc980ffc2c969370b5a8341aec15bfd6b29e648159e",
        METADATA_ID: "0x11dd2debd12e19c0884cff82f70b6706b586b49e33253679496136925073a6f1"
    },
    
    TEST_SUI: {
        TYPE: "0xdf7a15624ba560171fd2aa44d43e38947a2e72ca2067e02c71408f966c04b79b::test_sui::TEST_SUI",
        TREASURY_CAP_WRAPPER_ID: "0x0fc0e8be446cbf3f57869a5e6f995bed56ec58de5eaf3e02eb2686922db8c32c",
        MINTER_CAP_ID: "0x393a0c233aa15b680ffcf9d1f1357fcb2289ae9a4ccb05d2f4a092f970355963",
        METADATA_ID: "0x8416c08796f9e0f27e71456adbff78177c50c6116d7aa8a4218593b81a336c0b"
    },
    
    // Note: Vault IDs are not present in this deployment log
    // These would typically be created in separate transactions
    VAULT_IDS: {
        FARM_REWARD_VAULT_ID: "0xb6b44caf3e4b246c5758bf48529e859577f3b3374717e3f8034beba1793355f4",
        LOCKER_REWARD_VAULT_ID: "0x8483de8f48b9dc81e45fa8e1223794734b7c2cc01a0cb2295e45c5a70f64a516",
        LOCKER_LOCKED_VAULT_ID: "0xee6efb6ae7f039ef5f552e4375f86b769e3044437d38cb105914c20a81cd6a0d",
        SUI_REWARD_VAULT_ID: "0x5a29c3a2a3329d5d4dd084706e6396bcd64f3f0bdaa1aa154d4f058b7af30e58"
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