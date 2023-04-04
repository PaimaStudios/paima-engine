# Paima funnel

Paima funnel is a simple object used for reading from the Paima Storage Contract. See [the documentation](../documentation/paima-funnel.md) for more details.

Both Paima funnel and the Paima Contract are currently implemented to be usable on top of EVM-based blockchains.

## Usage

Currently the library is in development, unpublished, and to be
imported and used locally.

## Architecture

The funnel can be viewed as consisting of several layers, roughly corresponding to the different source files:

- `index.ts` contains the top-level object with the initialization function and the main API endpoints of the funnel (`readData` and `readPresyncData`), responsible for ensuring meaningful inputs, logging the querying and returning an empty list of data on error;
  - the lower functions MUST NOT throw an error on invalid data, or it will cause the whole runtime to loop inifinitely;
- `paima-l2-reading.ts` contains functions for retrieving main blockchain data from the RPC node;
- `cde.ts` and `cde-*.ts` additionally process CDE data;
- `data-processing.ts` contains the required processing of blockchain data, especially of batched inputs;
- `verification-*.ts` are responsible for providing signature verification functions for their respective chains;
- `constants.ts` and `utils.ts` contain additional values and functions used by different layers.

### Error handling

There are at least two kind of issues the funnel can encounter when processing chain data which need to be processed differently:

- Invalid data on-chain &ndash; as long as the input was read correctly, this _must_ be handled as if the input was not there at all and cannot raise an error that would lead to retries;
- Error while reading data &ndash; usually connection issues, these operations need to be retried. Helper functions can generally handle this by simply throwing (or not catching) an error, on the top-level (funnel's `readData` and `readPresyncData` methods) this can be handled by returning an empty list of data units (rather than a non-empty list of data units containing no data).

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
