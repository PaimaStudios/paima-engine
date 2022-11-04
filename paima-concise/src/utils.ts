import { HexString, InputString } from './types';

export const isHexString = (input: InputString): input is HexString => input.startsWith('0x');
