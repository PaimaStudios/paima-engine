import type Web3 from 'web3';

import { ChainDataExtensionType, getErc721Contract } from '@paima/utils';
import type { ChainDataExtension, ChainDataExtensionDatum } from '@paima/utils';
import type { Transfer } from '@paima/utils/src/contract-types/ERC721Contract';

export default async function getCdeData(
  web3: Web3,
  extension: ChainDataExtension,
  fromBlock: number,
  toBlock: number
): Promise<ChainDataExtensionDatum[]> {
  const contract = getErc721Contract(extension.contractAddress, web3);
  const events = (await contract.getPastEvents('Transfer', {
    fromBlock: fromBlock,
    toBlock: toBlock,
  })) as unknown as Transfer[];
  return events.map((e: Transfer) => transferToCdeDatum(e, extension.cdeId));
}

function transferToCdeDatum(event: Transfer, cdeId: number): ChainDataExtensionDatum {
  return {
    cdeId: cdeId,
    cdeType: ChainDataExtensionType.ERC721,
    blockNumber: event.blockNumber,
    payload: {
      from: event.returnValues.from,
      to: event.returnValues.to,
      tokenId: event.returnValues.tokenId,
    },
  };
}
