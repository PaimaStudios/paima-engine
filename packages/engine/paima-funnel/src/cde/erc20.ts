import { ChainDataExtensionDatumType, timeout } from '@paima/utils';
import type {
  CdeErc20TransferDatum,
  ChainDataExtensionDatum,
  ChainDataExtensionErc20,
} from '@paima/sm';
import type { ERC20Transfer } from '@paima/utils';
import { DEFAULT_FUNNEL_TIMEOUT } from '@paima/utils';

export default async function getCdeData(
  extension: ChainDataExtensionErc20,
  fromBlock: number,
  toBlock: number,
  network: string
): Promise<ChainDataExtensionDatum[]> {
  // TOOD: typechain is missing the proper type generation for getPastEvents
  // https://github.com/dethcrypto/TypeChain/issues/767
  const events = (await timeout(
    extension.contract.getPastEvents('Transfer', {
      fromBlock: fromBlock,
      toBlock: toBlock,
    }),
    DEFAULT_FUNNEL_TIMEOUT
  )) as unknown as ERC20Transfer[];
  return events.map((e: ERC20Transfer) => transferToCdeDatum(e, extension.cdeId, network));
}

function transferToCdeDatum(
  event: ERC20Transfer,
  cdeId: number,
  network: string
): CdeErc20TransferDatum {
  return {
    cdeId: cdeId,
    cdeDatumType: ChainDataExtensionDatumType.ERC20Transfer,
    blockNumber: event.blockNumber,
    transactionHash: event.transactionHash,
    payload: {
      from: event.returnValues.from.toLowerCase(),
      to: event.returnValues.to.toLowerCase(),
      value: event.returnValues.value,
    },
    network,
  };
}
