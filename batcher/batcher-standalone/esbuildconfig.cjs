/* eslint-disable @typescript-eslint/no-var-requires */
const esbuild = require('esbuild');
const fs = require('fs');

const prepareScript = `npm run prepare:standalone`;
const batcherDirectory = 'packaged/paima-batcher';
if (!fs.existsSync(batcherDirectory)) {
  throw new Error(
    `Missing ${batcherDirectory}. Did you forget to \x1b[32m${prepareScript}\x1b[0m first?`
  );
}

void esbuild.build({
  platform: 'node',
  entryPoints: ['../runtime/build/index.js'],
  bundle: true,
  format: 'cjs',
  outfile: 'packaged/batcherCorePacked.js',
  external: ['pg-native'],
});

console.log('✅ Paima-batcher re-bundled successfully.');
