import { ChainDataExtensionDatumType, timeout } from '@paima/utils';
import type {
  CdeErc20TransferDatum,
  ChainDataExtensionDatum,
  ChainDataExtensionErc20,
} from '@paima/runtime';
import type { Transfer } from '@paima/utils/src/contract-types/ERC20Contract.js';
import { DEFAULT_FUNNEL_TIMEOUT } from '@paima/utils';

export default async function getCdeData(
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

function transferToCdeDatum(event: Transfer, cdeId: number): CdeErc20TransferDatum {
  return {
    cdeId: cdeId,
    cdeDatumType: ChainDataExtensionDatumType.ERC20Transfer,
    blockNumber: event.blockNumber,
    payload: {
      from: event.returnValues.from.toLowerCase(),
      to: event.returnValues.to.toLowerCase(),
      value: event.returnValues.value,
    },
  };
}
