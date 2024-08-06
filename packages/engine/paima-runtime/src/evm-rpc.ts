import { JsonRpcEngine, createAsyncMiddleware } from '@metamask/json-rpc-engine';
import type { JsonRpcParams, JsonRpcRequest } from '@metamask/utils';
import {
  BlockTag,
  InternalRpcError,
  MethodNotFoundRpcError,
  MethodNotSupportedRpcError,
  RpcBlock,
  RpcTransaction,
  RpcTransactionReceipt,
  type EIP1193Parameters,
  type PublicRpcSchema,
} from 'viem';
import { getPaimaNodeRestClient } from '@paima/mw-core';
import { ENV } from '@paima/utils';
import { keccak_256 } from 'js-sha3';

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

type PaimaEvmRpcSchema = [
  ...PublicRpcSchema,
  {
    Method: 'eth_syncing';
    Parameters?: undefined;
    /**
     * different EVM clients return different values for this
     * but the two seemingly common fields are
     * - startingBlock
     * - currentBlock
     */
    ReturnType: boolean | { startingBlock: `0x${string}`; currentBlock: `0x${string}` };
  },
];

type EvmRpcReturn<Method extends string> = Extract<
  PaimaEvmRpcSchema[number],
  { Method: Method }
>['ReturnType'];

/**
 * ===============================
 * JSON-RPC Middleware definitions
 * ===============================
 */

function parseBlock<T>(block: BlockTag | T): undefined | T {
  // Paima doesn't support non-finalized blocks, so all these cases are the same
  if (block === 'latest' || block === 'pending' || block === 'safe' || block === 'finalized') {
    return undefined;
  }
  // we just let `undefined` mean the entire history
  if (block === 'earliest') {
    return undefined;
  }
  return block;
}

/**
 * We can't truly provide this for a few reasons:
 * 1. Transactions aren't guaranteed to be on Ethereum (could be from a non-EVM chain)
 * 2. Even on Ethereum, Paima txs aren't guaranteed to be from an EOA accounts
 *    i.e. it could be a game tick, it could be an internal tx (EVM internal txs are regular txs in Paima), etc.
 *
 * TODO: we could decide to add this for historical_game_inputs for EVM chains if we really want to
 */
const mockEvmEcdsaSignature = {
  /** ECDSA signature r */
  r: '0x0',
  /** ECDSA signature s */
  s: '0x0',
  /**
   * ECDSA recovery ID
   * note: replaced by yParity if type != 0x0
   */
  v: '0x0',
} as const;

/**
 * Gas specified before tx lands onchain (as part of the tx input given by the user)
 * Note: no concept of gas on Paima
 */
const mockTxGasPre = {
  gas: '0x0',
  gasPrice: '0x0',
  // TODO: some other gas fields needed if we ever use type != 0x0
} as const;
/**
 * Gas specified after tx lands onchain (after calculating how much gas is consumed in reality)
 * Note: no concept of gas on Paima
 */
const mockTxGasPost = {
  gasUsed: '0x0',
  effectiveGasPrice: '0x0',
  cumulativeGasUsed: '0x0',
} as const;
/**
 * Gas consumed for a block
 * Note: no concept of gas on Paima
 */
const mockBlockGas = {
  gasLimit: '0x0',
  gasUsed: '0x0',
} as const;

/**
 * There is no concept of recipients in Paima since txs are to the state machine
 * TODO: there are some cases where, after processing the STF, we could determine if this tx was *to* a specific address
 *       or conversely, make that the STF fails if the state transition doesn't match some asserted *to* address
 *       so we could support some limited form of this if needed
 */
const mockTxRecipient = {
  to: '0x0',
} as const;

/**
 * EVM has multiple tx types
 * - 0x0 for legacy transactions
 * - 0x1 for access list types
 * - 0x2 for dynamic fees
 *
 * Not all chains use 0x2, so it's not clear which we should use for mock data in Paima
 * Note: making this an ENV var doesn't make sense either since it's not something the node can know ahead of time
 *       since it depends on which tool is making the RPC query, not the node itself
 * We pick 0x0 for best chance at compatibility
 *
 * Note: if we change this to something other than 0x0, we also have to
 * 1. change `v` to `yParity` in the signature
 * 2. change the gas fields
 */
