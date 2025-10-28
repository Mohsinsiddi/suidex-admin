export const CONSTANTS = {
    // Main package ID from the deployment
    PACKAGE_ID: "0xbfac5e1c6bf6ef29b12f7723857695fd2f4da9a11a7d88162c15e9124c243a4a",
    
    // Core module IDs from the created objects
    ROUTER_ID: "0x9cdbbd092634efdc0e7033dc1c49d9ea5fc9bc5969ba708f55e05b6fcac12177",
    FACTORY_ID: "0x81c286135713b4bf2e78c548f5643766b5913dcd27a8e76469f146ab811e922d",
    FARM_ID: "0xc9c6844deb5031e87f14a9869736874327e4f7b9e2aef51c47f4e004c5b1053c",
    TOKEN_LOCKER_ID: "0xb604843d501173f9ea0762fbaa7cadaea3454c942deb527cb8905861ce39798b",
    GLOBAL_EMISSION_CONTROLLER_ID: "0xfbd4d5f644cc82e7486ceb048b8951a6efffe39254a6646d99f0ea6b81b5c5f4",
    
    // Admin capability IDs
    TOKEN_LOCKER_ADMIN_CAP_ID: "0x48acf00aabe2c82960c7ab06708122d6f0870672cf4c7fbb1738d2c5574bb687",
    GLOBAL_EMISSION_ADMIN_CAP_ID: "0xd579fe9b587a459b07a505c7c751351c189172316a6235e090f051b7afb828ef",
    FARM_ADMIN_CAP_ID: "0x96b44e94d008d1c2d1bea9e65442bd91ef0d91f2e7af331c75eafe247791dc8c",
    PAIR_ADMIN_CAP_ID: "0xa9639e5af0edfe6fffacb51249d18e425f649ad2f6dbbabcbf2fd84fa2466ef8",
    UPGRADE_CAP_ID: "0x0796fae3386ad1f475a18a0848e9ea486e229081d6c581359f034cf37a874212",
    
    VICTORY_TOKEN: {
        TYPE: "0xbfac5e1c6bf6ef29b12f7723857695fd2f4da9a11a7d88162c15e9124c243a4a::victory_token::VICTORY_TOKEN",
        TREASURY_CAP_WRAPPER_ID: "0x12035ff707ae772977c5102f8214c3c8b568929861717fcc73f5b67acafb1ce1",
        MINTER_CAP_ID: "0x22cd83911d4f86746fb6498fa43982dbb9db9836550a185824b355019094dfbf",
        METADATA_ID: "0xf5b52bc04da9300d11381a509cf8442784c8ee4ef96a0d624dcd89d4116e0847"
    },
    
    // Native SUI configuration for mainnet
    SUI: {
        TYPE: "0x2::sui::SUI", // Native SUI type
        DECIMALS: 9
    },
    
    VAULT_IDS: {
        FARM_REWARD_VAULT_ID: "0x227929e900c085a1e55f7e455d3af66aa0f522cf26dc54ed3e111dc8797a3e00",
        LOCKER_REWARD_VAULT_ID: "0xb70212065c2af0107a799517517e9170fcd38211aaa66f0ebc5a764d0506e2cc",
        LOCKER_LOCKED_VAULT_ID: "0x3632b8acce355fc8237998d44f1a68e58baac95f199714cdef5736d580dc6bf1",
        SUI_REWARD_VAULT_ID: "0xd781268befec0270299d5089f182d8c1f1caed15f8b7db3fa1a267b73e89ce9f"
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
        GLOBAL_EMISSION_CONTROLLER: "global_emission_controller"
    },
    
    CLOCK_ID: "0x6",
    getPairID: (token0: string, token1: string) => `${token0}_${token1}_pair`,
    
    // Network configuration
    NETWORK: 'mainnet' as const,
    RPC_URL: 'https://fullnode.mainnet.sui.io:443',
    ADMIN: '0x82b7b0e85bb9ba249b7a4ba7c20ef4db98489f82755a9dbd31354946e2bafb84'
}