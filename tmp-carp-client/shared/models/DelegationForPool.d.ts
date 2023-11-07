import { Address } from "./Address";
import { Pool, PoolHex } from "./Pool";
export declare type DelegationForPoolRequest = {
    pools: Pool[];
    range: {
        minSlot: number;
        maxSlot: number;
    };
};
export declare type DelegationForPoolResponse = {
    credential: Address;
    pool: PoolHex | null;
    txId: string | null;
    slot: number;
}[];
