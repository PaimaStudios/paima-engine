import { ConfigNetworkType, GlobalConfig } from '@paima/utils';
import { getWeb3 } from '../state.js';
import assertNever from 'assert-never';

export async function getBlockNumber(): Promise<number> {
  const config = await GlobalConfig.mainConfig();
  const networkType = config[1].type;
  switch (networkType) {
    case ConfigNetworkType.EVM:
      return await getWeb3().then(web3 => web3.eth.getBlockNumber());
    case ConfigNetworkType.AVAIL_MAIN:
      // FIXME: this code is duplicated, but not sure what's the best common place to put it
      const responseRaw = await fetch(`${config[1].lightClient}/v2/status`);

      if (responseRaw.status !== 200) {
        throw new Error("Couldn't get light client status");
      }

      const response: { blocks: { available: { first: number; last: number } } } =
        await responseRaw.json();

      const last = response.blocks.available.last;

      return last;
    default:
      assertNever(networkType);
  }
}

export async function postDataToEndpoint(uri: string, data: string): Promise<Response> {
  return await fetch(uri, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: data,
  });
}
