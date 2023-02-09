# Paima Standalone

Wrapper around `Paima Engine Core` that serves as an entry point for others to create brand new paima games. You can think of it as taking all of the code from one of our game repositories that imports the `Paima Engine Core` modules and hiding it in an executable. This output can then read custom configs and execute the rest of the code needed to implement a game.

## Usage

Currently the library is in development, unpublished, and to be used and tested locally.

This guide assumes you're already familiar with the whole paima tech stack. It summarizes the steps needed to package `paima-engine` and distribute it safely to the public. It also explains the different steps we had to take for now and their limitations.

## Development

To try out `paima-engine` as a standalone following steps are needed.

- `npm run prepare:sdk` separates public helper modules from the rest of paima-engine and prepares them in the `packaged/paima-sdk` folder.
- `npm run build:binary` repackages the whole `paima-engine` code accessed from `paima-standalone` into a single JS file and bundles it together with the `paima-sdk`, `templates` and `*.wasm` files into an executable.
- Choose one of the executables and move it to the folder of your choice. Also, create a `.env.${process.env.NODE_ENV || development}` file with the configuration.
- During the first run it will prompt you to select one of the templates you want to use for your game. This can be also passed as an argument to the executable eg. `./standalone-node18 generic`. Then it will prepare the `paima-sdk` and `game` folders for you.
- In the game folder you need to run `npm run initialize` to install dependencies.
- `npm run pack` is then used to build you code for the executable.
- Ensure you have a running database that the executable can connect to.

Running the executable now starts up the `funnel` and created `api` server for the frontend.

## Building the executable

1. In the root folder run `npm run install` if you freshly cloned the repo
2. run `npm run build:binary` in the root folder

The `build:binary` command does the following:

- builds `paima-engine` workspaces
- repackages the whole `Paima Engine Core` into a single `.js` file in CommonJS, because `pkg` doesn't currently support ESM (`packaged/engineCorePacked.js`)
- prepares executables in `packaged/@paima` folder based on `package.json`/`pkg` config (you can modify it to add more targets for example)

## Using the executable

Simply run the standalone appropriate to the system you're currently using.

- config `.env.${NODE_ENV}` with a `.env.development` fallback is used from the folder with the executable

<!-- TODO: mention possible flags (to create templates) expected file structure and pieces of code needed to be implemented. -->

## Current limitations

Paima Funnel contains two dependencies that `pkg` isn't able to pack automatically. In order for that to work, change of how these `.wasm` files are imported in the libraries themselves would be needed. That's why we have a `packaged` folder and we are telling `pkg` explicitly that these 2 files taken from the libraries should be included.

Updating of these two libraries must be done with this in mind.

- `cardano_message_signing_bg.wasm` from `@emurgo/cardano-message-signing-nodejs`
- `cardano_multiplatform_lib_bg.wasm` from `@dcspark/cardano-multiplatform-lib-nodejs`: also `pkg` is not compatible with latest version `@3.1.2` due to error below so `3.1.0` is now used instead.

```
LinkError: WebAssembly.Instance(): Import #4 module="__wbindgen_placeholder__" function="__wbg_getRandomValues_fb6b088efb6bead2" error: function import requires a callable
```
