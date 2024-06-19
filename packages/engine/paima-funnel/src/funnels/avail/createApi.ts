import { doLog } from '@paima/utils';
import type { ApiPromise } from 'avail-js-sdk';
import { initialize, isConnected } from 'avail-js-sdk';

const apis: Record<string, { api: ApiPromise | null; promise: Promise<void> | null }> = {};

export async function createApi(apiUrl: string): Promise<ApiPromise> {
  if (!apis[apiUrl]) {
    apis[apiUrl] = { api: null, promise: null };
  }

  if (!apis[apiUrl].promise) {
    apis[apiUrl].promise = initialize(apiUrl, { isPedantic: false, noInitWarn: false }).then(
      async rapi => {
        if (!apis[apiUrl].api) {
          apis[apiUrl].api = rapi;

          const [chain, nodeName, nodeVersion] = await Promise.all([
            apis[apiUrl].api!.rpc.system.chain(),
            apis[apiUrl].api!.rpc.system.name(),
            apis[apiUrl].api!.rpc.system.version(),
          ]);

          doLog(
            `Connected to chain ${chain} using ${nodeName} and node version ${nodeVersion} - is connected: ${isConnected()}`
          );
        }
        return;
      }
    );
  }

  await apis[apiUrl].promise;

  return apis[apiUrl].api!;
}
