# inverse-whirlpool

A smart contract for minting Cardano native tokens with updatable CIP-25 metadata.

## Overview

This application consists of two validator files:

- `validators/true.ak`
- `validators/whirl.ak`

A token is minted using the `true.mint` validator where the token name is encoded as the script datum hash. In the same transaction, a token is minted using the `whirl.mint` validator. The minting script in `whirl.mint` internally re-serializes the transaction into CBOR and compares the resulting `blake2b_256` hashes (tx id). If the hashes match then the token metadata is unchanged. Conversely, if the token metadata was altered, the tx_id from `truk.ak` will no longer match the script datum's hash. Using this methodology, we are now able to implement low level control logic operations on a token's metadata.

## Building

To compile the contract, execute the following command in the root directory of this project:

```sh
aiken build
```

A `plutus.json` file will be generated.

## Testing

To run all tests, simply do:

```sh
aiken check
```

To run only tests matching the string `foo`, do:

```sh
aiken check -m foo
```

## Executing

To execute on-chain, some `nodejs` based off-chain code is provided in the `src` directory for a CLI based interaction. The `node` version used in developing this application was: `v20.2.0`

### Initializing

First, run `npm install` to install the required `node` packages for the CLI application. Next, set up a `.env` file with API keys for a provider. Not all variables must be defined, only at minimum the provider you choose to work with. The default provider Blockfrost. Your `.env` may look like so:
```
DEMETER=<Demeter API Key>
KUPO_URL="https://<network>.<Kupo URL>"
OGMIOS_URL="wss://<Ogmios URL>"
BLOCKFROST_PREVIEW=<network><key>
```
A provider is used to broadcast the transaction to the network. API keys may be obtained from the providers here:
* [Demeter](https://demeter.run/)
* [Blockfrost](https://blockfrost.io/)


Additionally, the off-chain code expects a `seed.txt` file in the `src` directory with sufficient funds. If no existing wallet is provided, you may generate one with the following command:
```
npm run execute init
```
And if on the testnet, you may fund it with this [faucet](https://docs.cardano.org/cardano-testnets/tools/faucet/).


### Minting
To mint an initial token, you can define metadata in the `metadata.json` file, and execute the following command. A sample `metadata.json` file is provided.
```
npm run execute mint
```
You can append a `-p` or `--preview` flag to the command to execute on the test network.
```
npm run execute mint -p
```

### Burning

You may burn your token
```
npm run execute burn
```
You can append a `-p` or `--preview` flag to the command to execute on the test network.
```
npm run execute burn -p
```

### Updating metadata

You may update the token metadata by changing the default `metadata.json` file, or creating a new metadata file and pointing to it with the `-m` or `--metadata` flag.
```
npm run execute update
```
You can append a `-p` or `--preview` flag to the command to execute on the test network.
```
npm run execute update -p
```

## Resources

Find more on the [Aiken's user manual](https://aiken-lang.org).
