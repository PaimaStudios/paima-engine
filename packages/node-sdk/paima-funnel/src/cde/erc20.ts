import { ChainDataExtensionDatumType, timeout } from '@paima/utils';
import type {
  CdeErc20TransferDatum,
  ChainDataExtensionErc20,
  EvmChainDataExtensionDatum,
} from '@paima/sm';
import type { ERC20Transfer } from '@paima/utils';
import { DEFAULT_FUNNEL_TIMEOUT } from '@paima/utils';

export default async function getCdeData(
  extension: ChainDataExtensionErc20,
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
  )) as unknown as ERC20Transfer[];
  return events.map((e: ERC20Transfer) =>
    transferToCdeDatum(e, extension.cdeName, caip2, e.address)
  );
}

function transferToCdeDatum(
  event: ERC20Transfer,
  cdeName: string,
  caip2: string,
  contractAddress: string
): CdeErc20TransferDatum {
  return {
    cdeName: cdeName,
    cdeDatumType: ChainDataExtensionDatumType.ERC20Transfer,
    blockNumber: event.blockNumber,
    transactionHash: event.transactionHash,
    payload: {
      from: event.returnValues.from.toLowerCase(),
      to: event.returnValues.to.toLowerCase(),
      value: event.returnValues.value,
    },
    contractAddress,
    caip2,
    logIndex: event.logIndex,
  };
}
