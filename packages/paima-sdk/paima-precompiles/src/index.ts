import { sha3_224 } from 'js-sha3';

export function generatePrecompile(name: string): { [x: typeof name]: string } {
  // trim to 20 bytes to have evm-sized addresses
  const hash = sha3_224(name).slice(0, 40);

  return { [name]: `0x${hash}` };
}
