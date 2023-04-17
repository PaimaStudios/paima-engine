import type { Pool } from 'pg';

import {
  getCdeIdByName,
  internalGetNftOwner,
  internalGetAllOwnedNfts,
  internalGetFungibleTokenBalance,
} from './cde-access-internals';

// Fetch the owner of the NFT from the database
export async function getNftOwner(
  readonlyDBConn: Pool,
  cdeName: string,
  nftId: bigint
): Promise<string | null> {
  const cdeId = await getCdeIdByName(readonlyDBConn, cdeName);
  if (cdeId === null) return null;
  return await internalGetNftOwner(readonlyDBConn, cdeId, nftId);
}

// Check if a given address is the owner of an nft
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

// Fetch all NFTs the owner has for a given contract
export async function getAllOwnedNfts(
  readonlyDBConn: Pool,
  cdeName: string,
  ownerAddress: string
): Promise<bigint[]> {
  const cdeId = await getCdeIdByName(readonlyDBConn, cdeName);
  if (cdeId === null) return [];
  return await internalGetAllOwnedNfts(readonlyDBConn, cdeId, ownerAddress);
}

// Fetch the ERC-20 balance of a given address
export async function getFungibleTokenBalance(
  readonlyDBConn: Pool,
  cdeName: string,
  walletAddress: string
): Promise<bigint | null> {
  const cdeId = await getCdeIdByName(readonlyDBConn, cdeName);
  if (cdeId === null) return null;
  return await internalGetFungibleTokenBalance(readonlyDBConn, cdeId, walletAddress);
}
