import { Cache, CacheHeader, Field } from 'o1js';
import path from 'path';
import { fileURLToPath } from 'url';

type CompileFn = (
  options?: { cache?: Cache | undefined; forceRecompile?: boolean | undefined } | undefined
) => Promise<{ verificationKey: { data: string; hash: Field } }>;

const baseCache = Cache.FileSystem(path.dirname(fileURLToPath(import.meta.url)) + '/zkcache');

export class PrebuiltCache implements Cache {
  read(header: CacheHeader): Uint8Array | undefined {
    if (this.debug) {
      console.log('PrebuiltCache.read', header.persistentId);
    }
    const result = baseCache.read(header);
    if (!result && this.debug) {
      console.warn('PrebuiltCache miss for', header);
    }
    return result;
  }
  write(header: CacheHeader, value: Uint8Array): void {
    if (this.debug) {
      console.log('PrebuiltCache.write', header.persistentId);
    }
    throw new Error('PrebuiltCache cannot write.');
  }
  canWrite: boolean = false;
  debug?: boolean | undefined = false;

  static readonly INSTANCE = new PrebuiltCache();

  /** Wrap a .compile function to change its default cache to PrebuiltCache. */
  static wrap(original: CompileFn): CompileFn {
    return function compile(options) {
      return original({
        // Default cache to the PrebuiltCache instead of o1js FileSystemDefault,
        // but the user can still override it.
        cache: PrebuiltCache.INSTANCE,
        ...options,
      });
    };
  }
}
