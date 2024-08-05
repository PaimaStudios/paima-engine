import { JsonRpcEngine, createAsyncMiddleware } from '@metamask/json-rpc-engine';
import {
  InternalRpcError,
  MethodNotFoundRpcError,
  MethodNotSupportedRpcError,
  type EIP1193Parameters,
  type PublicRpcSchema,
} from 'viem';
import { getPaimaNodeRestClient } from '@paima/mw-core';
import { ENV } from '@paima/utils';

export const evmRpcEngine = new JsonRpcEngine();

// TODO: implement cache
function isCached(req: any): boolean {
  return false;
}
function insertIntoCache(res: any, cb: any): void {
  return;
}
function getResultFromCache(req: any): any {
  return;
}

evmRpcEngine.push(
  createAsyncMiddleware(async (req, res, next) => {
    if (!isCached(req)) {
      await next();
      insertIntoCache(req, res);
    } else {
      res.result = getResultFromCache(req);
    }
  })
);

type EvmRpcReturn<Method extends string> = Extract<
  PublicRpcSchema[number],
  { Method: Method }
>['ReturnType'];

evmRpcEngine.push(
  createAsyncMiddleware(async (req, res, next) => {
    const evmRpc: typeof req & EIP1193Parameters<PublicRpcSchema> = req as any;

    const setResult = <Method extends string>(result: EvmRpcReturn<Method>): void => {
      res.result = result as any;
    };

    // TODO: missing these validity checks:
    // - ParseRpcError
    // - InvalidRequestRpcError
    // - InvalidInputRpcError / InvalidParamsRpcError
    switch (evmRpc.method) {
      /*
       * ==============
       * Gossip methods
       * ==============
       */
      case 'eth_blockNumber': {
        const { data, error } = await getPaimaNodeRestClient().GET('/latest_processed_blockheight');
        if (error != null) {
          res.error = new InternalRpcError(error);
        }

        setResult<typeof evmRpc.method>(`0x${data.block_height.toString(16)}`);
        return;
      }
      // case 'eth_sendRawTransaction': {
      //   setResult<typeof evmRpc.method>();
      //   return;
      // }

      /**
       * =============
       * State methods
       * =============
       */

      // case 'eth_getBalance': {
      //   setResult<typeof evmRpc.method>();
      //   return;
      // }
      case 'eth_getTransactionCount': {
        const address = evmRpc.params[0];
        const blockHeight = (() => {
          const blockParam = evmRpc.params[1];
          if (typeof blockParam === 'string') {
            return blockParam.startsWith('0x') ? Number.parseInt(blockParam, 16) : undefined;
          }
          if ('blockNumber' in blockParam) {
            return Number.parseInt(blockParam.blockNumber, 16);
          }
          // TODO
          throw new MethodNotSupportedRpcError(new Error(`Block hash RPC currently unsupported`));
        })();
        const { data, error } = await getPaimaNodeRestClient().GET('/transaction_count/address', {
          params: { query: { blockHeight, address } },
        });
        if (error != null) {
          res.error = new InternalRpcError(error);
          return;
        }
        if (data.success === false) {
          res.error = new InternalRpcError(new Error(data.errorMessage));
          return;
        }
        setResult<typeof evmRpc.method>(
          `0x${(data.result.scheduledData + data.result.gameInputs).toString(16)}`
        );
        return;
      }
      case 'eth_estimateGas': {
        setResult<typeof evmRpc.method>(`0x0`);
        return;
      }

      /**
       * ===============
       * History methods
       * ===============
       */

      // case 'eth_getBlockTransactionCountByHash': {
      //   // TODO: add this once we have block hashes in Paima
      //   setResult<typeof evmRpc.method>(`0x0`);
      //   return;
      // }
      case 'eth_getBlockTransactionCountByNumber': {
        const blockHeight = evmRpc.params[0].startsWith('0x')
          ? Number.parseInt(evmRpc.params[0], 16)
          : undefined;
        const { data, error } = await getPaimaNodeRestClient().GET(
          '/transaction_count/blockHeight',
          {
            params: { query: { blockHeight } },
          }
        );
        if (error != null) {
          res.error = new InternalRpcError(error);
          return;
        }
        if (data.success === false) {
          res.error = new InternalRpcError(new Error(data.errorMessage));
          return;
        }
        setResult<typeof evmRpc.method>(
          `0x${(data.result.scheduledData + data.result.gameInputs).toString(16)}`
        );
        return;
      }
      case 'eth_getUncleCountByBlockHash': {
        setResult<typeof evmRpc.method>(`0x0`); // no uncles in Paima
        return;
      }
      case 'eth_getUncleCountByBlockNumber': {
        setResult<typeof evmRpc.method>(`0x0`); // no uncles in Paima
        return;
      }
      // case 'eth_getBlockByHash': {
      //   // TODO
      //   setResult<typeof evmRpc.method>(`0x0`);
      //   return;
      // }
      // case 'eth_getBlockByNumber': {
      //   // TODO
      //   setResult<typeof evmRpc.method>(`0x0`);
      //   return;
      // }
      // case 'eth_getTransactionByHash': {
      //   // TODO
      //   setResult<typeof evmRpc.method>(`0x0`);
      //   return;
      // }
      // case 'eth_getTransactionByBlockHashAndIndex': {
      //   // TODO
      //   setResult<typeof evmRpc.method>(`0x0`);
      //   return;
      // }
      // case 'eth_getTransactionByBlockNumberAndIndex': {
      //   // TODO
      //   setResult<typeof evmRpc.method>(`0x0`);
      //   return;
      // }
      // case 'eth_getTransactionReceipt': {
      //   setResult<typeof evmRpc.method>(`0x0`);
      //   return;
      // }
      case 'eth_getUncleByBlockHashAndIndex': {
        setResult<typeof evmRpc.method>(null); // no uncles in Paima
        return;
      }
      case 'eth_getUncleByBlockNumberAndIndex': {
        setResult<typeof evmRpc.method>(null); // no uncles in Paima
        return;
      }

      /**
       * ===============
       * Other methods
       * ===============
       */

      case 'eth_chainId': {
        setResult<typeof evmRpc.method>(`0x${ENV.CHAIN_ID.toString(16)}`);
        return;
      }

      default: {
        // TODO: MethodNotSupportedRpcError
        res.error = new MethodNotFoundRpcError(new Error(), { method: evmRpc.method });
      }
    }
  })
);
