# Posting Test Game Inputs To L2 Contract

Once you have the Paima L2 contract deployed for your game together with your game node up and running, you will inevitably want to test sending game inputs to the blockchain
to verify that everything is configured properly.

We will continue to use truffle and manually craft a game input to send to the deployed L2 contract.

## Starting Truffle Console

To interact with the deployed contract and call its methods, you can use `truffle console`, a tool provided with truffle. To proceed you will need:

- The private key of an EVM account on the target network (network L2 contract is deployed on) with sufficient funds to pay for the transaction fees.
- The address of your deployed Paima L2 contract.
- The `smart-contract` directory emitted from the Paima Engine executable (we will be reusing the same one from the deployment guide).

To run the truffle console and connect to the target network, do the following:

1. Navigate to the `smart-contract` directory;
2. Ensure the contract is compiled by running `npx truffle compile` (If you have `truffle` installed globally, omit the `npx` prefix).
3. Set the deployment account private key to an environment variable called `PRIVATE_KEY` and export it. For example, in Bash, run `export PRIVATE_KEY=...` with your private key (without an `0x` prefix) instead of the ellipsis.
4. Start the interactive console by running `npx truffle console --network testnet`.

Reminder, the connection info truffle will use is found in `truffle-config.js`. If you followed the deployment instructions, this config file will be good-to-go, otherwise, please reference [the deployment guide](./deploying-l2-smart-contract.md) for more details.

## Interacting With Your Deployed L2 Contract

You will now be placed inside of truffle's interactive console which will be waiting for your input.

In this console we can now bind to your deployed contract in order to interact with it. Simply input the following command, while replacing `0xAB...EF` with the address of your deployed contract:

```js
contract = await PaimaL2Contract.at('0xAB...EF');
contract = await PaimaL2Contract.at('0xeaDC19a3009884b1c6EF557c0Aac2d38F782E55F');
```

Now that you have the contract bound, you can for example call read-only methods as such:

```js
await contract.fee();
```

To make the output more human-readable, you can call it as follows to convert it before displaying:

```js
contract.fee().then(result => result.toString());
```

## Posting Test Game Inputs

To post game inputs to the contract, we will call the `paimaSubmitGameInput` method on L2 contract.

Of note, we need to address two things:

1. The game input you wish to post must first be converted to a hex string
2. You need to specify a fee for the transaction

The game inputs we post are expected to be manually created (though we recommend using the `builder` in the `Paima Concise` library even for testing to make it simpler for you)
thereby providing an interim method of testing your game code/node configuration. For this example we will use a game input from the chess game template which allows a user to join a lobby.

The following command will convert the UTF text representation of the game input to hex and store it in `gameInput`:

```js
gameInput = web3.utils.utf8ToHex('j|*Xs6Q9GAqZVwe');

```

From here we simply need to request a recommended fee from the smart contract:

```js
fee = await contract.fee();
```

Finally, now that we have everything we need, we can simply issue the transaction to submit our gameInput.

```js
await contract.paimaSubmitGameInput(gameInput, { value: fee });
```

On success you will receive a transaction receipt, where you can see the transaction hash as well as the block height at which the transaction was posted. If you have your
game node configured properly, you will also see it print new logs as it detects the posted game input and attempts to process it.

Congratulations, you have gone through a full end-to-end loop of using Paima Engine!
