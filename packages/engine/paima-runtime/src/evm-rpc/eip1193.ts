import { JsonRpcEngine, createAsyncMiddleware } from '@metamask/json-rpc-engine';
import {
  InternalRpcError,
  prepareEncodeFunctionData,
  encodeFunctionData,
  stringToHex,
  isAddress,
} from 'viem';
import type { RpcTransaction, EIP1193Parameters, RpcError } from 'viem';
import { getPaimaNodeRestClient } from '@paima/mw-core';
import { ENV } from '@paima/utils';
import { keccak_256 } from 'js-sha3';
import { registerCacheMiddleware } from './cache.js';
import type { EvmRpcReturn, PaimaEvmRpcSchema } from './types.js';
import {
  createInternalRpcError,
  createInvalidParamsError,
  createMethodNotFoundRpcError,
  createMethodNotSupportedRpcError,
  isValidHexadecimal,
  isValidTxHash,
  toBlockNumber,
} from './validate.js';
import {
  mockBlockHash,
  mockEvmEcdsaSignature,
  mockTxGasPre,
  mockTxRecipient,
  mockTxType,
} from './mock.js';

export const evmRpcEngine = new JsonRpcEngine();
registerCacheMiddleware(evmRpcEngine);

/**
 * ===============================
 * JSON-RPC Middleware definitions
 * ===============================
 */

