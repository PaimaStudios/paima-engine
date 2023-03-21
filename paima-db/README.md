# Paima-db

Paima-db is a simple package containing database-related code used by `paima-engine`-powered game nodes.

## Usage

Currently the library is in development, unpublished, and to be
imported and used locally.

## Migrations

The `up.sql` and `down.sql` files in the `migrations` directory are intended to represent the base tables required for Paima-engine to function correctly. Any specific game database should contain these.

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
