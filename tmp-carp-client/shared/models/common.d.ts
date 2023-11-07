import { AssetName, PolicyId } from "./PolicyIdAssetMap";
/**
 * Filter which uses of the address are considered relevant for the query.
 *
 * This is a bitmask, so you can combine multiple options
 * ex: `RelationFilterType.Input & RelationFilterType.Output`
 *
 * Note: relations only apply to credentials and not to full bech32 addresses
 * @pattern ([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])
 * @example 255
 */
export declare type RelationFilter = number;
export declare enum RelationFilterType {
    FILTER_ALL = 0,
    Witness = 1,
    Input = 2,
    Output = 4,
    StakeDeregistration = 8,
    StakeDelegation = 16,
    StakeRegistration = 32,
    DelegationTarget = 64,
    PoolOwner = 128,
    PoolOperator = 256,
    PoolReward = 512,
    MirRecipient = 1024,
    Withdrawal = 2048,
    RequiredSigner = 4096,
    InNativeScript = 8192,
    UnusedInput = 16384,
    UnusedInputStake = 32768,
    InputStake = 65536,
    OutputStake = 131072,
    UnusedOutput = 262144,
    UnusedOutputStake = 524288,
    ReferenceInput = 1048576,
    ReferenceInputStake = 2097152,
    NO_FILTER = 255
}
export declare type BlockTxPair = {
    /**
     * block hash
     * @pattern [0-9a-fA-F]{64}
     * @example "2548ad5d0d9d33d50ab43151f574474454017a733e307229fa509c4987ca9782"
     */
    block: string;
    /**
     * tx hash
     * @pattern [0-9a-fA-F]{64}
     * @example "336d520af58ff440b2f20210ddb5ef5b2c035e0ec7ec258bae4b519a87fa1696"
     */
    tx: string;
};
export declare type AfterBlockPagination = {
    /**
     * Omitting "after" means you query starting from the genesis block.
     *
     * Note: the reason you have to specify both a tx hash AND a block hash in the "after" for pagination
     * is because this is the only way to make sure your pagination doesn't get affected by rollbacks.
     * ex: a rollback could cause a tx to be removed from one block and appear in a totally different block.
     * Specifying the block hash as well allows making sure you're paginating on the right tx in the right block.
     */
    after?: BlockTxPair;
};
export declare type UntilBlockPagination = {
    /**
     * block hash - inclusive
     * @pattern [0-9a-fA-F]{64}
     * @example "cf8c63a909d91776e27f7d05457e823a9dba606a7ab499ac435e7904ee70d7c8"
     */
    untilBlock: string;
};
export declare type Pagination = AfterBlockPagination & UntilBlockPagination;
export declare type UtxoPointer = {
    /**
     * @pattern [0-9a-fA-F]{64}
     * @example "011b86557367525891331b4bb985545120efc335b606d6a1c0d5a35fb330f421"
     */
    txHash: string;
    index: number;
};
export declare type PageInfo = {
    pageInfo: {
        /**
         * @example false
         */
        hasNextPage: boolean;
    };
};
export declare enum Direction {
    Buy = "buy",
    Sell = "sell"
}
export declare enum Dex {
    WingRiders = "WingRiders",
    SundaeSwap = "SundaeSwap",
    MinSwap = "MinSwap"
}
export declare type Asset = {
    policyId: PolicyId;
    assetName: AssetName;
} | null;
/**
 * @pattern [1-9][0-9]*
 * @example "2042352568679"
 */
export declare type Amount = string;
