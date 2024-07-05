# inverse-whirlpool

A smart contract for minting Cardano native tokens with updatable CIP-25 metadata.

## Overview

This application consists of two validator files:
* `validators/true.ak`
* `validators/whirl.ak`

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

To execute on chain, some off-chain code is provided in the `src` directory. Set up a `.env` file with API keys for a provider, then run `npm install` to install the `node` packages. Finally, run `npm run execute` to execute transaction.

### To Do

* Defining metadata


## Documentation

If you're writing a library, you might want to generate an HTML documentation for it. 

Use:

```sh
aiken docs
```

## Resources

Find more on the [Aiken's user manual](https://aiken-lang.org).
