import { Cache, CacheHeader, Field } from 'o1js';

type CompileFn = (
  options?: { cache?: Cache | undefined; forceRecompile?: boolean | undefined } | undefined
) => Promise<{ verificationKey: { data: string; hash: Field } }>;

export class PrebuiltCache implements Cache {
  read(header: CacheHeader): Uint8Array | undefined {
    const result = Cache.FileSystem(__dirname + '/zkcache').read(header);
    if (!result) {
      console.warn('PrebuiltCache miss for', header);
    }
    return result;
  }
  write(header: CacheHeader, value: Uint8Array): void {
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
        cache: options?.cache ?? PrebuiltCache.INSTANCE,
        ...options,
      });
    };
  }
}
