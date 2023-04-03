import type { Pool } from 'pg';

import { ChainDataExtensionType, doLog, ENV } from '@paima/utils';
import type { ChainDataExtensionDatum, ChainDataExtensionErc721Datum } from '@paima/utils';
import {
  cdeErc721GetOwner,
  cdeErc721InsertOwner,
  cdeErc721UpdateOwner,
  createScheduledData,
} from '@paima/db';
import type { SQLUpdate } from '@paima/db';

export default async function processErc721Datum(
  readonlyDBConn: Pool,
  cdeDatum: ChainDataExtensionDatum
): Promise<SQLUpdate[]> {
  if (cdeDatum.cdeType !== ChainDataExtensionType.ERC721) {
    return [];
  }
  const cdeId = cdeDatum.cdeId;
  const { from, to, tokenId } = cdeDatum.payload;

  const updateList: SQLUpdate[] = [];
  try {
    const ownerRow = await cdeErc721GetOwner.run(
      { cde_id: cdeId, token_id: tokenId },
      readonlyDBConn
    );
    const newOwnerData = { cde_id: cdeId, token_id: tokenId, nft_owner: to };
    if (ownerRow.length > 0) {
      updateList.push([cdeErc721UpdateOwner, newOwnerData]);
    } else {
      updateList.push([cdeErc721InsertOwner, newOwnerData]);
    }

    if (from.match(/^0x0+$/g)) {
      updateList.push(...scheduleMintInput(cdeDatum));
    }
  } catch (err) {
    doLog(`[paima-sm] error while processing erc721 datum: ${err}`);
    return [];
  }

  return updateList;
}

function scheduleMintInput(cdeDatum: ChainDataExtensionErc721Datum): SQLUpdate[] {
  const [prefix, address, tokenId] = [
    cdeDatum.initializationPrefix,
    cdeDatum.contractAddress,
    cdeDatum.payload.tokenId,
  ];

  if (!prefix) {
    return [];
  }

  const scheduledBlockHeight = Math.max(cdeDatum.blockNumber, ENV.START_BLOCKHEIGHT + 1);
  const scheduledInputData = `${prefix}|${address}|${tokenId}`;
  return [createScheduledData(scheduledInputData, scheduledBlockHeight)];
}
