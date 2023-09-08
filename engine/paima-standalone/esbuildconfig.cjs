/* eslint-disable @typescript-eslint/no-var-requires */
const esbuild = require('esbuild');
const fs = require('fs');

const prepareScript = `npm run prepare:standalone`;
const sdkDirectory = 'packaged/paima-sdk';
if (!fs.existsSync(sdkDirectory)) {
  throw new Error(
    `Missing ${sdkDirectory}. Did you forget to \x1b[32m${prepareScript}\x1b[0m first?`
  );
}

void esbuild.build({
  platform: 'node',
  entryPoints: ['build/index.js'],
  bundle: true,
  format: 'cjs',
  outfile: 'packaged/engineCorePacked.js',
  external: ['pg-native'],
});

console.log('✅ Paima-engine Core re-bundled successfully.');
