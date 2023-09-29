# Paima Batcher Database Queries

A module facilitating interaction with the Batcher database

## Usage

After making any changes to the queries in `src/sql/*.sql`, to make them actually reflect in the typescript code, you need to run the following:

```
npm run generate
```

This will generate the `.ts` files using `pgtyped`. To successfully run this, you also need a postgres instance running with a properly initialized database (see [`./migrations/up.sql`](./migrations/up.sql) for the initialization script) with credentials specified in [`./pgtypedconfig.json`](./pgtypedconfig.json).

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
