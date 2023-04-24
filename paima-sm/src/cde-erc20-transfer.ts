import type { Pool } from 'pg';

import { doLog } from '@paima/utils';
import type { CdeErc20TransferDatum } from '@paima/runtime';
import { cdeErc20GetBalance, cdeErc20InsertBalance, cdeErc20UpdateBalance } from '@paima/db';
import type { SQLUpdate } from '@paima/db';

export default async function processErc20Datum(
  readonlyDBConn: Pool,
  cdeDatum: CdeErc20TransferDatum
): Promise<SQLUpdate[]> {
  const cdeId = cdeDatum.cdeId;
  const { from, to, value } = cdeDatum.payload;

  const fromAddr = from.toLowerCase();
  const toAddr = to.toLowerCase();

  const fromRow = await cdeErc20GetBalance.run(
    { cde_id: cdeId, wallet_address: fromAddr },
    readonlyDBConn
  );
  const toRow = await cdeErc20GetBalance.run(
    { cde_id: cdeId, wallet_address: toAddr },
    readonlyDBConn
  );

  const numValue = BigInt(value);

  const updateList: SQLUpdate[] = [];
  try {
    if (fromRow.length > 0) {
      const fromOldBalance = BigInt(fromRow[0].balance);
      const fromNewBalance = fromOldBalance - numValue;
      updateList.push([
        cdeErc20UpdateBalance,
        {
          cde_id: cdeId,
          wallet_address: fromAddr,
          balance: fromNewBalance.toString(10),
        },
      ]);
    }

    if (toRow.length > 0) {
      const toOldBalance = BigInt(toRow[0].balance);
      const toNewBalance = toOldBalance + numValue;
      updateList.push([
        cdeErc20UpdateBalance,
        {
          cde_id: cdeId,
          wallet_address: toAddr,
          balance: toNewBalance.toString(10),
        },
      ]);
    } else {
      updateList.push([
        cdeErc20InsertBalance,
        {
          cde_id: cdeId,
          wallet_address: toAddr,
          balance: value,
        },
      ]);
    }
  } catch (err) {
    doLog(`[paima-sm] error while processing erc20 datum: ${err}`);
    return [];
  }

  return updateList;
}
