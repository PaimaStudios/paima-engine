import {
  getChainDataExtensions,
  insertDynamicExtension,
  registerChainDataExtension,
} from '@paima/db';
import type { SQLUpdate } from '@paima/db';
import type { CdeDynamicPrimitiveDatum } from './types.js';
import { ChainDataExtensionType } from '@paima/utils';
import type { PoolClient } from 'pg';
import YAML from 'yaml';

export default async function processDatum(
  readonlyDBConn: PoolClient,
  cdeDatum: CdeDynamicPrimitiveDatum,
  _inPresync: boolean,
  reloadExtensions: () => void
): Promise<SQLUpdate[]> {
  const extensions = await getChainDataExtensions.run(undefined, readonlyDBConn);

  const cdeId =
    extensions.map(ext => ext.cde_id).reduce((cde_id1, cde_id2) => Math.max(cde_id1, cde_id2)) + 1;

  const updateList: SQLUpdate[] = [
    [
      registerChainDataExtension,
      {
        cde_id: cdeId,
        cde_type: ChainDataExtensionType.ERC721,
        cde_name: cdeDatum.cdeName,
        // the hash is not verified for these
        cde_hash: 0,
        start_blockheight: cdeDatum.blockNumber + 1,
        scheduled_prefix: cdeDatum.scheduledPrefix,
      },
    ],
    [
      insertDynamicExtension,
      {
        cde_id: cdeId,
        config: YAML.stringify({
          name: cdeDatum.cdeName,
          type: 'erc721',
          contractAddress: cdeDatum.payload.contractAddress,
          startBlockHeight: cdeDatum.blockNumber + 1,
          scheduledPrefix: cdeDatum.scheduledPrefix,
          network: cdeDatum.network,
        }),
      },
    ],
  ];

  reloadExtensions();

  return updateList;
}
