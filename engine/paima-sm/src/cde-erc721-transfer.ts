import type { PoolClient } from 'pg';

import { doLog } from '@paima/utils';
import type { CdeErc721TransferDatum } from '@paima/runtime';
import { cdeErc721GetOwner, cdeErc721InsertOwner, cdeErc721UpdateOwner } from '@paima/db';
import type { SQLUpdate } from '@paima/db';

export default async function processErc721Datum(
  readonlyDBConn: PoolClient,
  cdeDatum: CdeErc721TransferDatum
): Promise<SQLUpdate[]> {
  const cdeId = cdeDatum.cdeId;
  const { from, to, tokenId } = cdeDatum.payload;
  const toAddr = to.toLowerCase();

  const updateList: SQLUpdate[] = [];
  try {
    const ownerRow = await cdeErc721GetOwner.run(
      { cde_id: cdeId, token_id: tokenId },
      readonlyDBConn
    );
    const newOwnerData = { cde_id: cdeId, token_id: tokenId, nft_owner: toAddr };
    if (ownerRow.length > 0) {
      updateList.push([cdeErc721UpdateOwner, newOwnerData]);
    } else {
      updateList.push([cdeErc721InsertOwner, newOwnerData]);
    }
  } catch (err) {
    doLog(`[paima-sm] error while processing erc721 datum: ${err}`);
    return [];
  }

  return updateList;
}
