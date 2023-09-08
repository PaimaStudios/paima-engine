# Paima Batcher

Paima Batcher is the first key component of the Paima Whirlpool infrastructure which enables cross-chain play (via account abstraction layer), paying transaction fees for users automatically, and decreasing overall fees by batching many game inputs together.

## Usage

See the [Paima docs](https://docs.paimastudios.com) for usage

## [DEV] Usage without Docker

You can also run the batcher without using docker, but for this, you will need an instance of postgres running with a database initialized using [`db/migrations/up.sql`](db/migrations/up.sql) and with its credentials specified in `.env.development`. Note also that in such a case, the batcher expects an `.env.development` file, which needs to be present in the batcher's root directory, rather than one directory above that. Once you have this set up, you can run the batcher using the following:

```
npm install
npm run build
npm run dev
```