const mockTxType = {
  type: '0x0',
} as const;

/**
 * Theoretically we could implement this in Paima, but it takes time to calculate and basically 0 dApps and tools use this
 * In fact, it's being set to empty-string with an EIP from 2024
 * https://github.com/ethereum/EIPs/blob/master/EIPS/eip-7668.md
 */
const mockLogBloom = {
  // TODO: unclear how this should be handled post-7668, but I assume `0x0` is the right approach
  // https://github.com/wevm/viem/pull/2587
  logsBloom: '0x0',
} as const;

/**
 * This is non-null when the transaction created a new contract
 * However, Paima doesn't support creating new contracts on the L2 side, so it's always null
 * Note: you could argue that maybe we might want this in a few cases:
 *       1. Dynamic primitives (so this would be the address in an underlying chain)
 *       2. Dynamically creating new precompiles
 */
const mockContractAddress = {
  contractAddress: null,
} as const;

/**
 * No concept of miners in Paima (it's a based rollup) nor PoW
 */
const mockMiner = {
  miner: '0x0',
  mixHash: '0x0',
  /** note: `nonce` here isn't a transaction nonce, but rather a nonce for PoW */
  nonce: '0x0',
  difficulty: '0x0',
  totalDifficulty: '0x0',
} as const;

/**
 * No concept of uncles in Paima as we only consider finalized blocks
 */
const mockUncles = {
  sha3Uncles: '0x0',
  uncles: [],
} as const;

/**
 * Paima, similar to other chains like Solana, does not Merklize state for performance reasons
 * TODO: we could expose this as an ENV var if we really want/need to
 */
const mockRoots = {
  transactionsRoot: '0x0',
  stateRoot: '0x0',
  receiptsRoot: '0x0',
};

/**
 * This has no purpose in Ethereum, but block creators can stuff whatever they want in here
 * No similar concept in Paima, but we could introduce a similar concept in theory when submitting to the L2 contract
 */
const mockExtraData = {
  extraData: '0x0',
};

const mockBlockHash = '0x0'; // TODO: do not mock this once we have block hashes in Paima

