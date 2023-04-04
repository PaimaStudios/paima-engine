import type Web3 from 'web3';

import { ChainDataExtensionType } from '@paima/utils';
import type { ChainDataExtensionDatum, InstantiatedChainDataExtension } from '@paima/utils';
import type { Transfer } from '@paima/utils/src/contract-types/ERC721Contract';

export default async function getCdeData(
  web3: Web3,
  extension: InstantiatedChainDataExtension,
  fromBlock: number,
  toBlock: number
): Promise<ChainDataExtensionDatum[]> {
  // TOOD: typechain is missing the proper type generation for getPastEvents
  // https://github.com/dethcrypto/TypeChain/issues/767
  const events = (await extension.contract.getPastEvents('Transfer', {
    fromBlock: fromBlock,
    toBlock: toBlock,
  })) as unknown as Transfer[];
  return events.map((e: Transfer) => transferToCdeDatum(e, extension));
}

function transferToCdeDatum(
  event: Transfer,
  extension: InstantiatedChainDataExtension
): ChainDataExtensionDatum {
  return {
    cdeId: extension.cdeId,
    cdeType: ChainDataExtensionType.ERC721,
    blockNumber: event.blockNumber,
    payload: {
      from: event.returnValues.from,
      to: event.returnValues.to,
      tokenId: event.returnValues.tokenId,
    },
    contractAddress: extension.contractAddress,
    initializationPrefix: extension.initializationPrefix,
  };
}
