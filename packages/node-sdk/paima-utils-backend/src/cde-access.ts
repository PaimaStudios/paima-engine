import type { Pool } from 'pg';

import {
  internalGetNftOwner,
  internalGetOwnedNfts,
  internalGetFungibleTokenBalance,
  internalGetTotalDeposited,
  internalGetDonorsAboveThreshold,
  internalGetAllOwnedNfts,
  internalGetGenericDataBlockheight,
  internalGetGenericDataBlockheightRange,
  internalGetErc6551AccountOwner,
  internalGetAllOwnedErc6551Accounts,
  internalGetCardanoAddressDelegation,
  internalGetCardanoProjectedNft,
  internalGetCardanoAssetUtxos,
  internalGetErc1155AllTokens,
  internalGetErc1155ByTokenId,
  internalGetErc1155ByTokenIdAndWallet,
} from './cde-access-internals.js';
import {
  getDynamicExtensionByName as internalGetDynamicExtensionByName,
  getDynamicExtensionsByParent,
  type ICdeCardanoGetProjectedNftResult,
  type ICdeErc1155GetAllTokensResult,
  type ICdeErc1155GetByTokenIdAndWalletResult,
  type ICdeErc1155GetByTokenIdResult,
} from '@paima/db';
export type { ICdeErc1155GetAllTokensResult };
import type {
  OwnedNftsResponse,
  GenericCdeDataUnit,
  TokenIdPair,
  CardanoAssetUtxo,
} from './types.js';
import { DYNAMIC_PRIMITIVE_NAME_SEPARATOR } from '@paima/utils';

/**
 * Fetch the owner of the NFT from the database
 */
export async function getNftOwner(
  readonlyDBConn: Pool,
  cdeName: string,
  nftId: bigint
): Promise<string | null> {
  return await internalGetNftOwner(readonlyDBConn, cdeName, nftId);
}

/**
 * Check if a given address is the owner of an nft
 */
export async function isNftOwner(
  readonlyDBConn: Pool,
  cdeName: string,
  nftId: bigint,
  ownerAddress: string
): Promise<boolean> {
  const ownerRes = await getNftOwner(readonlyDBConn, cdeName, nftId);
  if (ownerRes && ownerRes === ownerAddress) return true;
  return false;
}

/**
 * Fetch all NFTs the owner has (across all CDEs)
 */
export async function getAllOwnedNfts(
  readonlyDBConn: Pool,
  ownerAddress: string
): Promise<OwnedNftsResponse[]> {
  return await internalGetAllOwnedNfts(readonlyDBConn, ownerAddress);
}

/**
 * Fetch all NFTs the owner has for a given contract
 */
export async function getOwnedNfts(
  readonlyDBConn: Pool,
  cdeName: string,
  ownerAddress: string
): Promise<bigint[]> {
  return await internalGetOwnedNfts(readonlyDBConn, cdeName, ownerAddress);
}

/**
 * Fetch the ERC-20 balance of a given address
 */
export async function getFungibleTokenBalance(
  readonlyDBConn: Pool,
  cdeName: string,
  walletAddress: string
): Promise<bigint | null> {
  return await internalGetFungibleTokenBalance(readonlyDBConn, cdeName, walletAddress);
}

/**
 * Fetch the total ERC-20 amount deposited to deposit address from given address
 */
export async function totalAmountDeposited(
  readonlyDBConn: Pool,
  cdeName: string,
  walletAddress: string
): Promise<bigint | null> {
  return await internalGetTotalDeposited(readonlyDBConn, cdeName, walletAddress);
}

/**
 * Fetch all addresses which deposited more than the given ERC-20 amount to deposit address
 */
export async function findUsersWithDepositsGreaterThan(
  readonlyDBConn: Pool,
  cdeName: string,
  thresholdAmount: bigint
): Promise<string[]> {
  return await internalGetDonorsAboveThreshold(readonlyDBConn, cdeName, thresholdAmount);
}

/**
 * Fetch all data objects from logs at the specified blockheight
 */
export async function getGenericDataBlockheight(
  readonlyDBConn: Pool,
  cdeName: string,
  blockHeight: number
): Promise<GenericCdeDataUnit[]> {
  return await internalGetGenericDataBlockheight(readonlyDBConn, cdeName, blockHeight);
}

/**
 * Fetch all data objects from logs in the specified blockheight range
 */
