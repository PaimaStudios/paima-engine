import { ChainDataExtensionDatumType, DEFAULT_FUNNEL_TIMEOUT, timeout } from '@paima/utils';
import type {
  CdeErc1155TransferDatum,
  ChainDataExtensionDatum,
  ChainDataExtensionErc1155,
} from '@paima/sm';
import type {
  Erc1155TransferSingle as TransferSingle,
  Erc1155TransferBatch as TransferBatch,
} from '@paima/utils';

export default async function getCdeErc1155Data(
  extension: ChainDataExtensionErc1155,
  fromBlock: number,
  toBlock: number,
  network: string
): Promise<ChainDataExtensionDatum[]> {
  // TODO: typechain is missing the proper type generation for getPastEvents
  // https://github.com/dethcrypto/TypeChain/issues/767
  const transferSingleEvents = (await timeout(
    extension.contract.getPastEvents('TransferSingle', {
      fromBlock,
      toBlock,
    }),
    DEFAULT_FUNNEL_TIMEOUT
  )) as unknown as TransferSingle[];
  const transferBatchEvents = (await timeout(
    extension.contract.getPastEvents('TransferBatch', {
      fromBlock,
      toBlock,
    }),
    DEFAULT_FUNNEL_TIMEOUT
  )) as unknown as TransferBatch[];

  return [
    ...transferSingleEvents.map(e => transferSingleToDatum(e, extension, network)),
    ...transferBatchEvents.map(e => transferBatchToDatum(e, extension, network)),
  ];
}

function transferSingleToDatum(
  event: TransferSingle,
  extension: ChainDataExtensionErc1155,
  network: string
): CdeErc1155TransferDatum {
  return {
    cdeId: extension.cdeId,
    cdeDatumType: ChainDataExtensionDatumType.Erc1155Transfer,
    blockNumber: event.blockNumber,
    transactionHash: event.transactionHash,
    payload: {
      operator: event.returnValues.operator,
      from: event.returnValues.from,
      to: event.returnValues.to,
      // single->array conversion here
      ids: [event.returnValues.id],
      values: [event.returnValues.value],
    },
    contractAddress: extension.contractAddress,
    scheduledPrefix: extension.scheduledPrefix,
    burnScheduledPrefix: extension.burnScheduledPrefix,
    network,
  };
}

function transferBatchToDatum(
  event: TransferBatch,
  extension: ChainDataExtensionErc1155,
  network: string
): CdeErc1155TransferDatum {
  return {
    cdeId: extension.cdeId,
    cdeDatumType: ChainDataExtensionDatumType.Erc1155Transfer,
    blockNumber: event.blockNumber,
    transactionHash: event.transactionHash,
    payload: {
      operator: event.returnValues.operator,
      from: event.returnValues.from,
      to: event.returnValues.to,
      ids: event.returnValues.ids,
      values: event.returnValues.values,
    },
    contractAddress: extension.contractAddress,
    scheduledPrefix: extension.scheduledPrefix,
    burnScheduledPrefix: extension.burnScheduledPrefix,
    network,
  };
}
