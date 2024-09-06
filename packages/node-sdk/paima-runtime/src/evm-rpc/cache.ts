import type { JsonRpcEngine } from '@metamask/json-rpc-engine';
import { createAsyncMiddleware } from '@metamask/json-rpc-engine';
import { ENV } from '@paima/utils';

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

export function registerCacheMiddleware(engine: JsonRpcEngine): void {
  engine.push(
    createAsyncMiddleware(async (req, res, next) => {
      // remove the ID from the cache
      // otherwise, identical queries with different IDs lead to wasted CPU
      // different IDs happens more often with different users, but it could also be the same client spamming
      const { id: _, ...rest } = req;
      const stringifiedReq = JSON.stringify(rest);

      const cacheEntry = getResultFromCache(stringifiedReq);
      if (cacheEntry == null) {
        await next(); // note: rely on this `next` call to fill res.result
        insertIntoCache(stringifiedReq, res.result);
      } else {
        res.result = cacheEntry.val;
      }
    })
  );
}
