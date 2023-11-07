export type TokenIdPair = { tokenContract: string; tokenId: string };

export interface OwnedNftsResponse {
  cdeName: string;
  tokenId: bigint;
}

export interface GenericCdeDataUnit {
  blockHeight: number;
  payload: any;
}
