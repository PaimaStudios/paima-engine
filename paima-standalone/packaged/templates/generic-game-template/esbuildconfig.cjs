const esbuild = require('esbuild');
const fs = require('fs');

const workspace = process.env.BUNDLE_WORKSPACE;
if (!workspace) throw new Error('BUNDLE_WORKSPACE variable not set.');

if (!fs.existsSync(workspace)) throw new Error(`Invalid workspace: ${workspace}.`);

const outFile = {
  api: 'registerEndpoints.cjs',
  backend: 'backend.cjs',
};

// packaging config based on paima-standalone module
esbuild.build({
  platform: 'node',
  entryPoints: [`${workspace}/src/index.ts`],
  bundle: true,
  format: 'cjs',
  outfile: `packaged/${outFile[workspace]}`,
  external: ['pg-native'],
});

console.log(`\x1b[32m${workspace}\x1b[0m bundled to packaged/${outFile[workspace]}`);
