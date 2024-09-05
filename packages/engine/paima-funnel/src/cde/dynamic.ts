import {
  type ChainDataExtensionDynamicEvmPrimitive,
  CdeEntryTypeName,
  type CdeDynamicEvmPrimitiveDatum,
} from '@paima/sm';
import { ChainDataExtensionDatumType, DEFAULT_FUNNEL_TIMEOUT, timeout } from '@paima/utils';

export default async function getCdeDynamicEvmPrimitive(
  extension: ChainDataExtensionDynamicEvmPrimitive,
  fromBlock: number,
  toBlock: number,
  caip2: string
): Promise<CdeDynamicEvmPrimitiveDatum[]> {
  // TODO: typechain is missing the proper type generation for getPastEvents
  // https://github.com/dethcrypto/TypeChain/issues/767
  const events = await timeout(
    extension.contract.getPastEvents(extension.eventName, {
      filter: {
        topics: [extension.eventSignatureHash],
      },
      fromBlock: fromBlock,
      toBlock: toBlock,
    }),
    DEFAULT_FUNNEL_TIMEOUT
  );

  let targetConfig;
  switch (extension.targetConfig.type) {
    case CdeEntryTypeName.ERC721:
      targetConfig = {
        type: extension.targetConfig.type,
        scheduledPrefix: extension.targetConfig.scheduledPrefix,
        burnScheduledPrefix: extension.targetConfig.burnScheduledPrefix,
      };
      break;
    case CdeEntryTypeName.Generic:
      targetConfig = {
        type: extension.targetConfig.type,
        scheduledPrefix: extension.targetConfig.scheduledPrefix,
        abiPath: extension.targetConfig.abiPath,
        eventSignature: extension.targetConfig.eventSignature,
      };
      break;
  }

  return events.map(event => ({
    cdeName: extension.cdeName,
    cdeDatumType: ChainDataExtensionDatumType.DynamicEvmPrimitive,
    blockNumber: event.blockNumber,
    payload: {
      contractAddress: event.returnValues[extension.dynamicFields.contractAddress.toLowerCase()].toLowerCase(),
      targetConfig: targetConfig,
    },
    caip2,
    transactionHash: event.transactionHash,
  }));
}
