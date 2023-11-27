export declare type ProjectedNftRangeRequest = {
    range: { minSlot: number, maxSlot: number }
};

export declare type ProjectedNftRangeResponse = {
    txId: string | null,
    slot: number,
    address: string | null,
    asset: string,
    amount: number,
    status: string | null,
    plutusDatum: string | null,
}[];