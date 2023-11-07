"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getErrorResponse = exports.query = void 0;
const axios_1 = __importDefault(require("axios"));
__exportStar(require("../../shared/routes"), exports);
__exportStar(require("../../shared/errors"), exports);
async function query(urlBase, route, data) {
    const result = await axios_1.default.post(`${urlBase}/${route}`, data);
    return result.data;
}
exports.query = query;
function getErrorResponse(err) {
    if (err.response == null)
        throw new Error(`Unexpected null response`);
    return err.response;
}
exports.getErrorResponse = getErrorResponse;
