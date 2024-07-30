import { DynamicProof, JsonProof, PrivateKey, PublicKey, VerificationKey } from 'o1js';
import { extractPublicKey } from '@metamask/eth-sig-util';
import { delegateEvmToMina } from '@paima/mina-delegation';

import { EvmInjectedConnector } from '../index.js';

import type { Methods, InitParams } from './mina.worker.js';
import minaWorkerCode from './mina.worker.txt';

const workerBlobUrl = URL.createObjectURL(new Blob([minaWorkerCode], { type: 'text/javascript' }));

class MinaWorker {
  private readonly worker;
  private readonly ready: Promise<unknown>;
  private readonly pending = new Map<number, PromiseWithResolvers<unknown>>();
  private next = 1;

  constructor(initParams: InitParams) {
    // Needed otherwise async import() of the real script will result in
    // onmessage event handler being added too late and our call being dropped.
    const readyEvent = Promise.withResolvers();
    this.pending.set(0, readyEvent);
    this.ready = readyEvent.promise;

    this.worker = new Worker(workerBlobUrl + '#' + new URLSearchParams(initParams), {
      type: 'module',
    });
    this.worker.addEventListener('error', console.error);
    this.worker.addEventListener('messageerror', console.error);
    this.worker.addEventListener('message', event => {
      this.pending.get(event.data.id)?.resolve(event.data.result);
      this.pending.delete(event.data.id);
    });
  }

  method<M extends keyof Methods>(method: M): Methods[M] {
    return (async (...args: unknown[]) => {
      await this.ready;

      const replyEvent = Promise.withResolvers();
      const id = this.next++;
      this.pending.set(id, replyEvent);
      this.worker.postMessage({ id, method, args });
      return await replyEvent.promise;
    }) as Methods[M];
  }
}

interface MinaDelegationCacheStorage {
  privateKey?: string;
  signature?: string;
  verificationKey?: {
    data: string;
    hash: string;
  };
  proof?: JsonProof;
}

/** Caching Mina DelegationCommand proof generator. */
export class MinaDelegationCache {
  /** The randomly-generated Mina private key, for use. */
  readonly privateKey: PrivateKey;
  /** The corresponding public key, which gets signed. */
  readonly publicKey: PublicKey;
  /** The signed order. May be rejected by user cancelling. */
  readonly signature: Promise<string>;
  /** The verification key which can be used by {@link DynamicProof}. */
  readonly verificationKey: Promise<VerificationKey>;
  /** The serialized ZK proof of the signature. */
  readonly proof: Promise<JsonProof>;

  constructor({
    gameName,
    onRejectSignature,
  }: {
    /** The proof namespace, like "My Game login: ". Shown in the signature prompt and used as the storage key. */
    gameName: string;
    /** If provided, called when the user declines to sign. */
    onRejectSignature?: (err: unknown, askAgain: () => void) => void;
  }) {
    const prefix = `${gameName} login: `;
    const storageKey = `MinaDelegationCache(${gameName})`;
    const storage: MinaDelegationCacheStorage = JSON.parse(
      localStorage.getItem(storageKey) ?? '{}'
    );
    const { DelegationCommand } = delegateEvmToMina(prefix);

    // 1. key
    if (storage.privateKey) {
      this.privateKey = PrivateKey.fromBase58(storage.privateKey);
    } else {
      this.privateKey = PrivateKey.random();
      storage.privateKey = this.privateKey.toBase58();
      localStorage.setItem(storageKey, JSON.stringify(storage));
    }
    const target = (this.publicKey = this.privateKey.toPublicKey());

    // 2. signature
    const signaturePromise = (this.signature = (async () => {
      if (!storage.signature) {
        const provider = await EvmInjectedConnector.instance().connectSimple({
          gameName,
          gameChainId: undefined,
        });
        const data = DelegationCommand.bytesToSign({ target });
        const stringData = new TextDecoder().decode(data);
        if (onRejectSignature) {
          while (true) {
            try {
              storage.signature = await provider.signMessage(stringData);
              break;
            } catch (err) {
              const { promise, resolve } = Promise.withResolvers<void>();
              onRejectSignature(err, resolve);
              await promise;
            }
          }
        } else {
          storage.signature = await provider.signMessage(stringData);
        }
        localStorage.setItem(storageKey, JSON.stringify(storage));
      }
      return storage.signature;
    })());

    // Lazy-initialize the background thread only if we need it.
    let worker: MinaWorker;
    function getWorker() {
      return (worker ??= new MinaWorker({ prefix }));
    }

    // 3. verification key
    const vkPromise = (this.verificationKey = (async () => {
      // If the VK isn't in local storage, start compiling concurrently
      // with waiting for the signature. Also do this if !storage.proof because
      // we need to call .compile() before proving.
      if (!storage.verificationKey || !storage.proof) {
        storage.verificationKey = JSON.parse(await getWorker().method('compile')());
        localStorage.setItem(storageKey, JSON.stringify(storage));
      }
      // NB: fromJSON's signature accepts `string` but it actually wants an object,
      // so do a horrifying cast.
      return VerificationKey.fromJSON(storage.verificationKey as unknown as string /* wtf? */);
    })());

    // 3. proof
    this.proof = (async () => {
      if (!storage.proof) {
        // Wait on dependencies.
        await vkPromise;
        const signature = await signaturePromise;

        // Turn the signature into a DelegationCommand and sign it.
        const data = DelegationCommand.bytesToSign({ target });
        const ethPublicKey = extractPublicKey({ data, signature });
        const proof = await getWorker().method('sign')({
          target: target.toBase58(),
          signer: ethPublicKey,
          signature: signature,
        });

        // Save it back.
        storage.proof = proof;
        localStorage.setItem(storageKey, JSON.stringify(storage));
      }
      return storage.proof;
    })();
  }
}
