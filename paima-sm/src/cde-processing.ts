import type { Pool } from 'pg';

import { ChainDataExtensionType } from '@paima/utils';
import type { ChainDataExtensionDatum } from '@paima/utils';

import processErc20Datum from './cde-erc20';
import processErc721Datum from './cde-erc721';
import type { SQLUpdate } from '@paima/db';

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
