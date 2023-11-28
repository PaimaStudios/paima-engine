import type { CdeErc6551RegistryDatum } from './types.js';
import { cdeErc6551InsertRegistry } from '@paima/db';
import type { SQLUpdate } from '@paima/db';

export default async function processErc721Datum(
  cdeDatum: CdeErc6551RegistryDatum
): Promise<SQLUpdate[]> {
  const updateList: SQLUpdate[] = [
    [
      cdeErc6551InsertRegistry,
      {
        cde_id: cdeDatum.cdeId,
        block_height: cdeDatum.blockNumber,
        account_created: cdeDatum.payload.accountCreated,
        implementation: cdeDatum.payload.implementation,
        token_contract: cdeDatum.payload.tokenContract,
        token_id: cdeDatum.payload.tokenId,
        chain_id: cdeDatum.payload.chainId,
        salt: cdeDatum.payload.salt,
      },
    ],
  ];

  return updateList;
}
