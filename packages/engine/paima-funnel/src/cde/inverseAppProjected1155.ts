import { ChainDataExtensionDatumType, DEFAULT_FUNNEL_TIMEOUT, timeout } from '@paima/utils';
import type {
  CdeInverseAppProjected1155MintDatum,
  CdeInverseAppProjected1155TransferDatum,
  ChainDataExtensionDatum,
  ChainDataExtensionInverseAppProjected1155,
} from '@paima/sm';
import type {
  InverseAppProjected1155Minted as Minted,
  InverseAppProjected1155TransferSingle as TransferSingle,
  InverseAppProjected1155TransferBatch as TransferBatch,
} from '@paima/utils';

export default async function getCdeInverseAppProjected1155Data(
  extension: ChainDataExtensionInverseAppProjected1155,
  fromBlock: number,
  toBlock: number,
  network: string
): Promise<ChainDataExtensionDatum[]> {
  // TOOD: typechain is missing the proper type generation for getPastEvents
  // https://github.com/dethcrypto/TypeChain/issues/767
  const mintEvents = (await timeout(
    extension.contract.getPastEvents('Minted', {
      fromBlock,
      toBlock,
    }),
    DEFAULT_FUNNEL_TIMEOUT
  )) as unknown as Minted[];
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
    ...mintEvents.map(e => mintToDatum(e, extension, network)),
    ...transferSingleEvents.map(e => transferSingleToDatum(e, extension, network)),
    ...transferBatchEvents.flatMap(e => transferBatchToDatums(e, extension, network)),
  ];
}

function mintToDatum(
  event: Minted,
  extension: ChainDataExtensionInverseAppProjected1155,
  network: string
): CdeInverseAppProjected1155MintDatum {
  return {
    cdeId: extension.cdeId,
    cdeDatumType: ChainDataExtensionDatumType.InverseAppProjected1155Mint,
    blockNumber: event.blockNumber,
    payload: {
      tokenId: event.returnValues.tokenId,
      minter: event.returnValues.minter.toLowerCase(),
      userTokenId: event.returnValues.userTokenId.toLowerCase(),
      value: event.returnValues.value, // amount
    },
    contractAddress: extension.contractAddress,
    mintScheduledPrefix: extension.mintScheduledPrefix,
    network,
  };
}

function transferSingleToDatum(
  event: TransferSingle,
  extension: ChainDataExtensionInverseAppProjected1155,
  network: string
): CdeInverseAppProjected1155TransferDatum {
  return {
    cdeId: extension.cdeId,
    cdeDatumType: ChainDataExtensionDatumType.InverseAppProjected1155Transfer,
    blockNumber: event.blockNumber,
    payload: {
      operator: event.returnValues.operator,
      from: event.returnValues.from,
      to: event.returnValues.to,
      id: event.returnValues.id,
      value: event.returnValues.value,
    },
    contractAddress: extension.contractAddress,
    transferScheduledPrefix: extension.transferScheduledPrefix,
    network,
  };
}

function transferBatchToDatums(
  event: TransferBatch,
  extension: ChainDataExtensionInverseAppProjected1155,
  network: string
): CdeInverseAppProjected1155TransferDatum[] {
  // NOTE: assumes that ids and values have the same length
  const result: CdeInverseAppProjected1155TransferDatum[] = [];
  for (let i = 0; i < event.returnValues.ids.length; ++i) {
    result.push({
      cdeId: extension.cdeId,
      cdeDatumType: ChainDataExtensionDatumType.InverseAppProjected1155Transfer,
      blockNumber: event.blockNumber,
      payload: {
        operator: event.returnValues.operator,
        from: event.returnValues.from,
        to: event.returnValues.to,
        id: event.returnValues.ids[i],
        value: event.returnValues.values[i],
      },
      contractAddress: extension.contractAddress,
      transferScheduledPrefix: extension.transferScheduledPrefix,
      network,
    });
  }
  return result;
}
