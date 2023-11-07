import { Address } from "./Address";
export declare type DelegationForAddressRequest = {
    address: Address;
    until: {
        absoluteSlot: number;
    };
};
export declare type DelegationForAddressResponse = {
    pool: string | null;
    txId: string | null;
};
