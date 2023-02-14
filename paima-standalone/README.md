# Paima Standalone

Wrapper around `Paima Engine Core` that serves as an entry point for others to create brand new paima games. You can think of it as taking all of the code that imports the `Paima Engine Core` modules directly and hiding it in an executable. This output can then read custom configs and execute the rest of the code needed to implement a game.

## Usage

Currently the library is in development, unpublished, and to be used and tested locally.

This guide assumes you're already familiar with the whole paima tech stack. It summarizes the steps needed to package `paima-engine` and distribute it safely to the public. It also explains the different steps we had to take for now and their limitations.

## Creating the executable

To try out `paima-engine` as a standalone following steps are needed.

- `npm run prepare:sdk` separates public helper modules from the rest of paima-engine and prepares them in the `packaged/paima-sdk` folder.
- `npm run build:binary` repackages the whole `paima-engine` code accessed from `paima-standalone` into a single JS file and bundles it together with the `paima-sdk`, `templates` and `*.wasm` files into an executable.

Individual commands described in more detail below.

### npm run prepare:sdk

Scope: `paima-engine` root folder

This command is intended to be used only if you:

- pulled a fresh repository (don't forget to run `npm i` as well)
- made changes to `paima-egine` public modules (_paima-concise_, _paima-executors_, _paima-prando_, _paima-tx_ or _paima-utils_)

It does a clean rebuild of the whole `paima-engine`, not just above mentioned modules.

### npm run build:binary

Scope: `paima-engine` root folder

This command does following 3 steps:

- builds `paima-engine` workspaces
- repackages the whole `Paima Engine Core` into a single `.js` file in CommonJS, because `pkg` doesn't currently support ESM (`packaged/engineCorePacked.js`)
- prepares executables in `packaged/@paima` folder based on `package.json`/`pkg` config (you can modify it to add more targets for example)

## Using the executable

- Choose one of the executables compiled in [previous section](#creating-the-executable) and move it to a folder of your choice. Also, create a `.env.${process.env.NODE_ENV || development}` file with the configuration.
- During the first run it will prompt you to select one of the templates you want to use for your game. This can be also passed as an argument to the executable eg. `./standalone-node18 generic`. Then it will prepare the `paima-sdk` and `game` folders for you.
- In the game folder you need to run `npm run initialize` to install dependencies.
- `npm run pack` is then used to build you code for the executable.
- Ensure you have a running database that the executable can connect to.

Running the executable now starts up the `funnel` and created `api` server for the frontend.

Individual commands described in more detail below.

### npm run initialize

Scope: `game-template` root folder created by the executable

We're using this custom command to ensure the installation of `paima-sdk` dependencies before installing the dependencies of the _game-template_ (due to [npm preinstall issue](https://github.com/npm/cli/issues/2660))

### npm run pack

Scope: `game-template` root folder created by the executable

Command used during the development process. Once a testable feature is prepared, this command will bundle needed files into 2 javascript files expected by the executable.

Files are copied to the parent folder (where the executable should be).

## `paima-engine` vs `paima-standalone`

Using the standalone for a new game development is quite similar to our current approach. Public paima modules are now a part of `paima-sdk` and user has no access to the `paima-engine`, hence the imports must be updated. The other differences are described in this section.

### Docker

The standalone currently doesn't have any docker setup. It expects a running database and the server is created by the executable with no other dependencies.

Connection to the database is done through the env config file.

Since the database is no longer created by docker, you need to initialize it explicitly. For that we currently have `db/migrations/init` folder containing `init.sql` and `down.sql` for the initial setup and teardown.

### Backend - index.ts

This file was the main connection point between a new game and `paima-engine`. In order to eliminate this connection all of the logic was moved over to `paima-standalone`. That now takes care of:

- initializing the `paima-funnel`
- initializing the `paima-sm`: the logic (previously as default export from `sm.js`) is now hidden in the standalone and only the router is replaced with recompiled `backend.cjs` code (backend module)
- initializing&running the `paima-runtime`: `registerEndpoints` function from the `api` module is now replaced with recompiled `registerEndpoints.cjs` code (api module)
- setting the DB pool was removed from this file. Now done internally in paima-engine (can be accessed with `getConnection` from `paima-sdk/utils`)

### Backend - sm.js

The game state transition router function from this file was moved to `index.ts`. PaimaSM initialization is now done internally by the standalone.

### Backend/stf - parser.ts

Previously, we utilized knowledge about how the inputs are constructed to parse them. This knowledge is now hidden from the end user so parser must utilize our _paima-concise_ module that splits the input into its prefix and individual values.

Parsing is then done only based on the prefix and validations are run afterwards on individual values.

### API & DB

Other than moving the initial `.sql` setup from docker to the DB module directly, no changes were needed here.

`tsoa` is still used to generate the server routes and `pgtyped` is still used to generate runnable queries.

### Middleware

No visible changes done for this module. Usage (+repackaging step) remains the same to connect FE of the game with the BE.

### Other omissions

Paima standalone game templates intentionally left out the following modules from our internal setup:

- docker (as mentioned above)
- documentation
- integration-testing
- test-frontend

## Current limitations

Paima Funnel contains two dependencies that `pkg` isn't able to pack automatically. In order for that to work, change of how these `.wasm` files are imported in the libraries themselves would be needed. That's why we have a `packaged` folder and we are telling `pkg` explicitly that these 2 files taken from the libraries should be included.

Updating of these two libraries must be done with this in mind.

- `cardano_message_signing_bg.wasm` from `@emurgo/cardano-message-signing-nodejs`
<!-- TODO: can be removed after https://github.com/PaimaStudios/paima-engine/pull/78 is merged -->
- `cardano_multiplatform_lib_bg.wasm` from `@dcspark/cardano-multiplatform-lib-nodejs`: also `pkg` is not compatible with latest version `@3.1.2` due to error below so `3.1.0` is now used instead.

```
LinkError: WebAssembly.Instance(): Import #4 module="__wbindgen_placeholder__" function="__wbg_getRandomValues_fb6b088efb6bead2" error: function import requires a callable
```
