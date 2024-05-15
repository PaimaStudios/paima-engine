import { insertDynamicExtension, registerChainDataExtension } from '@paima/db';
import type { SQLUpdate } from '@paima/db';
import { CdeEntryTypeName, type CdeDynamicPrimitiveDatum } from './types.js';
import { ChainDataExtensionType } from '@paima/utils';
import YAML from 'yaml';

export default async function processDatum(
  cdeDatum: CdeDynamicPrimitiveDatum,
  _inPresync: boolean
): Promise<SQLUpdate[]> {
  let type;
  switch (cdeDatum.payload.type) {
    case CdeEntryTypeName.ERC721:
      type = ChainDataExtensionType.ERC721;
      break;
    default:
      throw new Error(`Unsupported dynamic primitive type: ${cdeDatum.payload.type}`);
  }

  const config = {
    name: cdeDatum.cdeName,
    type: cdeDatum.payload.type,
    contractAddress: cdeDatum.payload.contractAddress,
    startBlockHeight: cdeDatum.blockNumber,
    scheduledPrefix: cdeDatum.scheduledPrefix,
    network: cdeDatum.network,
  };

  const updateList: SQLUpdate[] = [
    [
      registerChainDataExtension,
      {
        cde_type: type,
        cde_name: cdeDatum.cdeName,
        start_blockheight: cdeDatum.blockNumber,
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

  return updateList;
}
