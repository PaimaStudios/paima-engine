/* eslint-disable @typescript-eslint/no-var-requires */
const esbuild = require('esbuild');

void esbuild.build({
  platform: 'node',
  entryPoints: ['build/index.js'],
  bundle: true,
  format: 'cjs',
  outfile: 'packaged/backendPacked.js',
  external: ['pg-native'],
});
