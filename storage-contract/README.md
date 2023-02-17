# Paima L2 Smart Contract

The Paima L2 Contract is built for developers to deploy their own game L2 which works seamlessly with Paima Engine.

It is currently implemented to be usable on top of EVM-based blockchains.

## Deployment

To deploy the contract, you will need the following:

- Prerequisites installed (in particular, `truffle` and `@truffle/hdwallet-provider`),
- The address and private key of an account on the target network with sufficient funds for deploying the contract (the _deployment account_),
- The address of an account on the target network to be marked as the owner of the contract, capable of withdrawing funds (the _owner account_, can be the same as the deployment account).

When the prerequisites are ready, deploy with the following steps (on the Milkomeda testnet):

1. Navigate to the _storage-contract_ directory;
2. Check the contract configuration in `truffle-config.js`, in particular, set the owner address to the address of the owner account;
3. Set the deployment account private key to an environment variable called `PRIVATE_KEY` and export it to child processes, e.g. in Bash, run `export PRIVATE_KEY=...` with your private key (without the `0x` prefix) instead of the ellipsis;
4. Deploy the contract by running `npx truffle migrate --network testnet` and note the address at which the contract was deployed (including the `0x` prefix).

If truffle is installed globally (using the `-g` flag), you can omit the `npx` in the previous command.
To deploy on a different network, add its connection details to `truffle-config.js` and replace `testnet` in the deployment command with the target network's identifier.

## Development

It is possible to build on top of the default Paima L2 contract to include more complex fee schemes, different ownership setups, or other novel ideas.

Install dependencies:

```
npm i
```

If you want to change the Storage smart contract (`./src/contract/Storage.sol`)
you'll further need Truffle (`npm i -g truffle`) and

```
truffle compile
```

Lint:

```
npm run lint
```

### Test Dependencies

First, install [Foundry](https://github.com/foundry-rs/foundry), for example by running the following command:

```
curl -L https://foundry.paradigm.xyz | bash
```

Then, in a new terminal session (or after reloading your `PATH`), run the following:

```
foundryup
```

To test:

```
npm test
```

or

```
forge test
```

To run the tests with a more verbose output, such as including stack traces of failed tests, the following command can be used:

```
forge test -vvv
```
