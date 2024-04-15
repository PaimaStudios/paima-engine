import { ChainDataExtensionDatumType, DEFAULT_FUNNEL_TIMEOUT, timeout } from '@paima/utils';
import type {
  CdeInverseAppProjected1155MintDatum,
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
  network: string,
): Promise<ChainDataExtensionDatum[]> {
  // TOOD: typechain is missing the proper type generation for getPastEvents
  // https://github.com/dethcrypto/TypeChain/issues/767
  const mintEvents = (await timeout(
    extension.contract.getPastEvents('Minted', {
      fromBlock: fromBlock,
      toBlock: toBlock,
    }),
    DEFAULT_FUNNEL_TIMEOUT
  )) as unknown as Minted[];

  return mintEvents.map(e => mintToDatum(e, extension, network)).flat();
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
    scheduledPrefix: extension.scheduledPrefix,
    network,
  };
}
