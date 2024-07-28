import { keccak_256 } from 'js-sha3';

export function generatePrecompile(name: string): { [x: typeof name]: string } {
  // trim to 20 bytes to have evm-sized addresses
  const hash = keccak_256(name).slice(0, 40);

  return { [name]: `0x${hash}` };
}
