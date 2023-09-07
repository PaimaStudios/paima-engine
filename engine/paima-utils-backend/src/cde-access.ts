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
} from './cde-access-internals';
import type { OwnedNftsResponse, GenericCdeDataUnit } from '@paima/utils';

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
