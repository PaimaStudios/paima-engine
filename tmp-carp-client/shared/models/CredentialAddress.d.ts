import type { Credential, Bech32FullAddress } from "./Address";
import type { UntilBlockPagination, PageInfo } from "./common";
export declare type CredentialAddressRequest = {
    credentials: Credential[];
    after?: Bech32FullAddress;
} & UntilBlockPagination;
export declare type CredentialAddressResponse = {
    addresses: Bech32FullAddress[];
} & PageInfo;
