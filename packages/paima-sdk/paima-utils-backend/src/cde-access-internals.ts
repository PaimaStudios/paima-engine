import type { Pool } from 'pg';

import {
  cdeErc20GetBalance,
  cdeErc721GetOwnedNfts,
  cdeErc721GetAllOwnedNfts,
  cdeErc721GetOwner,
  selectChainDataExtensionsByName,
  selectChainDataExtensionsByAddress,
  selectChainDataExtensionsByTypeAndAddress,
  cdeErc20DepositGetTotalDeposited,
  cdeErc20DepositSelectAll,
  cdeGenericGetBlockheightData,
  cdeGenericGetRangeData,
} from '@paima/db';
import type { ChainDataExtensionType, OwnedNftsResponse, GenericCdeDataUnit } from '@paima/utils';

/* Functions to retrieve CDE ID: */

export async function getCdeIdByAddress(
  readonlyDBConn: Pool,
  contractAddress: string
): Promise<number | null> {
  const results = await selectChainDataExtensionsByAddress.run(
    { contract_address: contractAddress },
    readonlyDBConn
  );

  if (results.length === 0) {
    return null;
  }
  return results[0].cde_id;
}

export async function getCdeIdByTypeAndAddress(
  readonlyDBConn: Pool,
  cdeType: ChainDataExtensionType,
  contractAddress: string
): Promise<number | null> {
  const results = await selectChainDataExtensionsByTypeAndAddress.run(
    { cde_type: cdeType, contract_address: contractAddress },
    readonlyDBConn
  );
  if (results.length === 0) {
    return null;
  }
  return results[0].cde_id;
}

export async function getCdeIdByName(
  readonlyDBConn: Pool,
  cdeName: string
): Promise<number | null> {
  const results = await selectChainDataExtensionsByName.run({ cde_name: cdeName }, readonlyDBConn);
  if (results.length === 0) {
    return null;
  }
  return results[0].cde_id;
}

/* Functions to retrieve CDE data using the CDE ID: */

export async function internalGetNftOwner(
  readonlyDBConn: Pool,
  cdeId: number,
  nftId: bigint
): Promise<string | null> {
  const results = await cdeErc721GetOwner.run(
    { cde_id: cdeId, token_id: nftId.toString(10) },
    readonlyDBConn
  );
  if (results.length === 0) {
    return null;
  } else {
    return results[0].nft_owner;
  }
}

export async function internalGetAllOwnedNfts(
  readonlyDBConn: Pool,
  ownerAddress: string
): Promise<OwnedNftsResponse[]> {
  ownerAddress = ownerAddress.toLowerCase();

  const results = await cdeErc721GetAllOwnedNfts.run({ nft_owner: ownerAddress }, readonlyDBConn);
  return results.map(row => ({
    cdeName: row.cde_name,
    tokenId: BigInt(row.token_id),
  }));
}

export async function internalGetOwnedNfts(
  readonlyDBConn: Pool,
  cdeId: number,
  ownerAddress: string
): Promise<bigint[]> {
  ownerAddress = ownerAddress.toLowerCase();
  const results = await cdeErc721GetOwnedNfts.run(
    { cde_id: cdeId, nft_owner: ownerAddress },
    readonlyDBConn
  );
  return results.map(row => BigInt(row.token_id));
}

export async function internalGetFungibleTokenBalance(
  readonlyDBConn: Pool,
  cdeId: number,
  walletAddress: string
): Promise<bigint | null> {
  walletAddress = walletAddress.toLowerCase();
  const results = await cdeErc20GetBalance.run(
    { cde_id: cdeId, wallet_address: walletAddress },
    readonlyDBConn
  );
  if (results.length === 0) {
    return null;
  } else {
    return BigInt(results[0].balance);
  }
}

export async function internalGetTotalDeposited(
  readonlyDBConn: Pool,
  cdeId: number,
  walletAddress: string
): Promise<bigint | null> {
  walletAddress = walletAddress.toLowerCase();
  const results = await cdeErc20DepositGetTotalDeposited.run(
    { cde_id: cdeId, wallet_address: walletAddress },
    readonlyDBConn
  );
  if (results.length === 0) {
    return null;
  } else {
    return BigInt(results[0].total_deposited);
  }
}

export async function internalGetDonorsAboveThreshold(
  readonlyDBConn: Pool,
  cdeId: number,
  threshold: bigint
): Promise<string[]> {
  const results = await cdeErc20DepositSelectAll.run({ cde_id: cdeId }, readonlyDBConn);
  const aboveThreshold = results.filter(res => BigInt(res.total_deposited) >= threshold);
  return aboveThreshold.map(res => res.wallet_address);
}

export async function internalGetGenericDataBlockheight(
  readonlyDBConn: Pool,
  cdeId: number,
  blockHeight: number
): Promise<GenericCdeDataUnit[]> {
  const results = await cdeGenericGetBlockheightData.run(
    { cde_id: cdeId, block_height: blockHeight },
    readonlyDBConn
  );
  return results.map(res => ({
    blockHeight,
    payload: res.event_data,
  }));
}

export async function internalGetGenericDataBlockheightRange(
  readonlyDBConn: Pool,
  cdeId: number,
  fromBlock: number,
  toBlock: number
): Promise<GenericCdeDataUnit[]> {
  const results = await cdeGenericGetRangeData.run(
    { cde_id: cdeId, from_block: fromBlock, to_block: toBlock },
    readonlyDBConn
  );
  return results.map(res => ({
    blockHeight: res.block_height,
    payload: res.event_data,
  }));
}
