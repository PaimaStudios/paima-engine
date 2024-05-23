import { insertDynamicExtension, registerDynamicChainDataExtension } from '@paima/db';
import type { SQLUpdate } from '@paima/db';
import { CdeEntryTypeName, type CdeDynamicEvmPrimitiveDatum } from './types.js';
import { ChainDataExtensionType, DYNAMIC_PRIMITIVE_NAME_SEPARATOR } from '@paima/utils';

export default async function processDatum(
  cdeDatum: CdeDynamicEvmPrimitiveDatum,
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
    type: cdeDatum.payload.type,
    contractAddress: cdeDatum.payload.contractAddress,
    startBlockHeight: cdeDatum.blockNumber,
    scheduledPrefix: cdeDatum.scheduledPrefix,
    burnScheduledPrefix: cdeDatum.burnScheduledPrefix,
    network: cdeDatum.network,
  };

  const baseName = `${cdeDatum.cdeName}${DYNAMIC_PRIMITIVE_NAME_SEPARATOR}`;

  const updateList: SQLUpdate[] = [
    [
      registerDynamicChainDataExtension,
      {
        base_name: baseName,
        cde_type: type,
        start_blockheight: cdeDatum.blockNumber,
        scheduled_prefix: cdeDatum.scheduledPrefix,
      },
    ],
    [
      insertDynamicExtension,
      {
        base_name: baseName,
        parent_name: cdeDatum.cdeName,
        config: JSON.stringify(config),
      },
    ],
  ];

  return updateList;
}
