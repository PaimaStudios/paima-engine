import type { Pool } from 'pg';

import { ChainDataExtensionType } from '@paima/utils';
import type { ChainDataExtensionDatum } from '@paima/utils';

import processErc20Datum from './cde-erc20';
import processErc721Datum from './cde-erc721';

type ProcessCdeDatumFunction = (
  DBConn: Pool,
  cdeDatum: ChainDataExtensionDatum
) => Promise<boolean>;

export async function processCdeDatum(
  DBConn: Pool,
  cdeDatum: ChainDataExtensionDatum
): Promise<boolean> {
  switch (cdeDatum.cdeType) {
    case ChainDataExtensionType.ERC20:
      return await processErc20Datum(DBConn, cdeDatum);
    case ChainDataExtensionType.ERC721:
      return await processErc721Datum(DBConn, cdeDatum);
    default:
      throw new Error(`[paima-sm] Unknown type on CDE datum: ${cdeDatum}`);
  }
}
