/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-var-requires */
const esbuild = require('esbuild');
const { polyfillNode } = require('esbuild-plugin-polyfill-node');

const define = { global: 'window' };

// To replace process.env calls in middleware with variable values during build time
for (const variable in process.env) {
  define[`process.env.${variable}`] = JSON.stringify(process.env[variable]);
}

if (process.env.SECURITY_NAMESPACE) {
  const namespace = process.env.SECURITY_NAMESPACE;
  if (namespace.endsWith('.yml') || namespace.endsWith('.yaml')) {
    const fileContent = fs.readFileSync(`../${namespace}`, 'utf-8');
    define[`process.env.SECURITY_NAMESPACE_ROUTER`] =
      JSON.stringify(fileContent);
  }
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

const config = {
  entryPoints: ['build/index.js'],
  bundle: true,

  // we use iife so that it's easy to import from the index.html for the debug website
  format: 'iife',
  globalName: 'middleware',

  define,
  outfile: 'web/middleware.js',
  plugins: [polyfillNode({})],
  external: ['pg-native'],
};

esbuild.build(config)
  .then(c => console.log('Done:', c))
  .catch(e => console.log('Error:', e));

