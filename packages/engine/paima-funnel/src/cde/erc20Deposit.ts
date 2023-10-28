import { ChainDataExtensionDatumType, timeout } from '@paima/utils';
import type { ChainDataExtensionDatum, ChainDataExtensionErc20Deposit } from '@paima/runtime';
import type { Transfer } from '@paima/utils/src/contract-types/ERC20Contract';
import { DEFAULT_FUNNEL_TIMEOUT } from '@paima/utils';

export default async function getCdeData(
  extension: ChainDataExtensionErc20Deposit,
  fromBlock: number,
  toBlock: number
): Promise<ChainDataExtensionDatum[]> {
  // TOOD: typechain is missing the proper type generation for getPastEvents
  // https://github.com/dethcrypto/TypeChain/issues/767
  const events = (await timeout(
    extension.contract.getPastEvents('Transfer', {
      filter: { to: extension.depositAddress.toLowerCase() },
      fromBlock: fromBlock,
      toBlock: toBlock,
    }),
    DEFAULT_FUNNEL_TIMEOUT
  )) as unknown as Transfer[];
  return events.map((e: Transfer) => transferToCdeDatum(e, extension)).flat();
}

function transferToCdeDatum(
  event: Transfer,
  extension: ChainDataExtensionErc20Deposit
): ChainDataExtensionDatum[] {
  if (event.returnValues.to.toLowerCase() !== extension.depositAddress) {
    return [];
  }
  return [
    {
      cdeId: extension.cdeId,
      cdeDatumType: ChainDataExtensionDatumType.ERC20Deposit,
      blockNumber: event.blockNumber,
      payload: {
        from: event.returnValues.from.toLowerCase(),
        value: event.returnValues.value,
      },
      scheduledPrefix: extension.scheduledPrefix,
    },
  ];
}
