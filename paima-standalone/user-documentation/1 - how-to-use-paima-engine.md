# How To Use Paima Engine

Paima Engine is as an all-in-one batteries-included executable which provides you with everything you need to get started writing your own trustless Web3 game.

## Accessing Documentation

If you are reading this, you likely already have access to the Paima Engine documentation. Nonetheless, if you need a new copy simply call the `docs` command and Paima Engine will save a copy of the docs locally.

```bash
./paima-engine docs
```

## Initializing Your Project

When starting a new project with Paima Engine, the developer can choose to either go completely barebones (by only initializing `paima-sdk`) or use an included template to bootstrap with all of the essentials. Initializing the SDK by itself may also be useful in cases where the developer is upgrading their project to use a new version of Paima Engine which has introduced new incompatibilities in the SDK.

You can see the available options by using:

```
./paima-engine init
```

To initialize a game using a basic game template use the following command and select the `generic` template:

```
./paima-engine init template
```

Once the command has finished, you will notice two new folders have been created, `paima-sdk` and `generic-game-template` (name varies based on template selected). The SDK is directly used by the game template, and so all code you write will be in the `generic-game-template` folder.

Lastly to finish the initialization process off, simply go into the `generic-game-template` folder and run `npm run initialize`. This will install all of the packages and set the project up to be ready for you to start coding.

Of note, feel free to rename the `generic-game-template` folder to the name of your game (or whatever you prefer), but make sure to not change the folder name of `paima-sdk`.

## Packing Your Game Code

The specifics of writing your game code is outside of the scope of this current getting started guide, thus we will move on to packing your game code to be run with Paima Engine.

As the `generic-game-template` folder has already been initialized in the previous section, we can move forward with packing the game code (you can pack the generic game template without writing any new code initially to test). Simply use the following command in the folder:

```
npm run pack
```

This will generate two files (`gameCode.cjs` and `endpoints.cjs`) which will be placed in a `packaged` folder (located next to the executable). The former file holds the vast majority of the "game" (all of your code related to your game logic and state transitions) and the latter holds code related to setting up the webserver endpoints of your game node.

Both of these files need to remain in the `packaged` folder (which is required to be in the same root folder as the Paima Engine executable itself).

## Setting Up Your Game Node DB

Paima Engine requires you to deploy a Postgres database which will be used to store all state of your game node.

For those already experienced with setting up a Postgres DB, feel free to skip over the majority of this section. One important note however is that each game template also includes a `init.sql` file in the `/db/migrations/init` folder which you should use to initialize the database.

### Using Docker To Setup A Postgres DB

For those who prefer an automated solution, simply proceed with the following steps to have a local Postgres database ready-to-use with your game node:

