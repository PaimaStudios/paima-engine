import { AddressType, getWriteNamespace } from '@paima/utils';

import type { SignFunction } from '../types';
import {
  AlgorandConnector,
  CardanoConnector,
  EvmConnector,
  PolkadotConnector,
} from '@paima/providers';
import { createMessageForBatcher, type BatchedSubunit } from '@paima/concise';

export function batchedToJsonString(b: BatchedSubunit): string {
  return JSON.stringify({
    address_type: b.addressType,
    user_address: b.userAddress,
    user_signature: b.userSignature,
    game_input: b.gameInput,
    timestamp: b.millisecondTimestamp,
  });
}

function selectSignFunction(addressType: AddressType): SignFunction {
  switch (addressType) {
    case AddressType.EVM:
      return EvmConnector.instance().getOrThrowProvider().signMessage;
    case AddressType.CARDANO:
      return CardanoConnector.instance().getOrThrowProvider().signMessage;
    case AddressType.POLKADOT:
      return PolkadotConnector.instance().getOrThrowProvider().signMessage;
    case AddressType.ALGORAND:
      return AlgorandConnector.instance().getOrThrowProvider().signMessage;
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
  const message: string = createMessageForBatcher(
    await getWriteNamespace(),
    gameInput,
    millisecondTimestamp
  );
  const userSignature = await signFunction(message);
  return {
    addressType,
    userAddress,
    userSignature,
    gameInput,
    millisecondTimestamp,
  };
}
