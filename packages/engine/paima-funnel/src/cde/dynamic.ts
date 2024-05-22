import type { ChainDataExtensionDynamicEvmPrimitive, ChainDataExtensionDatum } from '@paima/sm';
import { ChainDataExtensionDatumType, DEFAULT_FUNNEL_TIMEOUT, timeout } from '@paima/utils';

export default async function getCdeDynamicEvmPrimitive(
  extension: ChainDataExtensionDynamicEvmPrimitive,
  fromBlock: number,
  toBlock: number,
  network: string
): Promise<ChainDataExtensionDatum[]> {
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

  return events.map(event => ({
    cdeName: extension.cdeName,
    cdeDatumType: ChainDataExtensionDatumType.DynamicEvmPrimitive,
    blockNumber: event.blockNumber,
    payload: {
      contractAddress: event.returnValues[extension.dynamicFields.contractAddress],
      type: extension.targetConfig.type,
    },
    network,
    scheduledPrefix: extension.targetConfig.scheduledPrefix,
    burnScheduledPrefix: extension.targetConfig.burnScheduledPrefix,
  }));
}
