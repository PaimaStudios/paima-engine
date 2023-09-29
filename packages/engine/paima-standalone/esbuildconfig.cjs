/* eslint-disable @typescript-eslint/no-var-requires */
const esbuild = require('esbuild');

void esbuild.build({
  platform: 'node',
  entryPoints: ['build/index.js'],
  bundle: true,
  format: 'cjs',
  outfile: 'packaged/engineCorePacked.js',
  external: ['pg-native'],
});

console.log('✅ Paima-engine Core re-bundled successfully.');
