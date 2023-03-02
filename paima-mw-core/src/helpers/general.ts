import { getWeb3 } from '../state';
import { Deployment } from '../types';

export function getBlockTime(deployment: Deployment): number {
  if (deployment === 'C1') return 4;
  else if (deployment === 'A1') return 4.5;
  else throw new Error(`[getBlockTime] unsupported deployment: ${deployment}`);
}

export async function getBlockNumber(): Promise<number> {
  return getWeb3().then(web3 => web3.eth.getBlockNumber());
}

export async function postDataToEndpoint(uri: string, data: string): Promise<Response> {
  return fetch(uri, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: data,
  });
}
