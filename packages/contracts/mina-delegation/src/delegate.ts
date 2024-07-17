import {
  Bool,
  Bytes,
  Crypto,
  Poseidon,
  PublicKey,
  Struct,
  UInt8,
  ZkProgram,
  createEcdsa,
  createForeignCurve,
} from 'o1js';

// ----------------------------------------------------------------------------
// Common data types

/** A Mina foreign curve for Secp256k1, like Ethereum uses. */
export class Secp256k1 extends createForeignCurve(Crypto.CurveParams.Secp256k1) {
  /** Convert a standard hex public key into this provable struct. */
  static fromHex(publicKey: `0x${string}`): Secp256k1 {
    if (publicKey.startsWith('0x04') && publicKey.length === 4 + 64 + 64) {
      return Secp256k1.from({
        x: BigInt('0x' + publicKey.substring(4, 4 + 64)),
        y: BigInt('0x' + publicKey.substring(4 + 64, 4 + 64 + 64)),
      });
    } else if (publicKey.startsWith('0x') && publicKey.length === 2 + 64 + 64) {
      return Secp256k1.from({
        x: BigInt('0x' + publicKey.substring(2, 2 + 64)),
        y: BigInt('0x' + publicKey.substring(2 + 64, 2 + 64 + 64)),
      });
    } else {
      throw new Error('Bad public key format');
    }
  }
}

/** A Mina-provable ECDSA signature on the Secp256k1 curve, like Ethereum uses. */
export class Ecdsa extends createEcdsa(Secp256k1) {
  // o1js-provided fromHex is good enough
}

// Ethereum's fixed prefix.
const ethereumPrefix = Bytes.fromString('\x19Ethereum Signed Message:\n');
// A prefix to distinguish this delegation order scheme from what might be
// similar-looking messages.
const delegationPrefix = Bytes.fromString('DELEGATE-WALLET:');

/**
 * An order that a particular EVM address has signed to authorize (delegate)
 * a Mina address to act on its behalf.
 */
export class DelegationOrder extends Struct({
  /** Mina public key that the delegation order is issued for. */
  target: PublicKey,
  /** Ethereum public key that signed the delegation order. */
  signer: Secp256k1.provable,
}) {
  constructor(value: { target: PublicKey; signer: Secp256k1 }) {
    if (!(value.target instanceof PublicKey)) {
      // Compensate for the possibility of duplicate o1js libraries that aren't
      // `instanceof` each other, which messes up checks inside o1js. Can be
      // caused by `npm link`ing to this package, for example.
      value = { ...value, target: PublicKey.fromBase58((value.target as PublicKey).toBase58()) };
    }
    super(value);
  }

  private static _innerMessage(target: PublicKey): Bytes {
    return Bytes.from([
      ...delegationPrefix.bytes,
      ...Bytes.from(encodeKey(target)).base64Encode().bytes,
    ]);
  }

  /**
   * Get the message for an Etherum wallet to sign, WITHOUT the Ethereum prefix.
   * This is printable and should be passed to something like `personal_sign`.
   */
  static bytesToSign({ target }: { target: PublicKey }): Uint8Array {
    // Accepts an object so you can pass just a PublicKey OR a DelegationOrder.
    return this._innerMessage(target).toBytes();
  }

  /** Validate that the given Ethereum signature matches this order, WITH the Ethereum prefix. */
  assertSignatureMatches(signature: Ecdsa) {
    const inner = DelegationOrder._innerMessage(this.target);
    const fullMessage = Bytes.from([
      ...ethereumPrefix.bytes,
      // NOTE: `inner.length` is effectively a constant so it's okay to bake it in.
      ...Bytes.fromString(String(inner.length)).bytes,
      ...inner.bytes,
    ]);
    signature.verifyV2(fullMessage, this.signer).assertTrue();
  }

  /** Hash this entire order for use as a MerkleMap key. */
  hash() {
    return Poseidon.hashWithPrefix('DelegationOrder', [
      ...this.target.toFields(),
      ...this.signer.x.toFields(),
      ...this.signer.y.toFields(),
    ]);
  }
}

function encodeKey(k: PublicKey): UInt8[] {
  const bytes = [];
  const bits = [...k.x.toBits(254), k.isOdd];
  for (let i = 0; i < bits.length; i += 8) {
    let value = new UInt8(0);
    for (let j = 0; j < 8; j++) {
      value = value.mul(2).add(boolToU8(bits[i + j] ?? Bool(false)));
    }
    bytes.push(value);
  }
  return bytes;
}

function boolToU8(bool: Bool): UInt8 {
  return UInt8.from(bool.toField());
}

// ----------------------------------------------------------------------------
// The provable program itself

/**
 * A simple {@link ZkProgram} that proves that a valid signature exists for an
 * input {@link DelegationOrder}.
 */
export const DelegationOrderProgram = ZkProgram({
  name: 'DelegationOrderProgram',

  publicInput: DelegationOrder,

  methods: {
    sign: {
      privateInputs: [Ecdsa.provable],

      async method(order: DelegationOrder, signature: Ecdsa) {
        order.assertSignatureMatches(signature);
      },
    },
  },
});

/** A verifiable proof of {@link DelegationOrderProgram}'s success. */
export class DelegationOrderProof extends ZkProgram.Proof(DelegationOrderProgram) {}
