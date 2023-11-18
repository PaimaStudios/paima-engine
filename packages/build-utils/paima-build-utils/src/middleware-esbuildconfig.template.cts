import { polyfillNode } from 'esbuild-plugin-polyfill-node';
import type esbuild from 'esbuild';
import fs from 'fs';

const define: Record<string, string> = { global: 'window' as const };
// To replace process.env calls in middleware with variable values during build time
for (const variable in process.env) {
  define[`process.env.${variable}`] = JSON.stringify(process.env[variable]);
}

if (process.env.SECURITY_NAMESPACE) {
  const namespace = process.env.SECURITY_NAMESPACE;
  if (namespace.endsWith('.yml') || namespace.endsWith('.yaml')) {
    const fileContent = fs.readFileSync(`../${namespace}`, 'utf-8');
    define[`process.env.SECURITY_NAMESPACE_ROUTER`] = JSON.stringify(fileContent);
  }
}

// Verify env file is filled out
if (
  !process.env.CONTRACT_ADDRESS ||
  !process.env.CHAIN_URI ||
  !process.env.CHAIN_ID ||
  !process.env.BACKEND_URI
)
  throw new Error('Please ensure you have filled out your .env file');

export const config: esbuild.BuildOptions = {
  // JS output from previous compilation step used here instead of index.ts to have more control over the TS build process
  // however, that means type definitions will be lost until this is implemented: https://github.com/evanw/esbuild/issues/95#issuecomment-1559710310
  entryPoints: ['build/index.js'],
  bundle: true,
  format: 'esm',
  define,
  outfile: 'packaged/middleware.js',
  plugins: [polyfillNode({})],
  external: ['pg-native'],
};
