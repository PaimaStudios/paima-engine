import {
  ChainDataExtensionDatumType,
  DEFAULT_FUNNEL_TIMEOUT,
  mergeSortedArrays,
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
  network: string
): Promise<ChainDataExtensionDatum[]> {
  // TOOD: typechain is missing the proper type generation for getPastEvents
  // https://github.com/dethcrypto/TypeChain/issues/767
  const [transferEvents, mintedEvents] = await Promise.all([
    fetchTransferEvents(extension, fromBlock, toBlock),
    fetchMintedEvents(extension, fromBlock, toBlock),
  ]);
  const transferData = transferEvents.map((e: Transfer) =>
    transferToTransferDatum(e, extension, network)
  );
  const mintData = mintedEvents.map((e: Minted) => mintedToMintDatum(e, extension, network));
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
  network: string
): CdeErc721TransferDatum {
  return {
    cdeName: extension.cdeName,
    cdeDatumType: ChainDataExtensionDatumType.ERC721Transfer,
    blockNumber: event.blockNumber,
    payload: {
      from: event.returnValues.from.toLowerCase(),
      to: event.returnValues.to.toLowerCase(),
      tokenId: event.returnValues.tokenId,
    },
    network,
  };
}

function mintedToMintDatum(
  event: Minted,
  extension: ChainDataExtensionPaimaErc721,
  network: string
): CdeErc721MintDatum {
  return {
    cdeName: extension.cdeName,
    cdeDatumType: ChainDataExtensionDatumType.ERC721Mint,
    blockNumber: event.blockNumber,
    payload: {
      tokenId: event.returnValues.tokenId,
      mintData: event.returnValues.initialData,
    },
    contractAddress: extension.contractAddress,
    scheduledPrefix: extension.scheduledPrefix,
    network,
  };
}
