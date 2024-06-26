import { Cache, CacheHeader, Field } from 'o1js';
import path from 'path';
import { fileURLToPath } from 'url';

type CompileFn<T> = (
  options?: { cache?: Cache | undefined; forceRecompile?: boolean | undefined } | undefined
) => Promise<T>;

// TODO: web support
const baseCache = Cache.FileSystem(path.dirname(fileURLToPath(import.meta.url)) + '/zkcache');

/**
 * An o1js-compatible {@link Cache} that uses circuit data compiled at build
 * time instead of run time.
 */
export class PrebuiltCache implements Cache {
  read(header: CacheHeader): Uint8Array | undefined {
    if (this.debug) {
      console.log('PrebuiltCache.read', header.persistentId);
    }
    const result = baseCache.read(header);
    if (result) {
      this.hits.add(header.persistentId);
    } else {
      this.misses.add(header.persistentId);
      if (this.debug) {
        console.warn('PrebuiltCache miss for', header);
      }
    }
    return result;
  }
  write(header: CacheHeader, value: Uint8Array): void {
    if (this.debug) {
      console.log('PrebuiltCache.write', header.persistentId);
    }
    throw new Error('PrebuiltCache cannot write.');
  }
  readonly canWrite: boolean = false;
  debug?: boolean | undefined = false;

  hits = new Set<string>();
  misses = new Set<string>();

  static readonly INSTANCE = new PrebuiltCache();

  /** Wrap a .compile function to change its default cache to PrebuiltCache. */
  static wrap<T>(original: CompileFn<T>): CompileFn<T> {
    return function compile(this: unknown, options) {
      return original.call(this, {
        // Default cache to the PrebuiltCache instead of o1js FileSystemDefault,
        // but the user can still override it.
        cache: PrebuiltCache.INSTANCE,
        ...options,
      });
    };
  }
}
