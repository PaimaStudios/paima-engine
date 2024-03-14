import { AlgorandCrypto } from './algorand.js';
import { CardanoCrypto } from './cardano.js';
import { EvmCrypto } from './evm.js';
import { PolkadotCrypto } from './polkadot.js';
export { AlgorandCrypto, CardanoCrypto, EvmCrypto, PolkadotCrypto };
export type * from './IVerify.js';

export class CryptoManager {
  // careful: packages in these classes should be dynamically imported
  // so that we don't have to import a bunch of heavy crypto for games that don't need it

  private static algorand: AlgorandCrypto | undefined;
  private static cardano: CardanoCrypto | undefined;
  private static evm: EvmCrypto | undefined;
  private static polkadot: PolkadotCrypto | undefined;

  static Algorand(): AlgorandCrypto {
    if (CryptoManager.algorand == null) {
      CryptoManager.algorand = new AlgorandCrypto();
    }
    return CryptoManager.algorand;
  }

  static Cardano(): CardanoCrypto {
    if (CryptoManager.cardano == null) {
      CryptoManager.cardano = new CardanoCrypto();
    }
    return CryptoManager.cardano;
  }

  static Evm(): EvmCrypto {
    if (CryptoManager.evm == null) {
      CryptoManager.evm = new EvmCrypto();
    }
    return CryptoManager.evm;
  }

  static Polkadot(): PolkadotCrypto {
    if (CryptoManager.polkadot == null) {
      CryptoManager.polkadot = new PolkadotCrypto();
    }
    return CryptoManager.polkadot;
  }
}
