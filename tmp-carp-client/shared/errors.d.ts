export declare enum ErrorCodes {
    AddressLimitExceeded = 0,
    IncorrectAddressFormat = 1,
    BlockHashNotFound = 2,
    PageStartNotFound = 3,
    UtxoLimitExceeded = 4,
    IncorrectFormat = 5,
    BlockOffsetLimit = 6,
    OffsetBlockNotFound = 7,
    AssetLimitExceeded = 8,
    CredentialLimitExceeded = 9,
    AssetPairLimitExceeded = 10
}
export declare type ErrorShape = {
    code: number;
    reason: string;
};
export declare const Errors: {
    readonly AddressLimitExceeded: {
        readonly code: ErrorCodes.AddressLimitExceeded;
        readonly prefix: "Exceeded request address limit.";
        readonly detailsGen: (details: {
            limit: number;
            found: number;
        }) => string;
    };
    readonly UtxoLimitExceeded: {
        readonly code: ErrorCodes.UtxoLimitExceeded;
        readonly prefix: "Exceeded request utxo limit.";
        readonly detailsGen: (details: {
            limit: number;
            found: number;
        }) => string;
    };
    readonly IncorrectAddressFormat: {
        readonly code: ErrorCodes.IncorrectAddressFormat;
        readonly prefix: "Incorrectly formatted addresses found.";
        readonly detailsGen: (details: {
            addresses: string[];
        }) => string;
    };
    readonly IncorrectFormat: {
        readonly code: ErrorCodes.IncorrectFormat;
        readonly prefix: "Incorrectly formatted data found.";
        readonly detailsGen: (details: object) => string;
    };
    readonly BlockHashNotFound: {
        readonly code: ErrorCodes.BlockHashNotFound;
        readonly prefix: "Block hash not found.";
        readonly detailsGen: (details: {
            untilBlock: string;
        }) => string;
    };
    readonly PageStartNotFound: {
        readonly code: ErrorCodes.PageStartNotFound;
        readonly prefix: "Combination of block and transaction not found.";
        readonly detailsGen: (details: {
            blockHash: string;
            txHash: string;
        }) => string;
    };
    readonly BlockOffsetLimit: {
        readonly code: ErrorCodes.BlockOffsetLimit;
        readonly prefix: "Block offset exceeded the limit.";
        readonly detailsGen: (details: {
            offset: number;
            limit: number;
        }) => string;
    };
    readonly OffsetBlockNotFound: {
        readonly code: ErrorCodes.OffsetBlockNotFound;
        readonly prefix: "Block not found at offset. Are you sure your database is synchronized?";
        readonly detailsGen: (details: {
            offset: number;
        }) => string;
    };
    readonly AssetLimitExceeded: {
        readonly code: ErrorCodes.AssetLimitExceeded;
        readonly prefix: "Exceeded request <policy, asset> pair limit.";
        readonly detailsGen: (details: {
            limit: number;
            found: number;
        }) => string;
    };
    readonly CredentialLimitExceeded: {
        readonly code: ErrorCodes.CredentialLimitExceeded;
        readonly prefix: "Exceeded request credential limit.";
        readonly detailsGen: (details: {
            limit: number;
            found: number;
        }) => string;
    };
    readonly AssetPairLimitExceeded: {
        readonly code: ErrorCodes.AssetPairLimitExceeded;
        readonly prefix: "Exceeded request asset pair limit.";
        readonly detailsGen: (details: {
            limit: number;
            found: number;
        }) => string;
    };
};
export declare function genErrorMessage<T extends typeof Errors[keyof typeof Errors]>(type: T, details: Parameters<T["detailsGen"]>[0]): {
    code: T["code"];
    reason: string;
};
