import Prando from '@paima/prando';
import type { WalletAddress } from '@paima/utils';
import { adjectives } from './adjectives.js';
import { nouns } from './nouns.js';

// around 0.2% repetition with 10k users
// around 1.5% repetition with 100k users
// around 14.45% repetition with 1M users
/**
 * @returns wallet address transformed into a pseudorandom name `Adjective Noun`. Longest possible name is 20 characters.
 */
export const walletToName = (wallet: WalletAddress): string => {
  const maxCharacters = 20;
  const prando = new Prando(wallet);
  const adjectiveLength = adjectives.length;
  const nounLength = nouns.length;
  while (true) {
    const adjective = adjectives[Math.floor(prando.next() * adjectiveLength)];
    const noun = nouns[Math.floor(prando.next() * nounLength)];
    const result = `${adjective} ${noun}`;
    if (result.length <= maxCharacters) return result;
  }
};