evmRpcEngine.push(
  createAsyncMiddleware(async (req, res, next) => {
    const evmRpc: typeof req & EIP1193Parameters<PaimaEvmRpcSchema> = req as any;

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
      case 'eth_sendRawTransaction': {
        // TODO: we can probably support this
        //       but supporting this conversion would have to be a Paima-level feature and not a EVM-RPC feature
        res.error = new MethodNotSupportedRpcError(
          new Error(`${evmRpc.method} currently unsupported`)
        );
        return;
      }

      /**
       * =============
       * State methods
       * =============
       */

      case 'eth_getBalance': {
        // TODO: support this eventually somehow
        res.error = new MethodNotSupportedRpcError(
          new Error(`${evmRpc.method} currently unsupported`)
        );
        return;
      }
      case 'eth_getStorageAt': {
        // not possible in Paima Engine at the moment, but maybe in the future related to precompiles
        res.error = new MethodNotSupportedRpcError(
          new Error(`${evmRpc.method} currently unsupported`)
        );
        return;
      }
      case 'eth_getTransactionCount': {
        const address = evmRpc.params[0];
        const blockHeight = (() => {
          const blockParam = parseBlock(evmRpc.params[1]);
          if (blockParam == null) return undefined;
          if (typeof blockParam === 'string') return Number.parseInt(blockParam, 16);
          if ('blockNumber' in blockParam) return Number.parseInt(blockParam.blockNumber, 16);
          // TODO: block hash support. See `mockBlockHash`
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
      case 'eth_getCode': {
        // not possible in Paima Engine at the moment, but maybe in the future related to precompiles
        res.error = new MethodNotSupportedRpcError(
          new Error(`${evmRpc.method} currently unsupported`)
        );
        return;
      }
      case 'eth_call': {
        // not possible in Paima Engine at the moment, but maybe in the future related to precompiles
        res.error = new MethodNotSupportedRpcError(
          new Error(`${evmRpc.method} currently unsupported`)
        );
        return;
      }
      case 'eth_estimateGas': {
        // no concept of gas in Paima (gas is from the underlying chain)
        setResult<typeof evmRpc.method>(`0x0`);
        return;
      }

      /**
       * ===============
       * History methods
       * ===============
       */

      case 'eth_getBlockTransactionCountByHash': {
        // TODO: add this once we have block hashes in Paima. See `mockBlockHash`
        res.error = new MethodNotSupportedRpcError(
          new Error(`${evmRpc.method} currently unsupported`)
        );
        return;
      }
      case 'eth_getBlockTransactionCountByNumber': {
        const blockParam = parseBlock(evmRpc.params[0]);
        const blockHeight = blockParam == null ? undefined : Number.parseInt(evmRpc.params[0], 16);
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
      case 'eth_getBlockByHash': {
        // TODO: add this once we have block hashes in Paima
        res.error = new MethodNotSupportedRpcError(
          new Error(`${evmRpc.method} currently unsupported`)
        );
        return;
      }
      case 'eth_getBlockByNumber': {
        // TODO

        // scheduled_data(block_height, input_data)
        // getScheduledDataByBlockHeight

        // problem: removeScheduledData, removeAllScheduledDataByInputData, deleteScheduled
        // maybe: SELECT block_height FROM cde_tracking

        // findNonce

        // SELECT * FROM historical_game_inputs WHERE block_height = :block_height!
        // SELECT * FROM block_heights

        // emulated_block_heights vs
        const mock: RpcBlock = {
          number: '0x1b4',
          hash: mockBlockHash, // TODO
          parentHash: mockBlockHash, // TODO

          timestamp: '0x55ba467c',
          size: '0x220',

          transactions: [
            // TODO
          ],

          ...mockExtraData,
          ...mockRoots,
          ...mockUncles,
          ...mockMiner,
          ...mockBlockGas,
          ...mockLogBloom,
        };
        setResult<typeof evmRpc.method>(mock);
        return;
      }
      case 'eth_getTransactionByHash': {
        // TODO
        const mock: RpcTransaction = {
          blockHash: mockBlockHash, // TODO
          blockNumber: '0x0', // TODO
          hash: '0x0', // TODO
          input: '0x0', // TODO
          transactionIndex: '0x0', // TODO
          value: '0x0', // TODO
          from: '0x0', // TODO
          nonce: '0x0', // TODO
          ...mockTxType,
          ...mockTxRecipient,
          ...mockTxGasPre,
          ...mockEvmEcdsaSignature,
        };
        setResult<typeof evmRpc.method>(mock);
        return;
      }
      case 'eth_getTransactionByBlockHashAndIndex': {
        // TODO: add this once we have block hashes in Paima. See `mockBlockHash`
        res.error = new MethodNotSupportedRpcError(
          new Error(`${evmRpc.method} currently unsupported`)
        );
        return;
      }
      case 'eth_getTransactionByBlockNumberAndIndex': {
        const blockParam = parseBlock(evmRpc.params[0]);
        const blockHeight = blockParam == null ? undefined : Number.parseInt(evmRpc.params[0], 16);
        const index = Number.parseInt(evmRpc.params[1], 16);

        const mock: RpcTransaction = {
          blockHash: mockBlockHash, // TODO
          blockNumber: '0x0', // TODO
          hash: '0x0', // TODO
          input: '0x0', // TODO
          transactionIndex: '0x0', // TODO
          value: '0x0', // TODO
          from: '0x0', // TODO
          nonce: '0x0', // TODO
          ...mockTxType,
          ...mockTxRecipient,
          ...mockTxGasPre,
          ...mockEvmEcdsaSignature,
        };
        setResult<typeof evmRpc.method>(mock);
        return;
      }
      case 'eth_getTransactionReceipt': {
        const txHash = evmRpc.params[0];

        // TODO once we have tx hash in the db
        res.error = new MethodNotSupportedRpcError(
          new Error(`${evmRpc.method} currently unsupported`)
        );
        return;

        const mock: RpcTransactionReceipt = {
          transactionHash: '0x0', // TODO
          blockHash: mockBlockHash, // TODO
          blockNumber: '0x0', // TODO
          transactionIndex: '0x0', // TODO
          from: '0x0', // TODO
          logs: [], // TODO
          status: '0x1', // no failed txs in Paima
          ...mockContractAddress,
          ...mockTxGasPost,
          ...mockTxRecipient,
          ...mockTxType,
          ...mockLogBloom,
        };
        setResult<typeof evmRpc.method>(mock);
        return;
      }
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

      case 'web3_clientVersion': {
        // TODO: should include the following
        // 1: commit hash commit hash somehow
        // 2: platform
        // 3: node version
        // example of Geth: Geth/v1.9.15-stable-0f77f34b/linux-amd64/go1.14.4"
        // we just keep it simple for now
        setResult<typeof evmRpc.method>(`PaimaEngine/v${ENV.GAME_NODE_VERSION}`);
        return;
      }
      case 'web3_sha3': {
        // web3_sha3 passes the data as a hex-string, so we need to convert it
        const hexString = evmRpc.params[0].substring('0x'.length);
        const buffer = Buffer.from(hexString, 'hex');

        setResult<typeof evmRpc.method>(`0x${keccak_256(buffer)}`);
        return;
      }
      case 'net_version': {
        // net_version is an older version of eth_chainId that predates the ETC hardfork
        // eth_chainId should always be used instead, but net_version===eth_chainId in almost all networks
        // the only real notable exception being ETC where these values are not equal
        // learn more: https://medium.com/@pedrouid/chainid-vs-networkid-how-do-they-differ-on-ethereum-eec2ed41635b
        setResult<typeof evmRpc.method>(`0x${ENV.CHAIN_ID.toString(16)}`);
        return;
      }
      case 'net_listening': {
        // note: depending on your interpretation,
        //       this should one of
        //       A) always return true (is the server online at all)
        //       B) Only return true if this RPC should be used by others (is one RPC better than another)
        //       C) Can you sync blocks from connecting to this node
        //       ex: in wagmi, it's used to rank multiple RPCs and it prioritizes RPCs that return true
        setResult<typeof evmRpc.method>(true); // maybe this should be ENV.SERVER_ONLY_MODE
        return;
      }
      case 'net_peerCount': {
        // todo: theoretically we could support this based on MQTT connections or something similar, but it's not worth it
        setResult<typeof evmRpc.method>(`0x0`);
        return;
      }
      case 'eth_gasPrice': {
        // no concept of gas in Paima (gas is from the underlying chain)
        setResult<typeof evmRpc.method>(`0x0`);
        return;
      }
      case 'eth_chainId': {
        // TODO: this is not a great thing to return, since every game is its own chain. Not sure what to do about this
        //       maybe the hash of the game name or something?
        setResult<typeof evmRpc.method>(`0x${ENV.CHAIN_ID.toString(16)}`);
        return;
      }

      case 'eth_syncing': {
        if (ENV.SERVER_ONLY_MODE) {
          setResult<typeof evmRpc.method>(false);
        }
        const { data, error } = await getPaimaNodeRestClient().GET('/latest_processed_blockheight');
        if (error != null) {
          res.error = new InternalRpcError(error);
        }
        setResult<typeof evmRpc.method>({
          startingBlock: `0x${ENV.START_BLOCKHEIGHT.toString(16)}`,
          currentBlock: `0x${data.block_height.toString(16)}`,
        });
        return;
      }

      default: {
        res.error = new MethodNotFoundRpcError(new Error(), { method: evmRpc.method });
      }
    }
  })
);
