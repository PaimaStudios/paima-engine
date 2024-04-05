import type { PoolClient } from 'pg';

import { doLog, ENV } from '@paima/utils';
import type { CdeErc721TransferDatum } from './types.js';
import {
  cdeErc721BurnInsert,
  cdeErc721Delete,
  cdeErc721GetOwner,
  cdeErc721InsertOwner,
  cdeErc721UpdateOwner,
  createScheduledData,
} from '@paima/db';
import type { SQLUpdate } from '@paima/db';

export default async function processErc721Datum(
  readonlyDBConn: PoolClient,
  cdeDatum: CdeErc721TransferDatum,
  isPresync: boolean
): Promise<SQLUpdate[]> {
  const cdeId = cdeDatum.cdeId;
  const { to, tokenId } = cdeDatum.payload;
  const toAddr = to.toLowerCase();

  const isBurn = Boolean(toAddr.toLocaleLowerCase().match(/^0x0+(dead)?$/g));

  const updateList: SQLUpdate[] = [];
  try {
    const ownerRow = await cdeErc721GetOwner.run(
      { cde_id: cdeId, token_id: tokenId },
      readonlyDBConn
    );
    const newOwnerData = { cde_id: cdeId, token_id: tokenId, nft_owner: toAddr };
    if (ownerRow.length > 0) {
      if (isBurn) {
        if (cdeDatum.burnScheduledPrefix && !isPresync) {
          const scheduledInputData = `${cdeDatum.burnScheduledPrefix}|${ownerRow[0].nft_owner}|${tokenId}`;
          const scheduledBlockHeight = cdeDatum.blockNumber;

          updateList.push(createScheduledData(scheduledInputData, scheduledBlockHeight));
        }

        // we do this to keep track of the owner before the asset is sent to the
        // burn address
        updateList.push([
          cdeErc721BurnInsert,
          { cde_id: cdeId, token_id: tokenId, nft_owner: ownerRow[0].nft_owner },
        ]);
        updateList.push([cdeErc721Delete, { cde_id: cdeId, token_id: tokenId }]);
      } else {
        updateList.push([cdeErc721UpdateOwner, newOwnerData]);
      }
    } else {
      updateList.push([cdeErc721InsertOwner, newOwnerData]);
    }
  } catch (err) {
    doLog(`[paima-sm] error while processing erc721 datum: ${err}`);
    return [];
  }

  return updateList;
}
