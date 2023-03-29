import type { Pool } from 'pg';

import { ChainDataExtensionType } from '@paima/utils';
import type { ChainDataExtensionDatum } from '@paima/utils';

import processErc20Datum from './cde-erc20';

type ProcessCdeDatumFunction = (
  DBConn: Pool,
  cdeDatum: ChainDataExtensionDatum
) => Promise<boolean>;

export async function processCdeDatum(
  DBConn: Pool,
  cdeDatum: ChainDataExtensionDatum
): Promise<boolean> {
  const processFunction = selectCdeProcessingFunction(cdeDatum.cdeType);
  return await processFunction(DBConn, cdeDatum);
}

function selectCdeProcessingFunction(cdeType: ChainDataExtensionType): ProcessCdeDatumFunction {
  switch (cdeType) {
    case ChainDataExtensionType.ERC20:
      return processErc20Datum;
    default:
      throw new Error(`[paima-sm] Unknown CDE type: ${cdeType}`);
  }
}
