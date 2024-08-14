import { ChainDataExtensionDatumType, DEFAULT_FUNNEL_TIMEOUT, timeout } from '@paima/utils';
import type {
  CdeBatcherPaymentDatum,
  ChainDataExtensionBatcherPayment,
  ChainDataExtensionDatum,
} from '@paima/sm';
import type { BatcherPaymentEvent } from '@paima/utils';

export default async function getCdeData(
  extension: ChainDataExtensionBatcherPayment,
  fromBlock: number,
  toBlock: number,
  network: string
): Promise<ChainDataExtensionDatum[]> {
  // TOOD: typechain is missing the proper type generation for getPastEvents
  // https://github.com/dethcrypto/TypeChain/issues/767
  const paymentPromise: Promise<BatcherPaymentEvent[]> = extension.contract.getPastEvents(
    'Payment',
    {
      fromBlock: fromBlock,
      toBlock: toBlock,
    }
  ) as unknown as Promise<BatcherPaymentEvent[]>;
  const events = await timeout(paymentPromise, DEFAULT_FUNNEL_TIMEOUT);
  return events.map((e: BatcherPaymentEvent) => transferToCdeData(e, extension, network)).flat();
}

function transferToCdeData(
  event: BatcherPaymentEvent,
  extension: ChainDataExtensionBatcherPayment,
  network: string
): ChainDataExtensionDatum[] {
  const data: CdeBatcherPaymentDatum[] = [
    {
      cdeName: extension.cdeName,
      cdeDatumType: ChainDataExtensionDatumType.BatcherPayment,
      blockNumber: event.blockNumber,
      transactionHash: event.transactionHash,
      payload: {
        batcherAddress: event.returnValues.batcherAddress.toLowerCase(),
        userAddress: event.returnValues.userAddress.toLowerCase(),
        value: event.returnValues.value,
      },
      network,
    },
  ];
  return data;
}
