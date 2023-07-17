import Prando from '@paima/prando';
import type { WalletAddress } from '@paima/utils/src/types';
import { adjectives } from './adjectives';
import { nouns } from './nouns';

// around 0.2% repetition with 10k users
// around 1.5% repetition with 100k users
// around 14.45% repetition with 1M users
/**
 * @param maxCharacters maximum number of characters in the name (default: 20). Conversion might not finish if too small number is provided.
 * @returns wallet address transformed into a pseudorandom name `Adjective Noun`
 */
export const walletToName = (wallet: WalletAddress, maxCharacters = 20): string => {
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
