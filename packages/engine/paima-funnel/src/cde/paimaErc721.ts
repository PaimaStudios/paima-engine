import {
  ChainDataExtensionDatumType,
  DEFAULT_FUNNEL_TIMEOUT,
  mergeSortedArrays,
  SCHEDULED_DATA_ADDRESS,
  timeout,
} from '@paima/utils';
import type {
  CdeErc721MintDatum,
  CdeErc721TransferDatum,
  ChainDataExtensionDatum,
  ChainDataExtensionPaimaErc721,
} from '@paima/sm';
import type { PaimaMinted as Minted, PaimaERC721Transfer as Transfer } from '@paima/utils';

export default async function getCdeData(
  extension: ChainDataExtensionPaimaErc721,
  fromBlock: number,
  toBlock: number,
  caip2: string
): Promise<ChainDataExtensionDatum[]> {
  // TOOD: typechain is missing the proper type generation for getPastEvents
  // https://github.com/dethcrypto/TypeChain/issues/767
  const [transferEvents, mintedEvents] = await Promise.all([
    fetchTransferEvents(extension, fromBlock, toBlock),
    fetchMintedEvents(extension, fromBlock, toBlock),
  ]);
  const transferData = transferEvents.map((e: Transfer) =>
    transferToTransferDatum(e, extension, caip2)
  );
  const mintData = mintedEvents.map((e: Minted) => mintedToMintDatum(e, extension, caip2));
  return mergeSortedArrays<ChainDataExtensionDatum>(
    mintData,
    transferData,
    (d1, d2) => d1.blockNumber - d2.blockNumber
  );
}

async function fetchTransferEvents(
  extension: ChainDataExtensionPaimaErc721,
  fromBlock: number,
  toBlock: number
): Promise<Transfer[]> {
  return (await timeout(
    extension.contract.getPastEvents('Transfer', {
      fromBlock: fromBlock,
      toBlock: toBlock,
    }),
    DEFAULT_FUNNEL_TIMEOUT
  )) as unknown as Transfer[];
}

async function fetchMintedEvents(
  extension: ChainDataExtensionPaimaErc721,
  fromBlock: number,
  toBlock: number
): Promise<Minted[]> {
  return (await timeout(
    extension.contract.getPastEvents('Minted', {
      fromBlock: fromBlock,
      toBlock: toBlock,
    }),
    DEFAULT_FUNNEL_TIMEOUT
  )) as unknown as Minted[];
}

function transferToTransferDatum(
  event: Transfer,
  extension: ChainDataExtensionPaimaErc721,
  caip2: string
): CdeErc721TransferDatum {
  return {
    cdeName: extension.cdeName,
    cdeDatumType: ChainDataExtensionDatumType.ERC721Transfer,
    blockNumber: event.blockNumber,
    transactionHash: event.transactionHash,
    payload: {
      from: event.returnValues.from.toLowerCase(),
      to: event.returnValues.to.toLowerCase(),
      tokenId: event.returnValues.tokenId,
    },
    contractAddress: event.address.toLowerCase(),
    caip2,
  };
}

function mintedToMintDatum(
  event: Minted,
  extension: ChainDataExtensionPaimaErc721,
  caip2: string
): CdeErc721MintDatum {
  return {
    cdeName: extension.cdeName,
    cdeDatumType: ChainDataExtensionDatumType.ERC721Mint,
    blockNumber: event.blockNumber,
    transactionHash: event.transactionHash,
    payload: {
      tokenId: event.returnValues.tokenId,
      mintData: event.returnValues.initialData,
      // TODO: not sure what to do about this
      //       the "from"/"to" addresses are not included in this event
      //       and only included in the companion Transfer event
      from: SCHEDULED_DATA_ADDRESS,
    },
    contractAddress: event.address.toLowerCase(),
    scheduledPrefix: extension.scheduledPrefix,
    caip2,
  };
}
