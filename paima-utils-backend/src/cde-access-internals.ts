import type { Pool } from 'pg';

import {
  cdeErc20GetBalance,
  cdeErc721GetOwnedNfts,
  cdeErc721GetOwner,
  selectChainDataExtensionsByName,
  selectChainDataExtensionsByAddress,
  selectChainDataExtensionsByTypeAndAddress,
} from '@paima/db';
import type { ChainDataExtensionType } from '@paima/utils';

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
