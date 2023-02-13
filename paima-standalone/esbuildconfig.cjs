/* eslint-disable @typescript-eslint/no-var-requires */
const esbuild = require('esbuild');
const fs = require('fs');

const prepareSDK = `npm run prepare:sdk`;
const sdkDirectory = 'packaged/paima-sdk';
if (!fs.existsSync(sdkDirectory)) {
  throw new Error(`Missing ${sdkDirectory}. Did you forget to \x1b[32m${prepareSDK}\x1b[0m first?`);
}

// TODO: improve messages after pulling templates from separate repo
const templatesDirectory = 'packaged/templates';
if (!fs.existsSync(templatesDirectory)) {
  throw new Error(`Missing ${templatesDirectory}.`);
}
const templates = fs.readdirSync(templatesDirectory);
if (templates.length === 0) {
  throw new Error(`No templates present in ${templatesDirectory}, please check the setup.`);
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
