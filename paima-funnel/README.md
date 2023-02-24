# Paima funnel

Paima funnel is a simple object used for reading from the Paima Storage Contract. See [the documentation](../documentation/paima-funnel.md) for more details.

Both Paima funnel and the Paima Contract are currently implemented to be usable on top of EVM-based blockchains.

## Usage

Currently the library is in development, unpublished, and to be
imported and used locally.

## Architecture

The funnel can be viewed as consisting of several layers, roughly corresponding to the different source files:

- `index.ts` contains the top-level object with the initialization function and the main API endpoint of the funnel (`readData`), responsible for ensuring meaningful inputs, logging the querying and returning an empty list of data on error;
  - the lower functions MUST NOT throw an error on invalid data, or it will cause the whole runtime to loop inifinitely;
- `reading.ts` contains functions for retrieving blockchain data from the RPC node;
- `data-processing.ts` contains the required processing of blockchain data, especially of batched inputs;
- `verification-ethereum.ts` and `verification-cardano.ts` are responsible for providing signature verification functions for their respective chains;
- `constants.ts` and `utils.ts` contain additional values and functions used by different layers.

## Development

Install dependencies:

```
npm i
```

To test:

```
npm run test
```

Lint:

```
npm run lint
```
