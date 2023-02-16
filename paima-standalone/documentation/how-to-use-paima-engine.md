# How To Use Paima Engine

To write a game node using Paima Engine one must first initialize a basic project which provides all of the essentials to get started. Of note, the Paima Engine executable ships with a baked in `paima-sdk` providing a batteries-included experience.

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

This will generate two files (`backend.cjs` and `registerEndpoints.cjs`) in the parent folder (where the executable is). The former holds the vast majority of the "backend" code (all of your code related to your game) and the latter holds code related to setting up the webserver endpoints of your game node.

Both of these files need to remain in the same folder as the Paima Engine executable.

## Setting Up Your DB

Of note, Paima Engine requires for you to deploy a Postgres database which will be used to store all state of your game. The setup process is typical of any Postgres database, however each game template also includes a `init.sql` file in the `/db/migrations/init` folder which you should use to initialize the database.

Later you can edit this `init.sql` with your own custom tables as well when writing your game code.

## Deploying Your Game Smart Contract

...

(include a second markdown file guide and link here)

## Setting Up Your Game Node Config

You may have noticed that during the initialization process a `.env.development` file was created in the root folder. The Paima Engine executable will read this file (or specifically `.env.${process.env.NODE_ENV || development})` when attempting to start running your game node.

Thus you must fill out this env file with all of the pre-requisites to proceed forward.

Specifically with the included barebones config you must specify:

- `CHAIN_URI` (A URL to the RPC of an EVM chain node)
- `STORAGE_ADDRESS` (The address of your deployed smart contract for your game)
- `START_BLOCKHEIGHT` (The block height that your smart contact was deployed on, so Paima Engine knows from what block height to start syncing)
- Postgres DB Credentials

## Running Your Game Node

Now that your game code is packed, contract and DB deployed, and your config is ready, we can now start your game node via the Paima Engine executable.

Simply go into the root folder and run the following command:

```
./paima-engine run
```

If you forgot to pack your code, your config is not properly setup, or anything else as such, you will get an error.

Otherwise if everything was setup correctly then you will have officially started your game node for the very first time! You will see the progress of the game node syncing in the CLI as such:

```bash
q125-q225
q225-q325
q325-q425
...
```

These logs denote the block height numbers that the game node is syncing from the game smart contract on the blockchain. Other logs will also pop up when game inputs are read from the contract, which are all also stored in a `logs.log` file as well for easy parsing/backing up.



- Docker setup
- smart contract command
- documentation command


- Generic template
- Turn Based template (tic-tac-toe)
- Simultaneous Play Template (rock paper scissors)
