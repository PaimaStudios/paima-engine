# Paima DB

A simple package containing database-related code used by `paima-engine`-powered game nodes.

You can find the full docs for Paima [here](https://docs.paimastudios.com/). \
**Note**: We generally recommend using [@paima/sdk](https://www.npmjs.com/package/@paima/sdk) instead of this SDK to get all Paima features as a single package.

## Migrations

(Not to be confused with Data Migrations implemented in `src/data-migrations.ts`)

The `up.sql` and `down.sql` files in the `migrations` directory are intended to represent the base tables required for Paima-engine to function correctly. The code in `src/paima-tables.ts` should correspond to them fully.

Specific game databases do not need to contain these tables, as they will be created automatically if missing. However, if they contain tables with these names but incompatible structures, paima-engine won't be able to function properly. It can be configured to forcefully delete the conflicting tables and create ones expected by paima-engine, however, this is not guaranteed to work with sufficiently complicated deviations and the recommended flow is to simply avoid using tables with these names altogether in your game database.

## Development

To re-generate the queries, you will need a database running with the same connection info as [the config](./pgtypedconfig.json) and then run `npm run compile`.
