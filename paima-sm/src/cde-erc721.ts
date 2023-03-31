import type { Pool } from 'pg';

import { ChainDataExtensionType, doLog, ENV } from '@paima/utils';
import type { ChainDataExtensionDatum, ChainDataExtensionErc721Datum } from '@paima/utils';
import {
  cdeErc721GetOwner,
  cdeErc721InsertOwner,
  cdeErc721UpdateOwner,
  getSpecificChainDataExtension,
  newScheduledData,
} from '@paima/db';

export default async function processErc721Datum(
  DBConn: Pool,
  cdeDatum: ChainDataExtensionDatum
): Promise<boolean> {
  if (cdeDatum.cdeType !== ChainDataExtensionType.ERC721) {
    return false;
  }
  const cdeId = cdeDatum.cdeId;
  const { from, to, tokenId } = cdeDatum.payload;

  try {
    const ownerRow = await cdeErc721GetOwner.run({ cde_id: cdeId, token_id: tokenId }, DBConn);
    if (ownerRow.length > 0) {
      await cdeErc721UpdateOwner.run({ cde_id: cdeId, token_id: tokenId, nft_owner: to }, DBConn);
    } else {
      await cdeErc721InsertOwner.run({ cde_id: cdeId, token_id: tokenId, nft_owner: to }, DBConn);
    }

    if (from.match(/^0x0+$/g)) {
      // Mint event:
      await scheduleMintInput(DBConn, cdeDatum);
    }
  } catch (err) {
    doLog(`[paima-sm] error while processing erc721 datum: ${err}`);
    return false;
  }

  return true;
}

async function scheduleMintInput(
  DBConn: Pool,
  cdeDatum: ChainDataExtensionErc721Datum
): Promise<void> {
  const result = await getSpecificChainDataExtension.run({ cde_id: cdeDatum.cdeId }, DBConn);
  if (result.length === 0) {
    doLog(`[paima-sm] encountered CDE datum with invalid cde_id: ${cdeDatum.cdeId}`);
    return;
  }

  const [prefix, address, tokenId] = [
    result[0].scheduled_prefix,
    result[0].contract_address,
    cdeDatum.payload.tokenId,
  ];

  if (!prefix) {
    return;
  }

  await newScheduledData.run(
    {
      block_height: Math.max(cdeDatum.blockNumber, ENV.START_BLOCKHEIGHT + 1),
      input_data: `${prefix}|${address}|${tokenId}`, // TODO: concise builder?
    },
    DBConn
  );
}
