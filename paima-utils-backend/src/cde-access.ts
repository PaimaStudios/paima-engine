import type { Pool } from 'pg';

import {
  cdeErc20GetBalance,
  cdeErc721GetOwnedNfts,
  cdeErc721GetOwner,
  selectChainDataExtensionsByAddress,
  selectChainDataExtensionsByTypeAndAddress,
} from '@paima/db';
import type { ChainDataExtensionType } from '@paima/utils';
// To get the CDE ID:

export async function getCdeIdByAddress(
  readonlyDBConn: Pool,
  contractAddress: string
): Promise<number[]> {
  const results = await selectChainDataExtensionsByAddress.run(
    { contract_address: contractAddress },
    readonlyDBConn
  );
  return results.map(row => row.cde_id);
}

export async function getCdeIdByTypeAndAddress(
  readonlyDBConn: Pool,
  cdeType: ChainDataExtensionType,
  contractAddress: string
): Promise<number[]> {
  const results = await selectChainDataExtensionsByTypeAndAddress.run(
    { cde_type: cdeType, contract_address: contractAddress },
    readonlyDBConn
  );
  return results.map(row => row.cde_id);
}

// To get CDE data using the CDE ID:

export async function getNftOwner(
  readonlyDBConn: Pool,
  cdeId: number,
  tokenId: string
): Promise<string | null> {
  const results = await cdeErc721GetOwner.run({ cde_id: cdeId, token_id: tokenId }, readonlyDBConn);
  if (results.length === 0) {
    return null;
  } else {
    return results[0].nft_owner;
  }
}

export async function getOwnedNfts(
  readonlyDBConn: Pool,
  cdeId: number,
  ownerAddress: string
): Promise<string[]> {
  const results = await cdeErc721GetOwnedNfts.run(
    { cde_id: cdeId, nft_owner: ownerAddress },
    readonlyDBConn
  );
  return results.map(row => row.token_id);
}

export async function getTokenBalance(
  readonlyDBConn: Pool,
  cdeId: number,
  walletAddress: string
): Promise<string | null> {
  const results = await cdeErc20GetBalance.run(
    { cde_id: cdeId, wallet_address: walletAddress },
    readonlyDBConn
  );
  if (results.length === 0) {
    return null;
  } else {
    return results[0].balance;
  }
}
