import { toEventSignature } from 'viem';
import type { Abi } from 'abitype';

/**
 * TODO: delete this eventually
 * Unfortunately, there doesn't seem to be a static way to do this in viem
 * https://github.com/wevm/viem/discussions/2706
 */
export function checkEventExists<ABI extends Abi, Signature extends string>(
  abi: ABI,
  signature: Signature
): Signature {
  const events = abi.filter(item => item.type === 'event');
  for (const event of events) {
    // this is the part that returns `string` instead of a constant
    const eventSignature = toEventSignature(event);
    if (signature === eventSignature) {
      return signature;
    }
  }
  throw new Error(`Could not find event signature ${signature} in contract ABI`);
}
