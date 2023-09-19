<h1 align="center">
  Paima Engine
</h1>
<p align="center">
 Paima is a Web3 Engine optimized for games, gamification and autonomous worlds that allows building web3 applications in just days.
</p>
<p align="center">
<a href="https://docs.paimastudios.com">Documentation</a>
</p>

## Background

Paima is a framework for creating app-specific layer 2s (L2s) as sovereign rollups. That is to say: apps publish transactions to a blockchain for ordering and data availability, but uses its own code to determine the correct app state.

Of note, `Paima Engine Core` refers to all of the following modules:

- `Paima Storage Contract` (The smart contract for storing game inputs)
- `Paima Funnel` (The library which enables reading from Paima Contract)
- `Paima SM` (The framework which enables building the game logic state machine)
- `Paima Engine Runtime` (Runtime which connects all the other portions of the engine together)

While `Paima Engine SDK` refers to these modules:

- `Paima Executors` (The library which enables building `RoundExecutor`s and `MatchExecutor`s)
- `Paima Middleware Core` (The library which aids connecting frontends to Paima logic)
- `Paima Utils` (The Library which holds auxillary functions between the other modules)
- `Paima Utils Backend` (Utils which are purely for backend (and may not work in a browser environment))
- `Paima Build Utils` (Helps build the Paima components used user projects)
- `Paima Prando` (Custom fork of a deterministic pseudo-RNG generator library)
- `Paima Concise` (The library which enables building and parsing concise encoding)
- `Paima Crypto` (Has utility functions for all cryptography and blockchains Paima supports)
- `Paima Providers` (Handles connection to wallet standards for all blockchains Paima supports)
- `Paima DB` (Handles utility functions to handling the Paima database)

Then we also have a `Paima Engine Standalone` which is a module that utilizes `Paima Engine Core` to provide easy to use and secure way of creating new games by the public. This is achieved by creating an executable with the bundled core that has two main responsibilities:

- **generate new game template** - prepare needed files and empty functions to implement custom game logic with minimal effort
- **run paima engine** - start up the whole backend with no setup needed utilizing user's config and executing user's code added into the generated templates

## How It Works

The `Paima Contract` is deployed on-chain which allows users to submit game input via transactions. Game input is a properly encoded piece of data which is then read and funneled by `Paima Funnel` to the game's state machine (implemented via `Paima SM`). When consumed by the game's state transition function, if the game input is valid then it is used to transition the global game state from state A to state B.

## How to Build

Paima Engine is a TypeScript monorepo implemented with npm (not Yarn nor Lerna) workspaces. The `package.json` file at the root indicates all the common dependencies (mostly devDependencies like TypeScript, ESLint etc.), and the root `tsconfig.json` indicates the common TypeScript configuration. Every package has also its own `package.json` and `tsconfig.json` files indicating their particular configuration.

1. `npm install` (generate the common `node_modules` folder with all the combined dependencies of all packages)
1. `npm run build` (to see if the build succeeds)
1. `npm run release` (for production builds. see `bin` folder for build result)
