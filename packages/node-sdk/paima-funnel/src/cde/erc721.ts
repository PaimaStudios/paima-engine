import { ChainDataExtensionDatumType, DEFAULT_FUNNEL_TIMEOUT, timeout } from '@paima/utils';
import type {
  CdeErc721MintDatum,
  CdeErc721TransferDatum,
  ChainDataExtensionErc721,
  EvmChainDataExtensionDatum,
} from '@paima/sm';
import type { ERC721Transfer as Transfer } from '@paima/utils';

export default async function getCdeData(
  extension: ChainDataExtensionErc721,
  fromBlock: number,
  toBlock: number,
  caip2: string
): Promise<EvmChainDataExtensionDatum[]> {
  // TOOD: typechain is missing the proper type generation for getPastEvents
  // https://github.com/dethcrypto/TypeChain/issues/767
  const events = (await timeout(
    extension.contract.getPastEvents('Transfer', {
      fromBlock: fromBlock,
      toBlock: toBlock,
    }),
    DEFAULT_FUNNEL_TIMEOUT
  )) as unknown as Transfer[];
  return events.map((e: Transfer) => transferToCdeData(e, extension, caip2)).flat();
}

function transferToTransferDatum(
  event: Transfer,
  extension: ChainDataExtensionErc721,
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
    burnScheduledPrefix: extension.burnScheduledPrefix,
    caip2,
    logIndex: event.logIndex,
  };
}

function transferToMintDatum(
  event: Transfer,
  extension: ChainDataExtensionErc721,
  caip2: string
): CdeErc721MintDatum {
  return {
    cdeName: extension.cdeName,
    cdeDatumType: ChainDataExtensionDatumType.ERC721Mint,
    blockNumber: event.blockNumber,
    transactionHash: event.transactionHash,
    payload: {
      tokenId: event.returnValues.tokenId,
      mintData: '',
      from: event.returnValues.from,
    },
    contractAddress: event.address.toLowerCase(),
    scheduledPrefix: extension.scheduledPrefix,
    caip2,
    logIndex: event.logIndex,
  };
}

function transferToCdeData(
  event: Transfer,
  extension: ChainDataExtensionErc721,
  caip2: string
): (CdeErc721TransferDatum | CdeErc721MintDatum)[] {
  const transferDatum = transferToTransferDatum(event, extension, caip2);
  const fromAddr = event.returnValues.from;
  if (fromAddr.match(/^0x0+$/g)) {
    const mintDatum = transferToMintDatum(event, extension, caip2);
    return [mintDatum, transferDatum];
  } else {
    return [transferDatum];
  }
}
