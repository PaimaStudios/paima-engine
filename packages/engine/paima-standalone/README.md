# Paima Engine Standalone

A compiled executable that wraps `Paima Engine Core` which serves as an entry point for others to create brand new games using Paima Engine. Developers specify a configuration + write all of the backend/state machine code of their game, which then goes through a bundling process and is used directly by Paima Engine Standalone to thus run a "game node".

## Building The Executable

To build the `paima-engine` standalone, the following steps are required (in the paima-engine root folder):

1. `npm ci`
2. `npm run build` (required a single time after cloning the repo to build/expose the contract for paima-utils)
3. `npm run prepare:standalone` prepares public helper modules (sdk/docs/etc.) for inclusion in the standalone (`packaged` folder). Also clones all of our available templates.
4. `npm run build:standalone` repackages the whole of paima engine core into a single JS file and bundles it together with paima-sdk, documentation, and templates into an executable.

Steps 3. & 4. can be combined with `npm run standalone`. An executable will be generated for each desktop OS (linux, mac, windows) and will be available in the `/paima-standalone/packaged/@standalone` folder.

Individual commands are described in more detail below.

### npm run prepare:standalone

Scope: `paima-engine` root folder

This command is intended to be used only if you:

- pulled a fresh repository (don't forget to run `npm i` as well)
- made changes to `paima-engine` public modules (_paima-concise_, _paima-executors_, _paima-mw-core_, _paima-prando_, _storage_contract_, or _paima-utils_)

It does a clean rebuild of the whole `paima-engine`, not just the above mentioned modules, and prepares all of the needed public helper modules to be included inside of the standalone executable.

### npm run build:standalone

Scope: `paima-engine` root folder

This command does following 3 steps:

- builds `paima-engine` workspaces
- repackages the whole `Paima Engine Core` into a single `.js` file in CommonJS, because `pkg` doesn't currently support ESM (`packaged/engineCorePacked.js`)
- prepares executables in `packaged/@standalone` folder based on `package.json`/`pkg` config (you can modify it to add more targets for example)

## Paima Engine Core vs Standalone

Using the standalone for developing a new game is quite similar to our current approach. Public paima modules are now a part of `paima-sdk` and user has no access to the `paima-engine` (core), hence the imports must be updated. The other differences are described in this section.

### Docker

The standalone currently doesn't have any docker setup. It expects a running database and the server is instantiated by the executable with no other dependencies.

Connection to the database is done through the env config file.

Since the database is no longer created by docker, you need to initialize it explicitly. For that we currently have `db/migrations/init` folder in each template containing `init.sql` and `down.sql` for the initial setup and teardown.

### Backend - index.ts

This file used to be the main connection point between game code and `paima-engine` itself. In order to eliminate this connection all of the logic was moved over to `paima-standalone`. That now takes care of:

- initializing the `paima-funnel`
- initializing the `paima-sm`: the logic (previously as default export from `sm.js`) is now hidden in the standalone and only the router is replaced with recompiled `gameCode.cjs` code (user specified game/backend code)
- initializing&running the `paima-runtime`: `registerEndpoints` function from the `api` module is now replaced with recompiled `endpoints.cjs` code (api module)
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

## Other omissions

Paima standalone game templates intentionally left out the following modules from our internal setup:

- docker (as mentioned above)
- documentation
- integration-testing
- test-frontend

## How To Use Paima Engine Standalone

Refer to [how to guide](https://github.com/PaimaStudios/paima-engine-docs/blob/3f71545c7593415871ca784ba0dd78d9b0a67209/1%20-%20how-to-use-paima-engine.md).

## Debug package content

1. Make sure all the `license` fields in `package.json` are set to a recognized field (no custom strings allowed)
2. `export DEBUG_PKG=1`
3. Build the `dev` build of the paima standalone
4. Run `./packaged/@standalone/dev-paima-engine-linux`
