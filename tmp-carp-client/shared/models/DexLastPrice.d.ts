import { Dex, Asset, Amount } from "./common";
export declare type DexLastPrice = {
    asset1: Asset;
    asset2: Asset;
    amount1: Amount;
    amount2: Amount;
    dex: Dex;
};
export declare enum PriceType {
    Buy = "buy",
    Sell = "sell",
    /**
     * Mean is not AVG from the last values, but the remaining amount of assets on the pool output
     */
    Mean = "mean"
}
export declare type DexLastPriceRequest = {
    assetPairs: {
        asset1: Asset;
        asset2: Asset;
    }[];
    type: PriceType;
};
export declare type DexLastPriceResponse = {
    lastPrice: DexLastPrice[];
};