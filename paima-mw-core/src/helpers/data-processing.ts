import { AddressType } from '@paima/utils';

import type { BatchedSubunit, SignFunction } from '../types';
import { signMessageCardano } from '../wallets/cardano';
import { signMessageEth } from '../wallets/evm';
import { signMessagePolkadot } from '../wallets/polkadot';

export function batchedToJsonString(b: BatchedSubunit): string {
  return JSON.stringify({
    address_type: b.addressType,
    user_address: b.userAddress,
    user_signature: b.userSignature,
    game_input: b.gameInput,
    timestamp: b.millisecondTimestamp,
  });
}

export function batchedToString(b: BatchedSubunit): string {
  return [b.userAddress, b.userSignature, b.gameInput, b.millisecondTimestamp].join('/');
}

function selectSignFunction(addressType: AddressType): SignFunction {
  switch (addressType) {
    case AddressType.EVM:
      return signMessageEth;
    case AddressType.CARDANO:
      return signMessageCardano;
    case AddressType.POLKADOT:
      return signMessagePolkadot;
    default:
      throw new Error(`[selectSignFunction] invalid address type: ${addressType}`);
  }
}

export async function buildBatchedSubunit(
  addressType: AddressType,
  userAddress: string,
  signingAddress: string,
  gameInput: string
): Promise<BatchedSubunit> {
  const signFunction = selectSignFunction(addressType);
  const millisecondTimestamp: string = new Date().getTime().toString(10);
  const message: string = gameInput + millisecondTimestamp;
  const userSignature = await signFunction(signingAddress, message);
  return {
    addressType,
    userAddress,
    userSignature,
    gameInput,
    millisecondTimestamp,
  };
}
