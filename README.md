<h1 align="center">
  Paima Engine
</h1>
<p align="center">
 A novel game engine designed for building efficient and fully decentralized turn-based blockchain games.
</p>

## Background

Paima Engine works based off of parallel GA state machine technology. It is currently designed to work with EVM-based blockchains, however there is nothing inherently preventing us from targeting other chains as well.

Of note, `Paima Engine` refers to all of the following components:

- `Paima Storage Contract` (The smart contract)
- `Paima Funnel` (The library which enables reading from Paima Contract)
- `Paima SM` (The framework which enables building the game logic state machine)
- `Paima Executor` (The library which enables building `RoundExecutor`s and `MatchExecutor`s)
- `Paima Tx` (The library which aids in building transactions)
- `Paima Utils` (The Library which holds auxillary functions between the other modules)
- `Paima Engine Runtime` (Runtime which connects all the other portions of the engine together)
- `Paima Prando` (Custom fork of a deterministic pseudo-RNG generator library)

## How It Works

The `Paima Contract` is deployed on-chain which allows users to submit game input via transactions. Game input is a properly encoded piece of data which is then read and funneled by `Paima Funnel` to the game's state machine (implemented via `Paima SM`). When consumed by the game's state transition function, if the game input is valid then it is used to transition the global game state from state A to state B.
