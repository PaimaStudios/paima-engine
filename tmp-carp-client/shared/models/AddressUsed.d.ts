import { Address } from "./Address";
import { Pagination } from "./common";
export declare type AddressUsedRequest = {
    addresses: Address[];
} & Pagination;
export declare type AddressUsedResponse = {
    addresses: Address[];
};
