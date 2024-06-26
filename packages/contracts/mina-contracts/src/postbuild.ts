import { Cache, CacheHeader } from 'o1js';
import * as everything from './index.js';
import { readdir, unlink } from 'fs/promises';

const OUTPUT_DIR = 'build/zkcache';

class TrackingCache implements Cache {
  inner: Cache;
  files = new Set<string>();

  constructor(inner: Cache) {
    this.inner = inner;
  }

  read(header: CacheHeader): Uint8Array | undefined {
    this.files.add(`${header.persistentId}.header`);
    this.files.add(header.persistentId);
    return this.inner.read(header);
  }
  write(header: CacheHeader, value: Uint8Array): void {
    this.files.add(`${header.persistentId}.header`);
    this.files.add(header.persistentId);
    return this.inner.write(header, value);
  }
  get canWrite() {
    return this.inner.canWrite;
  }
  get debug() {
    return this.inner.debug;
  }
}

const cache = new TrackingCache(Cache.FileSystem(OUTPUT_DIR));

// compile() every exported ZkProgram and SmartContract into build/zkcache/.
for (const program of Object.values(everything)) {
  if ('compile' in program) {
    console.time(program.name);
    await program.compile({
      cache: cache,
      forceRecompile: false,
    });
    console.timeEnd(program.name);
  }
}

// Delete anything that doesn't belong anymore.
for (const file of await readdir(OUTPUT_DIR)) {
  if (!cache.files.has(file)) {
    await unlink(`${OUTPUT_DIR}/${file}`);
  }
}
