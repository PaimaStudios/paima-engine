import type { Pool } from 'pg';

import { ChainDataExtensionType, doLog } from '@paima/utils';
import type { ChainDataExtensionDatum } from '@paima/runtime';
import { cdeErc20GetBalance, cdeErc20InsertBalance, cdeErc20UpdateBalance } from '@paima/db';
import type { SQLUpdate } from '@paima/db';

export default async function processErc20Datum(
  readonlyDBConn: Pool,
  cdeDatum: ChainDataExtensionDatum
): Promise<SQLUpdate[]> {
  if (cdeDatum.cdeType !== ChainDataExtensionType.ERC20) {
    return [];
  }
  const cdeId = cdeDatum.cdeId;
  const { from, to, value } = cdeDatum.payload;

  const fromRow = await cdeErc20GetBalance.run(
    { cde_id: cdeId, wallet_address: from },
    readonlyDBConn
  );
  const toRow = await cdeErc20GetBalance.run({ cde_id: cdeId, wallet_address: to }, readonlyDBConn);

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
          wallet_address: from,
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
          wallet_address: to,
          balance: toNewBalance.toString(10),
        },
      ]);
    } else {
      updateList.push([
        cdeErc20InsertBalance,
        {
          cde_id: cdeId,
          wallet_address: to,
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
