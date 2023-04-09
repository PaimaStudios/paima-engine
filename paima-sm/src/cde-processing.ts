import type { Pool } from 'pg';

import { ChainDataExtensionType } from '@paima/utils';
import type { ChainDataExtensionDatum } from '@paima/utils-backend';

import processErc20Datum from './cde-erc20';
import processErc721Datum from './cde-erc721';
import type { SQLUpdate } from '@paima/db';
import { getSpecificCdeBlockheight } from '@paima/db';

export async function cdeTransitionFunction(
  readonlyDBConn: Pool,
  cdeDatum: ChainDataExtensionDatum
): Promise<SQLUpdate[]> {
  switch (cdeDatum.cdeType) {
    case ChainDataExtensionType.ERC20:
      return await processErc20Datum(readonlyDBConn, cdeDatum);
    case ChainDataExtensionType.ERC721:
      return await processErc721Datum(readonlyDBConn, cdeDatum);
    default:
      throw new Error(`[paima-sm] Unknown type on CDE datum: ${cdeDatum}`);
  }
}

export async function getProcessedCdeDatumCount(
  readonlyDBConn: Pool,
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
