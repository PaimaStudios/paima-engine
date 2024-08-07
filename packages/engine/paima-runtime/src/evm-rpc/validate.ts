import {
  InternalRpcError,
  MethodNotSupportedRpcError,
  InvalidParamsRpcError,
  RpcRequestError,
  MethodNotFoundRpcError,
} from 'viem';
import type { BlockTag, RpcBlockNumber, RpcBlockIdentifier } from 'viem';
import { getPaimaNodeRestClient } from '@paima/mw-core';
import { ENV } from '@paima/utils';

/**
 * Most of the block tags aren't relevant for Paima, so we simplify them
 */
export function simplifyBlockTag<T>(block: BlockTag | T): 'latest' | 'earliest' | T {
  // Paima doesn't support non-finalized blocks, so all these cases are the same
  if (block === 'latest' || block === 'pending' || block === 'safe' || block === 'finalized') {
    return 'latest';
  }
  // we just let `undefined` mean the entire history
  if (block === 'earliest') {
    return block;
  }
  return block;
}

export async function toBlockNumber(
  rpcBlock: RpcBlockNumber | BlockTag | RpcBlockIdentifier
): Promise<number> {
  const blockParam = simplifyBlockTag(rpcBlock);
  if (blockParam == 'earliest') return ENV.START_BLOCKHEIGHT;
  if (blockParam == 'latest') {
    const { data, error } = await getPaimaNodeRestClient().GET('/latest_processed_blockheight');
    if (error != null) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- seems like an eslint bug?
      throw createInternalRpcError({ block: rpcBlock }, error?.errorMessage);
    }
    return data.block_height;
  }
  if (typeof blockParam === 'string') {
    if (!isValidHexadecimal(blockParam)) {
      throw createInvalidParamsError(
        { block: rpcBlock },
        'Block parameter is not a hex-encoded string (0x...)'
      );
    }
    const val = Number.parseInt(blockParam, 16);
    if (isNaN(val)) {
      throw createInvalidParamsError({ block: rpcBlock }, 'Block parameter is not a number');
    }
  }
  if (!(typeof blockParam === 'object')) {
    throw createInvalidParamsError(
      { block: rpcBlock },
      'Block parameter should be one of: RpcBlockNumber | BlockTag | RpcBlockIdentifier'
    );
  }
  if ('blockNumber' in blockParam) return Number.parseInt(blockParam.blockNumber, 16);
  if ('blockHash' in blockParam)
    // TODO: block hash support. See `mockBlockHash`
    throw new MethodNotSupportedRpcError(new Error(`Block hash RPC currently unsupported`));
  throw createInvalidParamsError(
    { block: rpcBlock },
    'Block parameter should be one of: RpcBlockNumber | BlockTag | RpcBlockIdentifier'
  );
}

export function createRpcRequestError(
  data: Record<string, unknown>,
  code: number,
  msg?: string
): RpcRequestError {
  return new RpcRequestError({
    body: data,
    url: ENV.BACKEND_URI,
    error: {
      code: code,
      message: msg ?? 'No additional information provided',
    },
  });
}

export function createInvalidParamsError(
  data: Record<string, unknown>,
  msg?: string
): InvalidParamsRpcError {
  return new InvalidParamsRpcError(createRpcRequestError(data, InvalidParamsRpcError.code, msg));
}
export function createInternalRpcError(
  data: Record<string, unknown>,
  msg?: string
): InternalRpcError {
  return new InternalRpcError(createRpcRequestError(data, InternalRpcError.code, msg));
}
export function createMethodNotFoundRpcError(
  method: string,
  msg?: string
): MethodNotSupportedRpcError {
  return new MethodNotSupportedRpcError(
    createRpcRequestError({}, MethodNotSupportedRpcError.code, msg),
    { method }
  );
}
export function createMethodNotSupportedRpcError(
  method: string,
  msg?: string
): MethodNotFoundRpcError {
  return new MethodNotFoundRpcError(createRpcRequestError({}, MethodNotFoundRpcError.code, msg), {
    method,
  });
}

export function isValidHexadecimal(str: string): boolean {
  // Regular expression to match a valid hexadecimal string
  const hexRegExp = /^[0-9a-fA-F]+$/;

  // Test the string against the regular expression
  return hexRegExp.test(str);
}
export function isValidBlockHash(str: string): boolean {
  // Regular expression to match a valid hexadecimal string
  const hexRegExp = /^0x[0-9a-fA-F]{64}$/;

  // Test the string against the regular expression
  return hexRegExp.test(str);
}
export function isValidTxHash(str: string): boolean {
  // block hashes & tx hashes have the same format
  return isValidBlockHash(str);
}
