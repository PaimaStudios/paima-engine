import type { Pool } from 'pg';

import { ChainDataExtensionType, doLog } from '@paima/utils';
import type { ChainDataExtensionDatum } from '@paima/utils';
import { cdeErc721GetOwner, cdeErc721InsertOwner, cdeErc721UpdateOwner } from '@paima/db';

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

    // TODO: if from is 0, mint event -- schedule input (need to know what blockheight to schedule it for -- can be inferred from blockheight)
  } catch (err) {
    doLog(`[paima-sm] error while processing erc721 datum: ${err}`);
    return false;
  }

  return true;
}
