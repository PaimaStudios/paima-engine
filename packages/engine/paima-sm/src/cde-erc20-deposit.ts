import type { PoolClient } from 'pg';

import { doLog, ENV } from '@paima/utils';
import type { CdeErc20DepositDatum } from './types.js';
import type { SQLUpdate } from '@paima/db';
import {
  createScheduledData,
  cdeErc20DepositGetTotalDeposited,
  cdeErc20DepositInsertTotalDeposited,
  cdeErc20DepositUpdateTotalDeposited,
} from '@paima/db';

export default async function processErc20Datum(
  readonlyDBConn: PoolClient,
  cdeDatum: CdeErc20DepositDatum,
  inPresync: boolean
): Promise<SQLUpdate[]> {
  const cdeName = cdeDatum.cdeName;
  const { from, value } = cdeDatum.payload;

  const fromAddr = from.toLowerCase();

  const fromRow = await cdeErc20DepositGetTotalDeposited.run(
    { cde_name: cdeName, wallet_address: fromAddr },
    readonlyDBConn
  );

  const numValue = BigInt(value);
  const prefix = cdeDatum.scheduledPrefix;

  const updateList: SQLUpdate[] = [];
  try {
    const scheduledInputData = `${prefix}|${fromAddr}|${value}`;
    const scheduledBlockHeight = inPresync ? ENV.SM_START_BLOCKHEIGHT + 1 : cdeDatum.blockNumber;
    updateList.push(
      createScheduledData(scheduledInputData, scheduledBlockHeight, {
        cdeName: cdeDatum.cdeName,
        txHash: cdeDatum.transactionHash,
        caip2: cdeDatum.caip2,
        fromAddress: fromAddr,
        contractAddress: cdeDatum.contractAddress,
      })
    );

    if (fromRow.length > 0) {
      const oldTotal = BigInt(fromRow[0].total_deposited);
      const newTotal = oldTotal + numValue;
      updateList.push([
        cdeErc20DepositUpdateTotalDeposited,
        {
          cde_name: cdeName,
          wallet_address: fromAddr,
          total_deposited: newTotal.toString(10),
        },
      ]);
    } else {
      updateList.push([
        cdeErc20DepositInsertTotalDeposited,
        {
          cde_name: cdeName,
          wallet_address: fromAddr,
          total_deposited: value,
        },
      ]);
    }
  } catch (err) {
    doLog(`[paima-sm] error while processing erc20 datum: ${err}`);
    return [];
  }

  return updateList;
}
