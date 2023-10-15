import type { EventData } from '@paima/utils';
import { ChainDataExtensionDatumType, DEFAULT_FUNNEL_TIMEOUT, timeout } from '@paima/utils';
import type {
  CdeGenericDatum,
  ChainDataExtensionDatum,
  ChainDataExtensionGeneric,
} from '@paima/runtime';

export default async function getCdeData(
  extension: ChainDataExtensionGeneric,
  fromBlock: number,
  toBlock: number
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
  return events.map(e => eventToCdeDatum(e, extension));
}

function eventToCdeDatum(event: EventData, extension: ChainDataExtensionGeneric): CdeGenericDatum {
  return {
    cdeId: extension.cdeId,
    cdeDatumType: ChainDataExtensionDatumType.Generic,
    blockNumber: event.blockNumber,
    scheduledPrefix: extension.scheduledPrefix,
    payload: event.returnValues,
  };
}
