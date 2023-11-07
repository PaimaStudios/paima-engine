"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.nftCborToJson = exports.paginatedMetadataNft = exports.paginatedTransactionHistory = exports.paginateQuery = void 0;
const index_1 = require("./index");
const index_2 = require("./index");
const chunk_1 = __importDefault(require("lodash/chunk"));
const constants_1 = require("../../shared/constants");
const merge_1 = __importDefault(require("lodash/merge"));
/**
 * If you don't mind using axios,
 * you can use the paginated endpoints provided by the client
 * However this endpoint allows you to pass in your own querying library
 */
async function paginateQuery(initialRequest, query, pageFromResponse) {
    let nextRequest = initialRequest;
    const result = [];
    let currentPage = [];
    do {
        currentPage = await query(nextRequest);
        result.push(...currentPage);
        nextRequest = {
            ...nextRequest,
            after: pageFromResponse(currentPage[currentPage.length - 1]),
        };
    } while (currentPage.length === 0);
    return result;
}
exports.paginateQuery = paginateQuery;
async function paginatedTransactionHistory(urlBase, initialRequest) {
    const result = await paginateQuery(initialRequest, async (request) => (await (0, index_1.query)(urlBase, index_2.Routes.transactionHistory, request)).transactions, (resp) => resp != null
        ? {
            block: resp.block.hash,
            tx: resp.transaction.hash,
        }
        : undefined);
    return { transactions: result };
}
exports.paginatedTransactionHistory = paginatedTransactionHistory;
function pairsToAssetMap(pairs) {
    var _a;
    const result = {};
    for (const [policyId, assetName] of pairs) {
        const for_policy = (_a = result[policyId]) !== null && _a !== void 0 ? _a : [];
        for_policy.push(assetName);
        // if this was a newly added policy
        if (for_policy.length === 1) {
            result[policyId] = for_policy;
        }
    }
    return { assets: result };
}
async function paginatedMetadataNft(urlBase, request) {
    const pairs = [];
    for (const [policyId, assets] of Object.entries(request.assets)) {
        for (const asset of assets) {
            pairs.push([policyId, asset]);
        }
    }
    let result = { cip25: {} };
    const chunkedResult = await Promise.all((0, chunk_1.default)(pairs, constants_1.ASSET_LIMIT.REQUEST).map((chunk) => (0, index_1.query)(urlBase, index_2.Routes.metadataNft, pairsToAssetMap(chunk))));
    for (const chunk of chunkedResult) {
        result = (0, merge_1.default)(result, chunk);
    }
    return result;
}
exports.paginatedMetadataNft = paginatedMetadataNft;
function nftCborToJson(request, cmlTransactioMetadatum, decode_metadatum_to_json_str, conversionType) {
    const result = {};
    for (const [policyId, assetNames] of Object.entries(request.cip25)) {
        const newAssetNameMap = {};
        for (const [assetName, cbor] of Object.entries(assetNames)) {
            const metadatum = cmlTransactioMetadatum.from_bytes(Buffer.from(cbor, "hex"));
            const json = decode_metadatum_to_json_str(metadatum, conversionType);
            newAssetNameMap[assetName] = json;
        }
        result[policyId] = newAssetNameMap;
    }
    return { cip25: result };
}
exports.nftCborToJson = nftCborToJson;