1. Install docker/docker compose on your computer (https://docs.docker.com/compose/install/)
2. Go into the root folder of your game code (ie. `generic-game-template`) in your terminal.
3. Run `npm run database:up`
4. Docker compose will automatically download and setup Postgres for you, while also using the `init.sql` from your game code to initialize the DB.
5. Your DB will be up and running, and can be closed via `Ctrl + c` like any CLI application.
6. Any time you want to bring the DB back online, simply re-run `npm run database:up`.

### Updating Your init.sql

One side note, as you begin writing your game logic (or when building a template) you likely will end up changing the DB schema from the base template you started off with. When you do this, make sure to update the `init.sql` file to properly initialize your DB schema so that future game nodes either you or others deploy for your game will be able to properly work with your game logic.

## Deploying Your Game's L2 Smart Contract

Each game built with Paima Engine is its very own Layer 2. This means that you will need to deploy the Paima L2 Smart Contract for your game, to whichever chain you wish to launch on.

Reference the [Deploying L2 Smart Contract](./2%20-%20deploying-l2-smart-contract.md) documentation to easily deploy the contract.

## Setting Up Your Game Node Config

You may have noticed that during the initialization process a `.env.development` file was created in the root folder. The Paima Engine executable will read this file (or specifically `.env.${process.env.NODE_ENV || development})` when attempting to start running your game node.

Thus you must fill out this env file with all of the pre-requisites to proceed forward.

Specifically with the included barebones config, you must specify:

- `CHAIN_URI` (A URL to the RPC of an EVM chain node of the network you are targeting)
- `CONTRACT_ADDRESS` (The contract address of your deployed Paima L2 Smart Contract for your game)
- `START_BLOCKHEIGHT` (The block height that your smart contact was deployed on, so Paima Engine knows from what block height to start syncing)
- Postgres DB Credentials

## Running Your Game Node

Now that your game code is packed, contract and DB deployed, and your config is ready, we can now start your game node via the Paima Engine executable.

Simply go into the root folder and run the following command:

```
./paima-engine run
```

If you forgot to pack your code, your config is not properly setup, or anything else as such, you will get an error.

Otherwise if everything was setup correctly then you will have officially started your game node for the very first time! You will see some initial boot logs, and after a few seconds see the progress of your game node syncing from the blockchain as such:

```bash
q125-q225
q225-q325
q325-q425
...
```

These logs denote the block height numbers that the game node is syncing from the deployed L2 smart contract on the blockchain. Other logs will also pop up, such as when game inputs are read from the contract. Of note, logs are also saved in the `logs.log` file for easy access.

## Testing Out Your Game Node

Now that your game node is syncing, we recommend testing to ensure that both the contract you deployed and the node itself are all in working order/configured properly.

Simply follow the [posting test game inputs to L2 contract tutorial](./3%20-%20posting-test-game-inputs.md) and within a couple minutes you'll have experienced the end-to-end loop of using Paima Engine!

Of note, the above tutorial teaches you an easy way to manually submit custom-crafted game inputs, which is also useful when implementing new features as you develop your games/apps.

## Deploying Your Game Node

If you wish to deploy your game on a server/move into a production environment, the following files are all that is needed for Paima Engine to run your game node:

- `packaged/gameCode.cjs` (packed game code)
- `packaged/endpoints.cjs` (packed webserver code)
- `.env.*` (Your game node config)
- `paima-engine` (The Paima Engine executable)

In other words, you do not require your unpacked game code or `paima-sdk`, allowing you to easily run your game node wherever you deem best (without even needing node installed or any external dependencies).

## Snapshots

Lastly, if you have `pg_dump` installed on the machine running your game node (typically included in the postgres package of your OS), then Paima Engine will automatically take snapshots every day of your game node DB and store them in a `snapshots` folder. The last 3 days of snapshots are maintained, and everything older is automatically deleted.

If `pg_dump` is not available, then when you start your game node an error will be printed in the terminal denoting of such, however the game node will still function perfectly fine nonetheless (and will simply skip taking snapshots).

Of note, unlike in the Web2/2.5 world, these snapshots are _not vital_. You are building a trustless Web3 game using Paima Engine, which means that even if your entire DB gets corrupted or deleted, a brand new game node can be synced from scratch by just reading from the blockchain. These snapshots are simply a quality-of-life enhancement, as they allow you to deploy new game nodes much faster without having to resync from scratch.
 

## Data Migrations

Data Migrations allow game developers to add data to the database e.g., World Setup, NPC, Items, and other system tables.  

IMPORTANT: You should never add data to the database manually. It should be done only through state-transitions and data migrations.

Data Migrations are applied at a specific block-height. The file name indicates the OFFSET from the START_BLOCKHEIGHT (defined in the .env file).

File structure:

```
root_folder
   | --- paima-sdk
   | --- paima-engine-{linux|macos}
   | --- packaged
             | --- endpoints.cjs
             | --- gameCode.cjs
             | --- migrations
                          | --- 1000.sql
                          | --- 5500.sql
``` 

1000.sql will be applied at block-height START_BLOCKHEIGHT + 1000.  
5500.sql will be applied at block-height START_BLOCKHEIGHT + 5500.  
Both will be applied before any other inputs are processed for that block-height.

The *.sql files are PGSQL scripts. We ABSOLUTELY recommend writing your SQL script as a transaction, so if it fails the block-process-loop will stop and the script can be fixed and reapplied.

1000.sql example:
```
BEGIN; 
-- INSERT... ; 
-- UPDATE ...; 
COMMIT;
```






