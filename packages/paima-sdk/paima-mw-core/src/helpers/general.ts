import { getWeb3 } from '../state.js';

export async function getBlockNumber(): Promise<number> {
  return await getWeb3().then(web3 => web3.eth.getBlockNumber());
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
