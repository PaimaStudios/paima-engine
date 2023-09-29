/* eslint-disable @typescript-eslint/no-var-requires */
const esbuild = require('esbuild');
const fs = require('fs');

void esbuild.build({
  platform: 'node',
  entryPoints: ['../runtime/build/index.js'],
  bundle: true,
  format: 'cjs',
  outfile: 'packaged/batcherCorePacked.js',
  external: ['pg-native'],
});

console.log('✅ Paima-batcher re-bundled successfully.');
