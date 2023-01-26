<h1 align="center">
  Paima Engine
</h1>
<p align="center">
 A novel game engine designed for building efficient and fully decentralized turn-based blockchain games.
</p>

## Background

Paima Engine works based off of parallel GA state machine technology. It is currently designed to work with EVM-based blockchains, however there is nothing inherently preventing us from targeting other chains as well.

Of note, `Paima Engine Core` refers to all of the following components:

- `Paima Storage Contract` (The smart contract for storing game inputs)
- `Paima Funnel` (The library which enables reading from Paima Contract)
- `Paima SM` (The framework which enables building the game logic state machine)
- `Paima Executors` (The library which enables building `RoundExecutor`s and `MatchExecutor`s)
- `Paima Tx` (The library which aids in building transactions)
- `Paima Utils` (The Library which holds auxillary functions between the other modules)
- `Paima Engine Runtime` (Runtime which connects all the other portions of the engine together)
- `Paima Prando` (Custom fork of a deterministic pseudo-RNG generator library)
- `Paima Concise` (The library which enables building and parsing concise encoding)

Then we also have a `Paima Engine Standalone` which is a module that utilizes `Paima Engine Core` to provide easy to use and secure way of creating new games by the public. This is achieved by creating an executable that has two responsibilities:

- **generate new game template** - prepare needed files and empty functions to implement custom game logic with minimal effort
- **run paima engine** - start up the whole backend with no setup needed utilizing user's config and executing user's code added into the generated templates

## How It Works

The `Paima Contract` is deployed on-chain which allows users to submit game input via transactions. Game input is a properly encoded piece of data which is then read and funneled by `Paima Funnel` to the game's state machine (implemented via `Paima SM`). When consumed by the game's state transition function, if the game input is valid then it is used to transition the global game state from state A to state B.

## How to Build

Paima Engine is a TypeScript monorepo implemented with npm (not Yarn nor Lerna) workspaces. The `package.json` file at the root indicates all the common dependencies (mostly devDependencies like TypeScript, ESLint etc.), and the root `tsconfig.json` indicates the common TypeScript configuration. Every package has also its own `package.json` and `tsconfig.json` files indicating their particular configuration.
To build you must simply run `npm install` at the root folder, which will generate a single, common `node_modules` folder with all the combined dependencies of all packages. Individual package folders do not have a `node_modules` folder, all dependencies are installed at the root.
Once the dependencies have been installed, run `npm run build` to compile the TypeScript files into JavaScript. That's all.

## How to use in Paima games

Games which use Paima Engine must import the whole workspace. The easiest way is to run a file import. The game workspace `package.json` should have something like:

```json
{
  "dependencies": {
    "paima-engine": "file:../paima-engine"
  }
}
```

Then the whole engine will be available to all packages in the game workspace. To import individual packages, e.g. `paima-utils` you can import them as:

```js
import { something } from 'paima-engine/paima-utils';
```

Then run the backend with the following flag:

```
node --experimental-specifier-resolution=node path/to/backend/index.js
```
