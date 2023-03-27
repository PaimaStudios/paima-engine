/* eslint-disable @typescript-eslint/no-var-requires */
const esbuild = require('esbuild');
const g = require('@esbuild-plugins/node-globals-polyfill');
const m = require('@esbuild-plugins/node-modules-polyfill');
const { dtsPlugin } = require('esbuild-plugin-d.ts');
const modules = m.NodeModulesPolyfillPlugin();

const define = { global: 'window' };

// To replace process.env calls in middleware with variable values during build time
for (const variable in process.env) {
  define[`process.env.${variable}`] = JSON.stringify(process.env[variable]);
}

// Verify env file is filled out
if (
  !process.env.CONTRACT_ADDRESS ||
  !process.env.CHAIN_URI ||
  !process.env.CHAIN_ID ||
  !process.env.BACKEND_URI
) {
  throw new Error('Please ensure you have filled out your .env file');
}

const global = g.NodeGlobalsPolyfillPlugin({
  process: true,
  buffer: true,
  define: { 'process.env.var': '"hello"' }, // inject will override define, to keep env vars you must also pass define here https://github.com/evanw/esbuild/issues/660
});

const config = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  format: 'iife',
  globalName: 'middleware',
  define,
  outfile: 'web/middleware.js',
  plugins: [global, modules, dtsPlugin()],
  external: ['pg-native'],
};

esbuild.build(config)
  .then(c => console.log('Done:', c))
  .catch(e => console.log('Error:', e));

