import type { Pool } from 'pg';

import {
  getCdeIdByName,
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
import type {
  ICdeCardanoGetProjectedNftResult,
  ICdeErc1155GetAllTokensResult,
  ICdeErc1155GetByTokenIdAndWalletResult,
  ICdeErc1155GetByTokenIdResult,
} from '@paima/db';
export type { ICdeErc1155GetAllTokensResult };
import type {
  OwnedNftsResponse,
  GenericCdeDataUnit,
  TokenIdPair,
  CardanoAssetUtxo,
} from './types.js';

/**
 * Fetch the owner of the NFT from the database
 */
export async function getNftOwner(
  readonlyDBConn: Pool,
  cdeName: string,
  nftId: bigint
): Promise<string | null> {
  const cdeId = await getCdeIdByName(readonlyDBConn, cdeName);
  if (cdeId === null) return null;
  return await internalGetNftOwner(readonlyDBConn, cdeId, nftId);
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
  const cdeId = await getCdeIdByName(readonlyDBConn, cdeName);
  if (cdeId === null) return [];
  return await internalGetOwnedNfts(readonlyDBConn, cdeId, ownerAddress);
}

/**
 * Fetch the ERC-20 balance of a given address
 */
export async function getFungibleTokenBalance(
  readonlyDBConn: Pool,
  cdeName: string,
  walletAddress: string
): Promise<bigint | null> {
  const cdeId = await getCdeIdByName(readonlyDBConn, cdeName);
  if (cdeId === null) return null;
  return await internalGetFungibleTokenBalance(readonlyDBConn, cdeId, walletAddress);
}

/**
 * Fetch the total ERC-20 amount deposited to deposit address from given address
 */
export async function totalAmountDeposited(
  readonlyDBConn: Pool,
  cdeName: string,
  walletAddress: string
): Promise<bigint | null> {
  const cdeId = await getCdeIdByName(readonlyDBConn, cdeName);
  if (cdeId === null) return null;
  return await internalGetTotalDeposited(readonlyDBConn, cdeId, walletAddress);
}

/**
 * Fetch all addresses which deposited more than the given ERC-20 amount to deposit address
 */
export async function findUsersWithDepositsGreaterThan(
  readonlyDBConn: Pool,
  cdeName: string,
  thresholdAmount: bigint
): Promise<string[]> {
  const cdeId = await getCdeIdByName(readonlyDBConn, cdeName);
  if (cdeId === null) return [];
  return await internalGetDonorsAboveThreshold(readonlyDBConn, cdeId, thresholdAmount);
}

/**
 * Fetch all data objects from logs at the specified blockheight
 */
export async function getGenericDataBlockheight(
  readonlyDBConn: Pool,
  cdeName: string,
  blockHeight: number
): Promise<GenericCdeDataUnit[]> {
  const cdeId = await getCdeIdByName(readonlyDBConn, cdeName);
  if (cdeId === null) return [];
  return await internalGetGenericDataBlockheight(readonlyDBConn, cdeId, blockHeight);
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
  const cdeId = await getCdeIdByName(readonlyDBConn, cdeName);
  if (cdeId === null) return [];
  return await internalGetGenericDataBlockheightRange(readonlyDBConn, cdeId, fromBlock, toBlock);
}

/**
 * Get a listing of all tokens owned by a wallet within a single ERC-1155 contract.
 */
export async function getErc1155AllTokens(
  readonlyDBConn: Pool,
  cdeName: string,
  wallet: string
): Promise<ICdeErc1155GetAllTokensResult[]> {
  const cdeId = await getCdeIdByName(readonlyDBConn, cdeName);
  if (cdeId === null) return [];
  return await internalGetErc1155AllTokens(readonlyDBConn, cdeId, wallet);
}

/**
 * Get info on a specific token within a single ERC-1155 contract.
 */
export async function getErc1155ByTokenId(
  readonlyDBConn: Pool,
  cdeName: string,
  tokenId: bigint
): Promise<ICdeErc1155GetByTokenIdResult | null> {
  const cdeId = await getCdeIdByName(readonlyDBConn, cdeName);
  if (cdeId === null) return null;
  return await internalGetErc1155ByTokenId(readonlyDBConn, cdeId, tokenId);
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
  const cdeId = await getCdeIdByName(readonlyDBConn, cdeName);
  if (cdeId === null) return null;
  return await internalGetErc1155ByTokenIdAndWallet(readonlyDBConn, cdeId, wallet, tokenId);
}

/**
 * Fetch the NFT that owns this account
 */
export async function getErc6551AccountOwner(
  readonlyDBConn: Pool,
  cdeName: string,
  accountCreated: string
): Promise<TokenIdPair | null> {
  const cdeId = await getCdeIdByName(readonlyDBConn, cdeName);
  if (cdeId === null) return null;
  return await internalGetErc6551AccountOwner(readonlyDBConn, cdeId, accountCreated);
}

/**
 * Fetch all accounts owned by this NFT. This call is NOT recursive
 */
export async function getAllOwnedErc6551Accounts(
  readonlyDBConn: Pool,
  cdeName: string,
  nft: TokenIdPair
): Promise<string[]> {
  const cdeId = await getCdeIdByName(readonlyDBConn, cdeName);
  if (cdeId === null) return [];
  return await internalGetAllOwnedErc6551Accounts(readonlyDBConn, cdeId, nft);
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
