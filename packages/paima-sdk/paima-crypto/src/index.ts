import { AlgorandCrypto } from './algorand';
import { CardanoCrypto } from './cardano';
import { EvmCrypto } from './evm';
import { PolkadotCrypto } from './polkadot';
import type Web3 from 'web3';
export { AlgorandCrypto, CardanoCrypto, EvmCrypto, PolkadotCrypto };
export type * from './IVerify';

export class CryptoManager {
  // TODO: these should be dynamically imported
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

  static Evm(web3: Web3): EvmCrypto {
    if (CryptoManager.evm == null) {
      CryptoManager.evm = new EvmCrypto(web3);
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
