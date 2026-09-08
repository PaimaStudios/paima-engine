import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import wasm from 'vite-plugin-wasm'
import nodePolyfills from 'vite-plugin-node-stdlib-browser'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const projectRoot = dirname(fileURLToPath(import.meta.url))
const cryptoShim = resolve(projectRoot, 'src/shims/crypto.ts')

// https://vite.dev/config/
export default defineConfig({
  define: {
    // Wallet dependencies probe for these runtimes during browser startup.
    Deno: undefined,
    Bun: undefined,
  },
  resolve: {
    alias: [
      // crypto-browserify (used by the node-stdlib-browser polyfill) is
      // missing `timingSafeEqual`, which the midnight-js level private-state
      // provider's storage encryption depends on. Route `crypto` / `node:crypto`
      // through a thin shim that adds the function.
      { find: /^crypto$/, replacement: cryptoShim },
      { find: /^node:crypto$/, replacement: cryptoShim },
    ],
  },
  build: {
    target: 'esnext',
  },
  optimizeDeps: {
    exclude: ['@midnight-ntwrk/onchain-runtime'],
    // Pre-bundle deps that are only reachable through DYNAMIC imports, so Vite
    // doesn't discover them mid-session.
    //
    // The JS wallet's connect path (@effectstream/wallets → MidnightLocal.
    // connectFromSeed → @effectstream/midnight-contracts/wallet-info) pulls
    // node:path / node:fs / node:buffer only when the user clicks Connect. Vite
    // then re-optimizes and issues a FULL PAGE RELOAD, which wipes React state
    // — so the wallet appears to connect and immediately disconnect, once, on
    // the first connect of a fresh dev server. Declaring them here moves that
    // work to startup. Dev-only: `vite build` bundles everything upfront.
    include: [
      '@midnight-ntwrk/midnight-js-types',
      'node:path',
      'node:fs',
      'node:buffer',
    ],
    esbuildOptions: {
      target: 'esnext',
      plugins: [
        // Mirror the `resolve.alias` entries above at the esbuild layer.
        // Vite's optimizeDeps pre-bundling uses esbuild directly, which does
        // NOT honor `resolve.alias` — so without this plugin the midnight-js
        // storage-encryption module binds to the real `crypto-browserify`
        // (no timingSafeEqual) and fails at runtime.
        {
          name: 'alias-node-crypto-to-shim',
          setup(build) {
            build.onResolve({ filter: /^(node:)?crypto$/ }, () => ({
              path: cryptoShim,
            }));
          },
        },
      ],
    },
  },
  plugins: [react(), wasm(), nodePolyfills()],
})
