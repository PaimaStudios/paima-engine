import { getWriteNamespace } from '@paima/utils';

import type { SignFunction } from '../types.js';
import { createMessageForBatcher, type BatchedSubunit } from '@paima/concise';
import type { AddressAndType } from '@paima/providers';

export function batchedToJsonString(b: BatchedSubunit, captcha?: string, async?: boolean): string {
  return JSON.stringify({
    address_type: b.addressType,
    user_address: b.userAddress,
    user_signature: b.userSignature,
    game_input: b.gameInput,
    timestamp: b.millisecondTimestamp,
    captcha,
    async,
  });
}

export async function buildBatchedSubunit(
  signFunction: SignFunction,
  userAddress: AddressAndType,
  gameInput: string
): Promise<BatchedSubunit> {
  const millisecondTimestamp: string = new Date().getTime().toString(10);
  const message: string = createMessageForBatcher(
    await getWriteNamespace(),
    gameInput,
    millisecondTimestamp
  );
  const userSignature = await signFunction(message);
  return {
    addressType: userAddress.type,
    userAddress: userAddress.address,
    userSignature,
    gameInput,
    millisecondTimestamp,
  };
}
