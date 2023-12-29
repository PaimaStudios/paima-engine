export type TokenIdPair = { tokenContract: string; tokenId: string };

export interface OwnedNftsResponse {
  cdeName: string;
  tokenId: bigint;
}

export interface GenericCdeDataUnit {
  blockHeight: number;
  payload: any;
}

export interface CardanoAssetUtxo {
  txId: string;
  outputIndex: number;
  amount: string;
  policyId: string;
  assetName: string;
}
