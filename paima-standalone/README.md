# Paima-standalone

Wrapper around paima-engine that serves as an entry point for others to create brand new paima games. Its output is an executable that can read custom configs and execute custom javascript code.

## Usage

Currently the library is in development, unpublished, and to be used and tested locally.

## Building the executable

1. In the root folder run `npm run install` if you freshly cloned the repo or made any changes
2. run `npm run build:binary` in the root folder

The `build:binary` command does the following:

- builds paima-engine workspaces
- repackages the whole backend into a single `.js` file in CommonJS, because `pkg` doesn't currently support ESM (`packaged/backendPacked`)
- prepares executables in `packaged/@paima` folder based on `package.json`/`pkg` config (you can modify it to add more targets for example)

## Current limitations

Paima Funnel contains two dependencies that `pkg` isn't able to pack automatically. In order for that to work, change of how these `.wasm` files are imported in the libraries themselves would be needed. That's why we have a `packaged` folder and we are telling `pkg` explicitly that these 2 files taken from the libraries should be included.

Updating of these two libraries must be done with this in mind.

- `cardano_message_signing_bg.wasm` from `@emurgo/cardano-message-signing-nodejs`
- `cardano_multiplatform_lib_bg.wasm` from `@dcspark/cardano-multiplatform-lib-nodejs`: also `pkg` is not compatible with latest version `@3.1.2` due to error below so `3.1.0` is now used instead.

```
LinkError: WebAssembly.Instance(): Import #4 module="__wbindgen_placeholder__" function="__wbg_getRandomValues_fb6b088efb6bead2" error: function import requires a callable
```
