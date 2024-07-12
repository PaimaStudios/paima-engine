import { ENV } from '@paima/utils';
import type { CdeErc1155TransferDatum } from './types.js';
import {
  cdeErc1155ModifyBalance,
  cdeErc1155DeleteIfZero,
  cdeErc1155Burn,
  createScheduledData,
} from '@paima/db';
import type {
  ICdeErc1155BurnParams,
  ICdeErc1155DeleteIfZeroParams,
  ICdeErc1155ModifyBalanceParams,
  SQLUpdate,
} from '@paima/db';

export default async function processErc1155TransferDatum(
  cdeDatum: CdeErc1155TransferDatum,
  inPresync: boolean
): Promise<SQLUpdate[]> {
  const { cdeName, scheduledPrefix, burnScheduledPrefix, payload, blockNumber } = cdeDatum;
  const { operator, from, to, ids, values } = payload;
  const isMint = from == '0x0000000000000000000000000000000000000000';
  const isBurn = /^0x0+(dead)?$/i.test(to);

  const updateList: SQLUpdate[] = [];

  // Always schedule the plain old transfer event.
  const scheduledBlockHeight = inPresync ? ENV.SM_START_BLOCKHEIGHT + 1 : blockNumber;
  if (scheduledPrefix) {
    const scheduledInputData = [
      scheduledPrefix,
      operator,
      from.toLowerCase(),
      to.toLowerCase(),
      JSON.stringify(ids),
      JSON.stringify(values),
    ].join('|');
    updateList.push(
      createScheduledData(scheduledInputData, scheduledBlockHeight, {
        cdeName: cdeDatum.cdeName,
        txHash: cdeDatum.transactionHash,
        network: cdeDatum.network,
      })
    );
  }

  if (isBurn && burnScheduledPrefix) {
    const burnData = [
      burnScheduledPrefix,
      operator,
      from.toLowerCase(),
      // to is excluded because it's presumed 0
      JSON.stringify(ids),
      JSON.stringify(values),
    ].join('|');
    updateList.push(
      createScheduledData(burnData, scheduledBlockHeight, {
        cdeName: cdeDatum.cdeName,
        txHash: cdeDatum.transactionHash,
        network: cdeDatum.network,
      })
    );
  }

  // Update balance + burn tables.
  for (let i = 0; i < ids.length; ++i) {
    let token_id = ids[i];
    let value = BigInt(values[i]);

    if (!isMint) {
      // if not a mint, reduce sender's balance
      updateList.push([
        cdeErc1155ModifyBalance,
        {
          cde_name: cdeName,
          token_id,
          wallet_address: from.toLowerCase(),
          value: (-value).toString(),
        } satisfies ICdeErc1155ModifyBalanceParams,
      ]);
      // And if it's zero, remove the row to keep table size down
      updateList.push([
        cdeErc1155DeleteIfZero,
        {
          cde_name: cdeName,
          token_id,
          wallet_address: from.toLowerCase(),
        } satisfies ICdeErc1155DeleteIfZeroParams,
      ]);
    }

    if (!isBurn) {
      // if not a burn, increase recipient's balance
      updateList.push([
        cdeErc1155ModifyBalance,
        {
          cde_name: cdeName,
          token_id,
          wallet_address: to.toLowerCase(),
          value: value.toString(),
        } satisfies ICdeErc1155ModifyBalanceParams,
      ]);
    } else {
      // if a burn, increase sender's burn record
      updateList.push([
        cdeErc1155Burn,
        {
          cde_name: cdeName,
          token_id,
          wallet_address: from.toLowerCase(),
          value: value.toString(),
        } satisfies ICdeErc1155BurnParams,
      ]);
    }
  }

  return updateList;
}
