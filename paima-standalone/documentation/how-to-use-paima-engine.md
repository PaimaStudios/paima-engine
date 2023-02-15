# How To Use Paima Engine

To build a game using Paima Engine (standalone) one must first initialize a basic project which provides all of the essentials to get started. Of note, the Paima Engine executable ships with a baked in `paima-sdk` that is fully compatible with the current version, thus providing a batteries-included experience.

## Setting Up An Initial Project

- Create a `.env.${process.env.NODE_ENV || development}` file (`.env.example` base config can be found in most templates `game` folder) with a filled out configuration to connect to your DB/a blockchain node.
- During the first run it will prompt you to select one of the templates you want to use for your game. This can be also passed as an argument to the executable eg. `./standalone-node18 generic`. Then it will prepare the `paima-sdk` and `game` folders for you.
- In the game folder you need to run `npm run initialize` to install dependencies.
- `npm run pack` is then used to build your code to be used with the executable.
- Ensure you have a running database that the executable can connect to (which is specified in the config file)

Running the executable now starts up the `funnel` and created `api` server for the frontend.

Individual commands described in more detail below.

### npm run initialize

Scope: `game-template` root folder created by the executable

We're using this custom command to ensure the installation of `paima-sdk` dependencies before installing the dependencies of the _game-template_ (due to [npm preinstall issue](https://github.com/npm/cli/issues/2660))

### npm run pack

Scope: `game-template` root folder created by the executable

Command used during the development process. Once a testable feature is prepared, this command will bundle needed files into 2 javascript files expected by the executable.

Files are copied to the parent folder (where the executable should be).
