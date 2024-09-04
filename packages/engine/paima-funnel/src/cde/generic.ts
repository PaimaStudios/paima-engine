import type { EventData } from '@paima/utils';
import { ChainDataExtensionDatumType, DEFAULT_FUNNEL_TIMEOUT, timeout } from '@paima/utils';
import type {
  CdeGenericDatum,
  ChainDataExtensionDatum,
  ChainDataExtensionGeneric,
} from '@paima/sm';

export default async function getCdeData(
  extension: ChainDataExtensionGeneric,
  fromBlock: number,
  toBlock: number,
  caip2: string
): Promise<ChainDataExtensionDatum[]> {
  // TOOD: typechain is missing the proper type generation for getPastEvents
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
  return events.map(e => eventToCdeDatum(e, extension, caip2));
}

function eventToCdeDatum(
  event: EventData,
  extension: ChainDataExtensionGeneric,
  caip2: string
): CdeGenericDatum {
  return {
    cdeName: extension.cdeName,
    cdeDatumType: ChainDataExtensionDatumType.Generic,
    blockNumber: event.blockNumber,
    transactionHash: event.transactionHash,
    scheduledPrefix: extension.scheduledPrefix,
    payload: event.returnValues,
    contractAddress: event.address,
    caip2,
  };
}
