import * as everything from './index.js';
import { PrebuiltCache } from './cache.js';

// Simple test that PrebuiltCache is both in-use and succeeds on everything.

// Set debug=true so exceptions in read() get logged to console.
PrebuiltCache.INSTANCE.debug = true;

for (const program of Object.values(everything)) {
  if ('compile' in program) {
    console.log(program.name);
    PrebuiltCache.INSTANCE.hits.clear();

    // To "really" test what users will experience, don't pass anything to .compile() here.
    await program.compile();

    if (PrebuiltCache.INSTANCE.hits.size == 0) {
      PrebuiltCache.INSTANCE.misses.add(`${program.name}.compile() not wrapped`);
    }
  }
}

if (PrebuiltCache.INSTANCE.misses.size > 0) {
  console.error('PrebuiltCache missed:', ...PrebuiltCache.INSTANCE.misses);
  process.exit(1);
}
