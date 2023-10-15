import type { HexString, InputString } from './types.js';

export const isHexString = (input: InputString): input is HexString => input.startsWith('0x');
