import type Web3 from 'web3';

import { ChainDataExtensionType, timeout } from '@paima/utils';
import type { ChainDataExtensionDatum, ChainDataExtensionErc20 } from '@paima/runtime';
import type { Transfer } from '@paima/utils/src/contract-types/ERC20Contract';
import { DEFAULT_FUNNEL_TIMEOUT } from '@paima/utils';

export default async function getCdeData(
  web3: Web3,
  extension: ChainDataExtensionErc20,
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
  return events.map((e: Transfer) => transferToCdeDatum(e, extension.cdeId));
}

function transferToCdeDatum(event: Transfer, cdeId: number): ChainDataExtensionDatum {
  return {
    cdeId: cdeId,
    cdeType: ChainDataExtensionType.ERC20,
    blockNumber: event.blockNumber,
    payload: {
      from: event.returnValues.from,
      to: event.returnValues.to,
      value: event.returnValues.value,
    },
  };
}
