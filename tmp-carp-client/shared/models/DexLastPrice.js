"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriceType = void 0;
var PriceType;
(function (PriceType) {
    PriceType["Buy"] = "buy";
    PriceType["Sell"] = "sell";
    /**
     * Mean is not AVG from the last values, but the remaining amount of assets on the pool output
     */
    PriceType["Mean"] = "mean";
})(PriceType = exports.PriceType || (exports.PriceType = {}));
;
