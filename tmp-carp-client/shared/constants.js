"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEX_PRICE_LIMIT = exports.BLOCK_LIMIT = exports.CREDENTIAL_LIMIT = exports.ASSET_LIMIT = exports.UTXO_LIMIT = exports.ADDRESS_LIMIT = void 0;
// TODO: make these a mapping from out to object instead of standalone structs
exports.ADDRESS_LIMIT = {
    REQUEST: 100,
    RESPONSE: 1000,
};
exports.UTXO_LIMIT = {
    REQUEST: 100,
    RESPONSE: 1000,
};
exports.ASSET_LIMIT = {
    REQUEST: 1000,
    RESPONSE: 1000,
};
exports.CREDENTIAL_LIMIT = {
    REQUEST: 50,
    RESPONSE: 50,
};
exports.BLOCK_LIMIT = {
    OFFSET: 21600, // k parameter
};
exports.DEX_PRICE_LIMIT = {
    REQUEST_ADDRESSES: 100,
    REQUEST_ASSET_PAIRS: 100,
    RESPONSE: 1000,
};
