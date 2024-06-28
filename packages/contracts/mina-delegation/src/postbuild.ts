import { Cache } from 'o1js';
import * as everything from './index.js';

const OUTPUT_DIR = 'build/zkcache';
const cache = Cache.FileSystem(OUTPUT_DIR);

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
