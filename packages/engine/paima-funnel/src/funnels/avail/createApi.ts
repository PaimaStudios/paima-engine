import { doLog } from '@paima/utils';
import type { ApiPromise } from 'avail-js-sdk';
import { initialize, isConnected } from 'avail-js-sdk';

export async function createApi(apiUrl: string): Promise<ApiPromise> {
  const api = await initialize(apiUrl);

  const [chain, nodeName, nodeVersion] = await Promise.all([
    api.rpc.system.chain(),
    api.rpc.system.name(),
    api.rpc.system.version(),
  ]);

  doLog(
    `Connected to chain ${chain} using ${nodeName} and node version ${nodeVersion} - is connected: ${isConnected()}`
  );

  return api;
}
