import { ChainDataExtensionDatumType, DEFAULT_FUNNEL_TIMEOUT, timeout } from '@paima/utils';
import type {
  CdeErc721MintDatum,
  CdeErc721TransferDatum,
  ChainDataExtensionDatum,
  ChainDataExtensionErc721,
} from '@paima/runtime';
import type { Transfer } from '@paima/utils/src/contract-types/ERC721Contract';

export default async function getCdeData(
  extension: ChainDataExtensionErc721,
  fromBlock: number,
  toBlock: number
): Promise<ChainDataExtensionDatum[]> {
  // TOOD: typechain is missing the proper type generation for getPastEvents
  // https://github.com/dethcrypto/TypeChain/issues/767
  const events = (await timeout(
    extension.contract.getPastEvents('Transfer', {
      fromBlock: fromBlock,
      toBlock: toBlock,
    }),
    DEFAULT_FUNNEL_TIMEOUT
  )) as unknown as Transfer[];
  return events.map((e: Transfer) => transferToCdeData(e, extension)).flat();
}

function transferToTransferDatum(
  event: Transfer,
  extension: ChainDataExtensionErc721
): CdeErc721TransferDatum {
  return {
    cdeId: extension.cdeId,
    cdeDatumType: ChainDataExtensionDatumType.ERC721Transfer,
    blockNumber: event.blockNumber,
    payload: {
      from: event.returnValues.from.toLowerCase(),
      to: event.returnValues.to.toLowerCase(),
      tokenId: event.returnValues.tokenId,
    },
  };
}

function transferToMintDatum(
  event: Transfer,
  extension: ChainDataExtensionErc721
): CdeErc721MintDatum {
  return {
    cdeId: extension.cdeId,
    cdeDatumType: ChainDataExtensionDatumType.ERC721Mint,
    blockNumber: event.blockNumber,
    payload: {
      tokenId: event.returnValues.tokenId,
      mintData: '',
    },
    contractAddress: extension.contractAddress,
    initializationPrefix: extension.initializationPrefix,
  };
}

function transferToCdeData(
  event: Transfer,
  extension: ChainDataExtensionErc721
): ChainDataExtensionDatum[] {
  const transferDatum = transferToTransferDatum(event, extension);
  const fromAddr = event.returnValues.from;
  if (fromAddr.match(/^0x0+$/g)) {
    const mintDatum = transferToMintDatum(event, extension);
    return [mintDatum, transferDatum];
  } else {
    return [transferDatum];
  }
}
