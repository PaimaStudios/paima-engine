import Crypto from 'crypto';

export * from './parser/PaimaParser';
export * from './cde-access';

export function hashTogether(data: string[]): string {
  return Crypto.createHash('sha256').update(data.join()).digest('base64');
}
