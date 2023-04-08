# Paima-db

Paima-db is a simple package containing database-related code used by `paima-engine`-powered game nodes.

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

## Migrations

(Not to be confused with Data Migrations implemented in `src/data-migrations.ts`)

The `up.sql` and `down.sql` files in the `migrations` directory are intended to represent the base tables required for Paima-engine to function correctly. The code in `src/paima-tables.ts` should correspond to them fully.

Specific game databases do not need to contain these tables, as they will be created automatically if missing. However, if they contain tables with these names but incompatible structures, paima-engine won't be able to function properly. It can be configured to forcefully delete the conflicting tables and create ones expected by paima-engine, however, this is not guaranteed to work with sufficiently complicated deviations and the recommended flow is to simply avoid using tables with these names altogether in your game database.

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
