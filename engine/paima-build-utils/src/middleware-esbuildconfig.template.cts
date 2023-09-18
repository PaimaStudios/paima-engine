import { polyfillNode } from 'esbuild-plugin-polyfill-node';
import type esbuild from 'esbuild';
import { dtsPlugin } from 'esbuild-plugin-d.ts';
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

// mock out fs as we can't use it in browser builds
const fsaReplace: esbuild.Plugin = {
  name: 'fsa-replace',
  setup(build) {
    build.onResolve({ filter: /fsa\.js/ }, args => {
      const mockFile = args.path.replace('fsa.js', 'fsa_empty.js');
      return { path: `${args.resolveDir}/${mockFile}`, namespace: args.namespace };
    });
  },
};

export const config: esbuild.BuildOptions = {
  // JS output from previous compilation step used here instead of index.ts to have more control over the TS build process
  entryPoints: ['build/index.js'],
  bundle: true,
  format: 'esm',
  define,
  outfile: 'packaged/middleware.js',
  plugins: [polyfillNode({}), dtsPlugin(), fsaReplace],
  external: ['pg-native'],
};
