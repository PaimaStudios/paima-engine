import type { PoolClient } from 'pg';

import { doLog } from '@paima/utils';
import type { CdeBatcherPaymentDatum } from './types.js';
import type { SQLUpdate } from '@paima/db';
import { cdeBatcherPaymentUpdateBalance } from '@paima/db';

export default async function processBatcherPayment(
  readonlyDBConn: PoolClient,
  cdeDatum: CdeBatcherPaymentDatum,
  inPresync: boolean
): Promise<SQLUpdate[]> {
  const cde_name = cdeDatum.cdeName;
  const { batcherAddress, userAddress, value } = cdeDatum.payload;

  const updateList: SQLUpdate[] = [];
  console.log('processBatcherPayment', cdeDatum, inPresync);
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    updateList.push([
      cdeBatcherPaymentUpdateBalance,
      {
        cde_name: 'generic-batcher-contract', // TODO Using constant name. Can there be more than one?
        batcher_address: batcherAddress,
        user_address: userAddress,
        balance: value,
      },
    ]);
  } catch (err) {
    doLog(`[paima-sm] error while processing erc721 datum: ${err}`);
    return [];
  }

  return updateList;
}
