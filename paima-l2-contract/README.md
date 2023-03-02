# Paima L2 Smart Contract

The Paima L2 Contract is built for developers to deploy their own game L2 which works seamlessly with Paima Engine.

It is currently implemented to be usable on top of EVM-based blockchains.

## Deployment

To deploy the contract, you will need the following:

- Prerequisites installed (in particular, `truffle` and `@truffle/hdwallet-provider`),
- The address and private key of an account on the target network with sufficient funds for deploying the contract (the _deployment account_),
- The address of an account on the target network to be marked as the owner of the contract, capable of withdrawing funds (the _owner account_, can be the same as the deployment account).

When the prerequisites are ready, deploy with the following steps (on the Milkomeda testnet):

1. Navigate to the `paima-l2-contract` directory;
2. Check the contract configuration in `truffle-config.js`, in particular, set the owner address to the address of the owner account;
3. Set the deployment account private key to an environment variable called `PRIVATE_KEY` and export it to child processes, e.g. in Bash, run `export PRIVATE_KEY=...` with your private key (without the `0x` prefix) instead of the ellipsis;
4. Deploy the contract by running `npx truffle migrate --network testnet` and note the address at which the contract was deployed (including the `0x` prefix).

If truffle is installed globally (using the `-g` flag), you can omit the `npx` in the previous command.
To deploy on a different network, add its connection details to `truffle-config.js` and replace `testnet` in the deployment command with the target network's identifier.

## Connecting to the deployed contract

To connect to the deployed contract and call its methods, you can use `truffle console`, a tool provided with truffle. You will need the following:

- Prerequisites installed &ndash; besides `node` and `npm`, `truffle` should suffice and should be installed automatically with `npm install`;
- The private key of an account on the target network, and if you want to execute some methods on the contract, you need sufficient funds on this account;
- The address of the deployed instance of `PaimaL2Contract` you want to communicate with.

First, to run the console connected to the target network, do the following:

1. Navigate to the `paima-l2-contract` directory;
2. Ensure the contract is compiled by running `npx truffle compile`. If you have `truffle` installed globally, omit the `npx` prefix.
3. Set your account's private key to an environment variable called `PRIVATE_KEY` and export it to child processes, e.g. in Bash, run `export PRIVATE_KEY=...` with your private key (without the `0x` prefix) instead of the ellipsis;
4. Start the interactive console by running `npx truffle console --network testnet`. If you have `truffle` installed globally, omit the `npx` prefix.

To connect to a contract deployed on a different network, add its connection details to `truffle-config.js` and replace `testnet` in the `truffle console` command with the target network's identifier.

After performing these steps, you should have the interactive console running and waiting for your input. You can now bind the deployed contract to a variable to be interacted with later using the following command, where you replace `0xAB...EF` with the address of the deployed instance you want to connect to:

```js
contract = await PaimaL2Contract.at('0xAB...EF');
```

Afterwards, you can call the read-only methods that don't need transactions to trigger them as follows:

```js
await contract.fee();
```

To make the output more easily readable, you can call it as follows to convert it before displaying:

```js
contract.fee().then(result => result.toString());
```

To post data to the contract, you must call the `paimaSubmitGameInput` method, for which you need to pay attention to two extra things:

- You cannot directly use a string as the input to the method, you have to convert it to a hex string first,
- You need to send a fee with the transaction.

To convert your message to a hex string, you can use the `web3.utils` package which should be available in truffle console:

```js
message = web3.utils.utf8ToHex('hello');
```

The simplest way to reliably get and later use the specified fee seems to be to get it from the contract and assign it to a variable:

```js
fee = await contract.fee();
```

Finally, you can submit the input as follows:

```js
await contract.paimaSubmitGameInput(message, { value: fee });
```

If everything went as expected, you should get back the transaction receipt, where you can see the transaction hash as well as the block height at which the transaction was posted.

## Development

It is possible to build on top of the default Paima L2 contract to include more complex fee schemes, different ownership setups, or other novel ideas.

Install dependencies:

```
npm i
```

If you want to change the PaimaL2Contract (`./src/contract/PaimaL2Contract.sol`)
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