export async function getGenericDataBlockheightRange(
  readonlyDBConn: Pool,
  cdeName: string,
  fromBlock: number,
  toBlock: number
): Promise<GenericCdeDataUnit[]> {
  return await internalGetGenericDataBlockheightRange(readonlyDBConn, cdeName, fromBlock, toBlock);
}

/**
 * Get a listing of all tokens owned by a wallet within a single ERC-1155 contract.
 */
export async function getErc1155AllTokens(
  readonlyDBConn: Pool,
  cdeName: string,
  wallet: string
): Promise<ICdeErc1155GetAllTokensResult[]> {
  return await internalGetErc1155AllTokens(readonlyDBConn, cdeName, wallet);
}

/**
 * Get info on a specific token within a single ERC-1155 contract.
 */
export async function getErc1155ByTokenId(
  readonlyDBConn: Pool,
  cdeName: string,
  tokenId: bigint
): Promise<ICdeErc1155GetByTokenIdResult | null> {
  return await internalGetErc1155ByTokenId(readonlyDBConn, cdeName, tokenId);
}

/**
 * Get info on a specific token owned by a wallet within a single ERC-1155 contract.
 */
export async function getErc1155ByTokenIdAndWallet(
  readonlyDBConn: Pool,
  cdeName: string,
  wallet: string,
  tokenId: bigint
): Promise<ICdeErc1155GetByTokenIdAndWalletResult | null> {
  return await internalGetErc1155ByTokenIdAndWallet(readonlyDBConn, cdeName, wallet, tokenId);
}

/**
 * Fetch the NFT that owns this account
 */
export async function getErc6551AccountOwner(
  readonlyDBConn: Pool,
  cdeName: string,
  accountCreated: string
): Promise<TokenIdPair | null> {
  return await internalGetErc6551AccountOwner(readonlyDBConn, cdeName, accountCreated);
}

/**
 * Fetch all accounts owned by this NFT. This call is NOT recursive
 */
export async function getAllOwnedErc6551Accounts(
  readonlyDBConn: Pool,
  cdeName: string,
  nft: TokenIdPair
): Promise<string[]> {
  return await internalGetAllOwnedErc6551Accounts(readonlyDBConn, cdeName, nft);
}

/**
 * Fetch the pool this address is delegating to, if any.
 *
 * If the last delegation indexed for this address happened during the current
 * epoch, this returns both the current delegation and the previous entry.
 *
 * Otherwise, this will just return a single entry.
 */
export async function getCardanoAddressDelegation(
  readonlyDBConn: Pool,
  address: string
): Promise<{ events: { pool: string | null; epoch: number }[]; currentEpoch: number } | null> {
  return await internalGetCardanoAddressDelegation(readonlyDBConn, address);
}

/**
 * Fetch the NFTs that are projected by particular PKH
 */
export async function getCardanoAddressProjectedNfts(
  readonlyDBConn: Pool,
  address: string
): Promise<ICdeCardanoGetProjectedNftResult[]> {
  return await internalGetCardanoProjectedNft(readonlyDBConn, address);
}

export async function getCardanoAssetUtxosByFingerprint(
  readonlyDBConn: Pool,
  address: string,
  cip14Fingerprint: string
): Promise<CardanoAssetUtxo[]> {
  return await internalGetCardanoAssetUtxos(
    readonlyDBConn,
    address,
    'cip14_fingerprint',
    cip14Fingerprint
  );
}

export async function getCardanoAssetUtxosByPolicyId(
  readonlyDBConn: Pool,
  address: string,
  policyId: string
): Promise<CardanoAssetUtxo[]> {
  return await internalGetCardanoAssetUtxos(readonlyDBConn, address, 'policy_id', policyId);
}

export function generateDynamicPrimitiveName(parentName: string, id: number): string {
  return `${parentName}${DYNAMIC_PRIMITIVE_NAME_SEPARATOR}${id}`;
}

export async function getDynamicExtensions(
  readonlyDBConn: Pool,
  parent: string
): Promise<{ name: string; config: string }[]> {
  const dbResult = await getDynamicExtensionsByParent.run({ parent: parent }, readonlyDBConn);

  return dbResult.map(ext => ({ name: ext.cde_name, config: ext.config }));
}

export async function getDynamicExtensionByName(
  readonlyDBConn: Pool,
  name: string
): Promise<string[]> {
  const dbResult = await internalGetDynamicExtensionByName.run({ name: name }, readonlyDBConn);

  return dbResult.map(ext => ext.config);
}
