import { ChainDataExtensionDynamicPrimitive } from '@paima/sm';
import type { ChainDataExtensionDatum } from '@paima/sm';
import { ChainDataExtensionDatumType, DEFAULT_FUNNEL_TIMEOUT, timeout } from '@paima/utils';

export default async function getCdeDynamicPrimitive(
  extension: ChainDataExtensionDynamicPrimitive,
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
    cdeId: extension.cdeId,
    cdeDatumType: ChainDataExtensionDatumType.DynamicPrimitive,
    blockNumber: event.blockNumber,
    payload: {
      contractAddress:
        // TODO: change the name of this (or make this more generic)
        event.returnValues.value,
    },
    network,
    scheduledPrefix: extension.scheduledPrefix,
    cdeName: '',
  }));
}
