import { Cache } from 'o1js';
import { DelegationOrderProgram } from './delegate.js';

const cache = Cache.FileSystem('build/zkcache');
for (const program of [DelegationOrderProgram]) {
  console.time(program.name);
  await program.compile({
    cache: cache,
    forceRecompile: false,
  });
  console.timeEnd(program.name);
}
