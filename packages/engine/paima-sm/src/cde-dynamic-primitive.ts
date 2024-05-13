import { insertDynamicExtension, registerChainDataExtension } from '@paima/db';
import type { SQLUpdate } from '@paima/db';
import type { CdeDynamicPrimitiveDatum } from './types.js';
import { ChainDataExtensionType } from '@paima/utils';
import YAML from 'yaml';

export default async function processDatum(
  cdeDatum: CdeDynamicPrimitiveDatum,
  _inPresync: boolean,
  reloadExtensions: () => void
): Promise<SQLUpdate[]> {
  const config = {
    name: cdeDatum.cdeName,
    type: 'erc721',
    contractAddress: cdeDatum.payload.contractAddress,
    startBlockHeight: cdeDatum.blockNumber + 1,
    scheduledPrefix: cdeDatum.scheduledPrefix,
    network: cdeDatum.network,
  };

  const updateList: SQLUpdate[] = [
    [
      registerChainDataExtension,
      {
        cde_type: ChainDataExtensionType.ERC721,
        cde_name: cdeDatum.cdeName,
        start_blockheight: cdeDatum.blockNumber + 1,
        scheduled_prefix: cdeDatum.scheduledPrefix,
      },
    ],
    [
      insertDynamicExtension,
      {
        config: YAML.stringify(config),
      },
    ],
  ];

  reloadExtensions();

  return updateList;
}
