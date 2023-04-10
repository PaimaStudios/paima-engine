# Paima-utils-backend

Paima-utils-backend is a simple library containing helper functions for other Paima backend libraries. This distinction is to support the separation of code targetting Node.js specifically from code targetting browsers specifically from code meant for use in both.

## Usage

Currently the library is in development, unpublished, and to be
imported and used locally.

### CDE Access

A simple example of how functions in `src/cde-access.ts` can be used follows (picking out one to get a CDE handle and another to get CDE data &ndash; they can be mixed an matched with others wherever it makes sense):

```ts
async function getUserNfts(readonlyDBConn: Pool, userAddress: string): Promise<string[]> {
  const cdes = await getCdeIdByAddress(readonlyDBConn, NFT_CONTRACT_ADDRESS);
  if (cdes.length === 0) {
    throw new Error('NFT CDE not registered!');
  }
  const cde = cdes[0];
  const ownedAddresses = await getOwnedNfts(readonlyDBConn, cde, userAddress);
  return ownedAddresses;
}
```

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
