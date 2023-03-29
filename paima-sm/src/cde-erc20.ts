import type { Pool } from 'pg';

import { ChainDataExtensionType, doLog } from '@paima/utils';
import type { ChainDataExtensionDatum } from '@paima/utils';
import { cdeErc20GetBalance, cdeErc20InsertBalance, cdeErc20UpdateBalance } from '@paima/db';

export default async function processErc20Datum(
  DBConn: Pool,
  cdeDatum: ChainDataExtensionDatum
): Promise<boolean> {
  if (cdeDatum.cdeType !== ChainDataExtensionType.ERC20) {
    return false;
  }
  const cdeId = cdeDatum.cdeId;
  const { from, to, value } = cdeDatum.payload;

  const fromRow = await cdeErc20GetBalance.run({ cde_id: cdeId, wallet_address: from }, DBConn);
  const toRow = await cdeErc20GetBalance.run({ cde_id: cdeId, wallet_address: to }, DBConn);

  const numValue = BigInt(value);

  try {
    if (fromRow.length > 0) {
      const fromOldBalance = BigInt(fromRow[0].balance);
      const fromNewBalance = fromOldBalance - numValue;
      await cdeErc20UpdateBalance.run(
        {
          cde_id: cdeId,
          wallet_address: from,
          balance: fromNewBalance.toString(10),
        },
        DBConn
      );
    }

    if (toRow.length > 0) {
      const toOldBalance = BigInt(toRow[0].balance);
      const toNewBalance = toOldBalance + numValue;
      await cdeErc20UpdateBalance.run(
        {
          cde_id: cdeId,
          wallet_address: to,
          balance: toNewBalance.toString(10),
        },
        DBConn
      );
    } else {
      await cdeErc20InsertBalance.run(
        {
          cde_id: cdeId,
          wallet_address: to,
          balance: value,
        },
        DBConn
      );
    }
  } catch (err) {
    doLog(`[paima-sm] error while processing erc20 datum: ${err}`);
    return false;
  }

  return true;
}
