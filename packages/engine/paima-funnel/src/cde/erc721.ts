import { ChainDataExtensionDatumType, DEFAULT_FUNNEL_TIMEOUT, timeout } from '@paima/utils';
import type {
  CdeErc721MintDatum,
  CdeErc721TransferDatum,
  ChainDataExtensionDatum,
  ChainDataExtensionErc721,
} from '@paima/sm';
import type { ERC721Transfer as Transfer } from '@paima/utils';

export default async function getCdeData(
  extension: ChainDataExtensionErc721,
  fromBlock: number,
  toBlock: number,
  network: string
): Promise<ChainDataExtensionDatum[]> {
  // TOOD: typechain is missing the proper type generation for getPastEvents
  // https://github.com/dethcrypto/TypeChain/issues/767
  const events = (await timeout(
    extension.contract.getPastEvents('Transfer', {
      fromBlock:
        extension.dynamic && extension.startBlockHeight == fromBlock ? fromBlock - 1 : fromBlock,
      toBlock: toBlock,
    }),
    DEFAULT_FUNNEL_TIMEOUT
  )) as unknown as Transfer[];
  return events.map((e: Transfer) => transferToCdeData(e, extension, network, fromBlock)).flat();
}

function transferToTransferDatum(
  event: Transfer,
  extension: ChainDataExtensionErc721,
  network: string,
  fromBlock: number
): CdeErc721TransferDatum {
  return {
    cdeId: extension.cdeId,
    cdeDatumType: ChainDataExtensionDatumType.ERC721Transfer,
    blockNumber: event.blockNumber === fromBlock - 1 ? fromBlock : event.blockNumber,
    payload: {
      from: event.returnValues.from.toLowerCase(),
      to: event.returnValues.to.toLowerCase(),
      tokenId: event.returnValues.tokenId,
    },
    burnScheduledPrefix: extension.burnScheduledPrefix,
    network,
  };
}

function transferToMintDatum(
  event: Transfer,
  extension: ChainDataExtensionErc721,
  network: string,
  fromBlock: number
): CdeErc721MintDatum {
  return {
    cdeId: extension.cdeId,
    cdeDatumType: ChainDataExtensionDatumType.ERC721Mint,
    blockNumber: event.blockNumber === fromBlock - 1 ? fromBlock : event.blockNumber,
    payload: {
      tokenId: event.returnValues.tokenId,
      mintData: '',
    },
    contractAddress: extension.contractAddress,
    scheduledPrefix: extension.scheduledPrefix,
    network,
  };
}

function transferToCdeData(
  event: Transfer,
  extension: ChainDataExtensionErc721,
  network: string,
  fromBlock: number
): ChainDataExtensionDatum[] {
  const transferDatum = transferToTransferDatum(event, extension, network, fromBlock);
  const fromAddr = event.returnValues.from;
  if (fromAddr.match(/^0x0+$/g)) {
    const mintDatum = transferToMintDatum(event, extension, network, fromBlock);
    return [mintDatum, transferDatum];
  } else {
    return [transferDatum];
  }
}
