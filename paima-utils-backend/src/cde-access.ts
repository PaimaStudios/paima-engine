import type { Pool } from 'pg';
import {
  cdeErc20GetBalance,
  cdeErc721GetOwnedNfts,
  cdeErc721GetOwner,
  selectChainDataExtensionsByAddress,
  selectChainDataExtensionsByTypeAndAddress,
} from '@paima/db';
import { ChainDataExtensionType } from '@paima/utils';

async function getCdeIdByAddress(
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

async function getCdeIdByTypeAndAddress(
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

export async function getNftOwner(
  readonlyDBConn: Pool,
  contractAddress: string,
  nftId: string
): Promise<string | null> {
  const cdeId = await getCdeIdByTypeAndAddress(
    readonlyDBConn,
    ChainDataExtensionType.ERC721,
    contractAddress
  );
  if (cdeId == null) return null;

  // Fetch owner
  const results = await cdeErc721GetOwner.run({ cde_id: cdeId, token_id: nftId }, readonlyDBConn);
  if (results.length === 0) {
    return null;
  } else {
    return results[0].nft_owner;
  }
}

export async function getAllOwnedNfts(
  readonlyDBConn: Pool,
  contractAddress: string,
  ownerAddress: string
): Promise<string[]> {
  const cdeId = await getCdeIdByTypeAndAddress(
    readonlyDBConn,
    ChainDataExtensionType.ERC721,
    contractAddress
  );
  if (cdeId == null) return [];

  // Fetch owned nfts
  const results = await cdeErc721GetOwnedNfts.run(
    { cde_id: cdeId, nft_owner: ownerAddress },
    readonlyDBConn
  );
  return results.map(row => row.token_id);
}

export async function getFungibleTokenBalance(
  readonlyDBConn: Pool,
  contractAddress: string,
  walletAddress: string
): Promise<number | null> {
  const cdeId = await getCdeIdByTypeAndAddress(
    readonlyDBConn,
    ChainDataExtensionType.ERC20,
    contractAddress
  );
  if (cdeId == null) return null;

  // Fetch ERC20 balance
  const results = await cdeErc20GetBalance.run(
    { cde_id: cdeId, wallet_address: walletAddress },
    readonlyDBConn
  );
  if (results.length === 0) {
    return null;
  } else {
    const balance = parseInt(results[0].balance, 10);
    if (isNaN(balance)) return null;
    return balance;
  }
}
