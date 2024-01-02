import type { Pool } from 'pg';

import {
  cdeErc20GetBalance,
  cdeErc721GetOwnedNfts,
  cdeErc721GetAllOwnedNfts,
  cdeErc721GetOwner,
  selectChainDataExtensionsByName,
  cdeErc20DepositGetTotalDeposited,
  cdeErc20DepositSelectAll,
  cdeGenericGetBlockheightData,
  cdeGenericGetRangeData,
  cdeErc6551GetOwnedAccounts,
  cdeErc6551GetOwner,
  cdeCardanoPoolGetAddressDelegation,
  cdeCardanoGetProjectedNft,
  type ICdeCardanoGetProjectedNftResult,
  getCardanoEpoch,
} from '@paima/db';
import type { OwnedNftsResponse, GenericCdeDataUnit, TokenIdPair } from './types.js';

/* Functions to retrieve CDE ID: */

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

export async function internalGetErc6551AccountOwner(
  readonlyDBConn: Pool,
  cdeId: number,
  accountCreated: string
): Promise<TokenIdPair | null> {
  const results = await cdeErc6551GetOwner.run(
    { cde_id: cdeId, account_created: accountCreated },
    readonlyDBConn
  );
  if (results.length === 0) {
    return null;
  } else {
    return {
      tokenContract: results[0].token_contract,
      tokenId: results[0].token_id,
    };
  }
}

export async function internalGetAllOwnedErc6551Accounts(
  readonlyDBConn: Pool,
  cdeId: number,
  nft: TokenIdPair
): Promise<string[]> {
  const results = await cdeErc6551GetOwnedAccounts.run(
    { cde_id: cdeId, token_contract: nft.tokenContract, token_id: nft.tokenId },
    readonlyDBConn
  );
  return results.map(row => row.account_created);
}

/**
 * If the most recent delegation is the current epoch, we need to return the
 * list of recent delegations so the app can know what delegation the user had
 * beforehand since delegations only matters once they cross an epoch boundary
 *
 * If the most recent delegation isn't from the current epoch, we know it's the
 * one that is active now
 */
export async function internalGetCardanoAddressDelegation(
  readonlyDBConn: Pool,
  address: string
): Promise<{ events: { pool: string | null; epoch: number }[]; currentEpoch: number } | null> {
  const results = await cdeCardanoPoolGetAddressDelegation.run({ address }, readonlyDBConn);
  if (results.length === 0) {
    return null;
  }

  const currentEpoch = await getCardanoEpoch.run(undefined, readonlyDBConn);

  if (currentEpoch.length === 0) {
    throw new Error('Current epoch table not initialized');
  }

  if (currentEpoch[0].epoch === results[results.length - 1].epoch) {
    return {
      currentEpoch: currentEpoch[0].epoch,
      events: results.map(r => {
        return { pool: r.pool, epoch: r.epoch };
      }),
    };
  } else {
    const result = results[results.length - 1];
    return {
      currentEpoch: currentEpoch[0].epoch,
      events: [{ pool: result.pool, epoch: result.epoch }],
    };
  }
}

export async function internalGetCardanoProjectedNft(
  readonlyDBConn: Pool,
  owner_address: string
): Promise<ICdeCardanoGetProjectedNftResult[]> {
  const results = await cdeCardanoGetProjectedNft.run({ owner_address }, readonlyDBConn);

  return results;
}
