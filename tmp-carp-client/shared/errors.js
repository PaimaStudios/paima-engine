"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.genErrorMessage = exports.Errors = exports.ErrorCodes = void 0;
var ErrorCodes;
(function (ErrorCodes) {
    // we explicitly add the numbers to this enum
    // that way removing an entry in the future isn't a breaking change
    ErrorCodes[ErrorCodes["AddressLimitExceeded"] = 0] = "AddressLimitExceeded";
    ErrorCodes[ErrorCodes["IncorrectAddressFormat"] = 1] = "IncorrectAddressFormat";
    ErrorCodes[ErrorCodes["BlockHashNotFound"] = 2] = "BlockHashNotFound";
    ErrorCodes[ErrorCodes["PageStartNotFound"] = 3] = "PageStartNotFound";
    ErrorCodes[ErrorCodes["UtxoLimitExceeded"] = 4] = "UtxoLimitExceeded";
    ErrorCodes[ErrorCodes["IncorrectFormat"] = 5] = "IncorrectFormat";
    ErrorCodes[ErrorCodes["BlockOffsetLimit"] = 6] = "BlockOffsetLimit";
    ErrorCodes[ErrorCodes["OffsetBlockNotFound"] = 7] = "OffsetBlockNotFound";
    ErrorCodes[ErrorCodes["AssetLimitExceeded"] = 8] = "AssetLimitExceeded";
    ErrorCodes[ErrorCodes["CredentialLimitExceeded"] = 9] = "CredentialLimitExceeded";
    ErrorCodes[ErrorCodes["AssetPairLimitExceeded"] = 10] = "AssetPairLimitExceeded";
})(ErrorCodes = exports.ErrorCodes || (exports.ErrorCodes = {}));
exports.Errors = {
    AddressLimitExceeded: {
        code: ErrorCodes.AddressLimitExceeded,
        prefix: "Exceeded request address limit.",
        detailsGen: (details) => `Limit of ${details.limit}, found ${details.found}`,
    },
    UtxoLimitExceeded: {
        code: ErrorCodes.UtxoLimitExceeded,
        prefix: "Exceeded request utxo limit.",
        detailsGen: (details) => `Limit of ${details.limit}, found ${details.found}`,
    },
    IncorrectAddressFormat: {
        code: ErrorCodes.IncorrectAddressFormat,
        prefix: "Incorrectly formatted addresses found.",
        detailsGen: (details) => JSON.stringify(details.addresses),
    },
    IncorrectFormat: {
        code: ErrorCodes.IncorrectFormat,
        prefix: "Incorrectly formatted data found.",
        detailsGen: (details) => JSON.stringify(details),
    },
    BlockHashNotFound: {
        code: ErrorCodes.BlockHashNotFound,
        prefix: "Block hash not found.",
        detailsGen: (details) => `Searched block hash: ${details.untilBlock}`,
    },
    PageStartNotFound: {
        code: ErrorCodes.PageStartNotFound,
        prefix: "Combination of block and transaction not found.",
        detailsGen: (details) => `Searched block hash ${details.blockHash} and tx hash ${details.txHash}`,
    },
    BlockOffsetLimit: {
        code: ErrorCodes.BlockOffsetLimit,
        prefix: "Block offset exceeded the limit.",
        detailsGen: (details) => `Offset used was ${details.offset}, but limit is ${details.limit}`,
    },
    OffsetBlockNotFound: {
        code: ErrorCodes.OffsetBlockNotFound,
        prefix: "Block not found at offset. Are you sure your database is synchronized?",
        detailsGen: (details) => `Offset used was ${details.offset}`,
    },
    AssetLimitExceeded: {
        code: ErrorCodes.AssetLimitExceeded,
        prefix: "Exceeded request <policy, asset> pair limit.",
        detailsGen: (details) => `Limit of ${details.limit}, found ${details.found}`,
    },
    CredentialLimitExceeded: {
        code: ErrorCodes.CredentialLimitExceeded,
        prefix: "Exceeded request credential limit.",
        detailsGen: (details) => `Limit of ${details.limit}, found ${details.found}`,
    },
    AssetPairLimitExceeded: {
        code: ErrorCodes.AssetPairLimitExceeded,
        prefix: "Exceeded request asset pair limit.",
        detailsGen: (details) => `Limit of ${details.limit}, found ${details.found}`,
    },
};
function genErrorMessage(type, details) {
    const generatedDetails = type.detailsGen(details);
    return {
        code: type.code,
        reason: generatedDetails.length === 0
            ? type.prefix
            : `${type.prefix} ${generatedDetails}`,
    };
}
exports.genErrorMessage = genErrorMessage;
