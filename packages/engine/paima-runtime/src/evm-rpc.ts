import { JsonRpcEngine, createAsyncMiddleware } from '@metamask/json-rpc-engine';
import type { JsonRpcParams, JsonRpcRequest } from '@metamask/utils';
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

/**
 * ==============
 * Cache handling
 * ==============
 */

/**
 * Any JSON-compatible value.
 */
export type Json =
  | null
  | boolean
  | number
  | string
  | Json[]
  | {
      [prop: string]: Json;
    };

/** turn the RPC request into a string for easy comparison. We want to do this only once and reuse it */
type StringifiedJsonRpcRequest = string;
type CacheKey = StringifiedJsonRpcRequest;
type CacheValue = { val: undefined | Json; time: number };
type RequestCache = Record<CacheKey, CacheValue>;

const requestCache: RequestCache = {};

/**
 * Cache for half a block instead of a full block
 * Otherwise, if the cache is close to the block boundary, you could be missing entire blocks
 *
 * ex:
 *     - assume we're starting at block A
 *     - assume BLOCK_TIME = 10
 *     cache A occurs at timestamp 0
 *     block B happens at timestamp 1
 *     cache A invalidated at timestamp 10
 *     block C happens at timestamp 11
 * In this example, there was only a very small interval where B data was actually queryable since it was quickly replaced with C
 */
const cacheLength = (ENV.BLOCK_TIME * 1000) / 2;

function insertIntoCache(req: CacheKey, val: undefined | Json): void {
  requestCache[req] = {
    val,
    time: new Date().getTime(),
  };
}

function cacheCleanup(): void {
  const currTime = new Date().getTime();
  for (const key of Object.keys(requestCache)) {
    if (requestCache[key].time < currTime - cacheLength) {
      delete requestCache[key];
    }
  }
}
setInterval(cacheCleanup, cacheLength);

function getResultFromCache(req: CacheKey): undefined | CacheValue {
  return requestCache[req];
}

// cache middleware
evmRpcEngine.push(
  createAsyncMiddleware(async (req, res, next) => {
    const stringifiedReq = JSON.stringify(req);
    const cacheEntry = getResultFromCache(stringifiedReq);
    if (cacheEntry == null) {
      await next(); // note: rely on this `next` call to fill res.result
      insertIntoCache(stringifiedReq, res.result);
    } else {
      res.result = cacheEntry.val;
    }
  })
);

type EvmRpcReturn<Method extends string> = Extract<
  PublicRpcSchema[number],
  { Method: Method }
>['ReturnType'];

/**
 * ===============================
 * JSON-RPC Middleware definitions
 * ===============================
 */

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
