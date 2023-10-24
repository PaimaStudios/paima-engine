import type { PoolClient } from 'pg';

import { ChainDataExtensionDatumType } from '@paima/utils';
import type { ChainDataExtensionDatum } from '@paima/runtime';

import processErc20TransferDatum from './cde-erc20-transfer';
import processErc721TransferDatum from './cde-erc721-transfer';
import processErc721MintDatum from './cde-erc721-mint';
import processErc20DepositDatum from './cde-erc20-deposit';
import processErc6551RegistryDatum from './cde-erc6551-registry';
import processGenericDatum from './cde-generic';
import type { SQLUpdate } from '@paima/db';
import { getSpecificCdeBlockheight } from '@paima/db';
import assertNever from 'assert-never';

export async function cdeTransitionFunction(
  readonlyDBConn: PoolClient,
  cdeDatum: ChainDataExtensionDatum
): Promise<SQLUpdate[]> {
  switch (cdeDatum.cdeDatumType) {
    case ChainDataExtensionDatumType.ERC20Transfer:
      return await processErc20TransferDatum(readonlyDBConn, cdeDatum);
    case ChainDataExtensionDatumType.ERC721Transfer:
      return await processErc721TransferDatum(readonlyDBConn, cdeDatum);
    case ChainDataExtensionDatumType.ERC721Mint:
      return await processErc721MintDatum(cdeDatum);
    case ChainDataExtensionDatumType.ERC20Deposit:
      return await processErc20DepositDatum(readonlyDBConn, cdeDatum);
    case ChainDataExtensionDatumType.Generic:
      return await processGenericDatum(cdeDatum);
    case ChainDataExtensionDatumType.ERC6551Registry:
      return await processErc6551RegistryDatum(cdeDatum);
    default:
      assertNever(cdeDatum);
  }
}

export async function getProcessedCdeDatumCount(
  readonlyDBConn: PoolClient,
  blockHeight: number
): Promise<number> {
  const cdeStatus = await getSpecificCdeBlockheight.run(
    { block_height: blockHeight },
    readonlyDBConn
  );
  if (cdeStatus.length === 0) {
    return 0;
  }
  return cdeStatus[0].datum_count;
}
