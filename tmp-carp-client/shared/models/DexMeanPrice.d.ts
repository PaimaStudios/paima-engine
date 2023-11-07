import { Dex, Pagination, Asset, Amount } from "./common";
export declare type DexMeanPrice = {
    tx_hash: string;
    dex: Dex;
    asset1: Asset;
    asset2: Asset;
    amount1: Amount;
    amount2: Amount;
};
export declare type DexMeanPriceRequest = {
    assetPairs: {
        asset1: Asset;
        asset2: Asset;
    }[];
    dexes: Array<Dex>;
    /** Defaults to `DEX_PRICE_LIMIT.RESPONSE` */
    limit?: number;
} & Pagination;
export declare type DexMeanPriceResponse = {
    meanPrices: DexMeanPrice[];
};
