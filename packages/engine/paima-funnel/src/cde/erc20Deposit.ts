import { ChainDataExtensionDatumType, timeout } from '@paima/utils';
import type { ChainDataExtensionDatum, ChainDataExtensionErc20Deposit } from '@paima/sm';
import type { ERC20Transfer as Transfer } from '@paima/utils';
import { DEFAULT_FUNNEL_TIMEOUT } from '@paima/utils';

export default async function getCdeData(
  extension: ChainDataExtensionErc20Deposit,
  fromBlock: number,
  toBlock: number,
  network: string
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
  return events.map((e: Transfer) => transferToCdeDatum(e, extension, network)).flat();
}

function transferToCdeDatum(
  event: Transfer,
  extension: ChainDataExtensionErc20Deposit,
  network: string
): ChainDataExtensionDatum[] {
  if (event.returnValues.to.toLowerCase() !== extension.depositAddress) {
    return [];
  }
  return [
    {
      cdeName: extension.cdeName,
      cdeDatumType: ChainDataExtensionDatumType.ERC20Deposit,
      blockNumber: event.blockNumber,
      payload: {
        from: event.returnValues.from.toLowerCase(),
        value: event.returnValues.value,
      },
      scheduledPrefix: extension.scheduledPrefix,
      network,
    },
  ];
}