// https://github.com/wevm/viem/issues/2591
const constInputData = prepareEncodeFunctionData({
  abi: [
    {
      inputs: [{ internalType: 'string', name: 'input', type: 'string' }],
      name: 'convertedPaimaData',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
  ],
});

evmRpcEngine.push(
  createAsyncMiddleware(async (req, res) => {
    const evmRpc: typeof req & EIP1193Parameters<PaimaEvmRpcSchema> = req as any;

    const setResult = <Method extends string>(result: EvmRpcReturn<Method>): void => {
      res.result = result as any;
    };

    // TODO: missing these validity checks:
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
          res.error = createInternalRpcError({}, error?.errorMessage);
          return;
        }

        setResult<typeof evmRpc.method>(`0x${data.block_height.toString(16)}`);
        return;
      }
      case 'eth_sendRawTransaction': {
        // TODO: we can probably support this
        //       but supporting this conversion would have to be a Paima-level feature and not a EVM-RPC feature
        res.error = createMethodNotSupportedRpcError(
          evmRpc.method,
          `${evmRpc.method} currently unsupported`
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
        res.error = createMethodNotSupportedRpcError(
          evmRpc.method,
          `${evmRpc.method} currently unsupported`
        );
        return;
      }
      case 'eth_getStorageAt': {
        // not possible in Paima Engine at the moment, but maybe in the future related to precompiles
        res.error = createMethodNotSupportedRpcError(
          evmRpc.method,
          `${evmRpc.method} currently unsupported`
        );
        return;
      }
      case 'eth_getTransactionCount': {
        const address = evmRpc.params[0];
        if (!isAddress(address)) {
          res.error = createInvalidParamsError(
            { address },
            `Address is not a valid Ethereum address`
          );
          return;
        }
        let blockHeight: number;
        try {
          blockHeight = await toBlockNumber(evmRpc.params[1] ?? 'finalized');
        } catch (err) {
          res.error = err as RpcError;
          return;
        }
        const { data, error } = await getPaimaNodeRestClient().GET('/transaction_count/address', {
          params: { query: { blockHeight, address } },
        });
        if (error != null) {
          res.error = createInternalRpcError({}, error?.errorMessage);
          return;
        }
        if (data.success === false) {
          res.error = createInternalRpcError({}, data.errorMessage);
          return;
        }
        setResult<typeof evmRpc.method>(
          `0x${(data.result.scheduledData + data.result.gameInputs).toString(16)}`
        );
        return;
      }
      case 'eth_getCode': {
        // not possible in Paima Engine at the moment, but maybe in the future related to precompiles
        res.error = createMethodNotSupportedRpcError(
          evmRpc.method,
          `${evmRpc.method} currently unsupported`
        );
        return;
      }
      case 'eth_call': {
        // not possible in Paima Engine at the moment, but maybe in the future related to precompiles
        res.error = createMethodNotSupportedRpcError(
          evmRpc.method,
          `${evmRpc.method} currently unsupported`
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
        res.error = createMethodNotSupportedRpcError(
          evmRpc.method,
          `${evmRpc.method} currently unsupported`
        );
        return;
      }
      case 'eth_getBlockTransactionCountByNumber': {
        let blockHeight: number;
        try {
          blockHeight = await toBlockNumber(evmRpc.params[0] ?? 'finalized');
        } catch (err) {
          res.error = err as RpcError;
          return;
        }
        const { data, error } = await getPaimaNodeRestClient().GET(
          '/transaction_count/blockHeight',
          {
            params: { query: { blockHeight } },
          }
        );
        if (error != null) {
          res.error = createInternalRpcError({}, error?.errorMessage);
          return;
        }
        if (data.success === false) {
          res.error = createInternalRpcError({}, data.errorMessage);
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
        res.error = createMethodNotSupportedRpcError(
          evmRpc.method,
          `${evmRpc.method} currently unsupported`
        );
        return;
      }
      case 'eth_getBlockByNumber': {
        let blockHeight: number;
        try {
          blockHeight = await toBlockNumber(evmRpc.params[0] ?? 'finalized');
        } catch (err) {
          res.error = err as RpcError;
          return;
        }
        const transactionDetails = evmRpc.params[1];
        if (typeof transactionDetails !== 'boolean') {
          res.error = createInvalidParamsError(
            { transactionDetails },
            `Transaction details must be specified as a boolean`
          );
          return;
        }

        res.error = createMethodNotSupportedRpcError(
          evmRpc.method,
          `${evmRpc.method} currently unsupported`
        );
        return;

        // const mock: RpcBlock = {
        //   number: '0x0', // TODO
        //   hash: mockBlockHash, // TODO
        //   parentHash: mockBlockHash, // TODO

        //   timestamp: '0x0', // TODO
        //   size: '0x0', // TODO: do we really need this? I doubt it

        //   transactions: [
        //     // TODO
        //   ],

        //   ...mockExtraData,
        //   ...mockRoots,
        //   ...mockUncles,
        //   ...mockMiner,
        //   ...mockBlockGas,
        //   ...mockLogBloom,
        // };
        // setResult<typeof evmRpc.method>(mock);
        // return;
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
        res.error = createMethodNotSupportedRpcError(
          evmRpc.method,
          `${evmRpc.method} currently unsupported`
        );
        return;
      }
      case 'eth_getTransactionByBlockNumberAndIndex': {
        let blockHeight: number;
        try {
          blockHeight = await toBlockNumber(evmRpc.params[0]);
        } catch (err) {
          res.error = err as RpcError;
          return;
        }
        const txIndex = Number.parseInt(evmRpc.params[1], 16);
        if (typeof txIndex !== 'number') {
          res.error = createInvalidParamsError(
            { txIndex },
            `Transaction index must be specified as a number`
          );
          return;
        }

        const { data, error } = await getPaimaNodeRestClient().GET(
          '/transaction_content/blockNumberAndIndex',
          { params: { query: { blockHeight, txIndex } } }
        );
        if (error != null) {
          res.error = createInternalRpcError({}, error?.errorMessage);
          return;
        }
        if (data.success === false) {
          res.error = createInternalRpcError({}, data.errorMessage);
          return;
        }

        const hexMsg = stringToHex(data.result.inputData);
        /**
         * Paima is not EVM so it doesn't have the same encoding of "inputData" in the EVM sense
         * To convert between the two, we encode the Paima data with this fictional ABI
         */
        const input = encodeFunctionData({
          // TODO: this string should be exposed somewhere 3rd parties can access
          // https://github.com/wevm/viem/issues/2591
          abi: [
            {
              inputs: [{ internalType: 'string', name: 'input', type: 'string' }],
              name: 'convertedPaimaData',
              outputs: [],
              stateMutability: 'nonpayable',
              type: 'function',
            },
          ],
          args: [hexMsg],
        });

        const mock: RpcTransaction = {
          ...data,
          blockHash: mockBlockHash, // TODO
          blockNumber: `0x${data.result.blockNumber.toString(16)}`,
          hash: '0x0', // TODO
          input,
          transactionIndex: `0x${txIndex.toString(16)}`,
          value: '0x0', // TODO
          from: data.result.from as any, // we can't guarantee EVM address format here
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
        if (!isValidTxHash(txHash)) {
          res.error = createInvalidParamsError(
            { txHash },
            `Transaction hash did not match EVM format: ${txHash}`
          );
          return;
        }

        // TODO once we have tx hash in the db
        res.error = createMethodNotSupportedRpcError(
          evmRpc.method,
          `${evmRpc.method} currently unsupported`
        );
        return;

        // const mock: RpcTransactionReceipt = {
        //   transactionHash: '0x0', // TODO
        //   blockHash: mockBlockHash, // TODO
        //   blockNumber: '0x0', // TODO
        //   transactionIndex: '0x0', // TODO
        //   from: '0x0', // TODO
        //   logs: [], // TODO
        //   status: '0x1', // no failed txs in Paima
        //   ...mockContractAddress,
        //   ...mockTxGasPost,
        //   ...mockTxRecipient,
        //   ...mockTxType,
        //   ...mockLogBloom,
        // };
        // setResult<typeof evmRpc.method>(mock);
        // return;
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
        const data = evmRpc.params[0];
        if (!isValidHexadecimal(data)) {
          res.error = createInvalidParamsError({ data }, `Data must be a hex-encoded string 0x...`);
          return;
        }
        // web3_sha3 passes the data as a hex-string, so we need to convert it
        const hexString = data.substring('0x'.length);
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
          return;
        }
        setResult<typeof evmRpc.method>({
          startingBlock: `0x${ENV.START_BLOCKHEIGHT.toString(16)}`,
          currentBlock: `0x${data.block_height.toString(16)}`,
        });
        return;
      }

      default: {
        res.error = createMethodNotFoundRpcError(evmRpc.method);
      }
    }
  })
);
