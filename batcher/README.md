# Paima Batcher

Paima Batcher is the first key component of the Paima Whirlpool infrastructure which enables cross-chain play (via account abstraction layer), paying transaction fees for users automatically, and decreasing overall fees by batching many game inputs together.

## Preparation

In summary, you will need to:

1. Prepare your root `.env.*` config file to support the batcher,
2. Add your batcher wallet account private key to it,
3. Run the batcher using `npm start`.

First, ensure you have a config file `.env.*` ready in the root directory of your project (where you called `./paima-engine batcher`). Presumably, you already have one there for your game, you just need to add the additional variables required by the batcher. The simplest approach to do this is to append the existing batcher env file into your env file in the directory above:

```
cat .env.devnet >> ../.env.production
```

Of note, one key variable that needs to be set manually to use the batcher is the `BATCHER_PRIVATE_KEY`. This needs to be set as the private key of the wallet intended to be used for creating and posting the batched transactions (note, the wallet needs sufficient funds for posting to the contract). The expected format of the variable is a hex string without the `0x` prefix (ie. exactly what you get from MetaMask under Account details -> Export private key).

## Usage

With all of that said and done, to compile and run the batcher using docker simply run the following in the `batcher` directory:

```
npm start
```

If your env file was set up properly, it will boot the batcher up and have it ready to be used with your game.

Of note, the IP/port (or domain name) that the batcher is running/accessible on will need to be copied and set as the `BATCHER_URI` in your env file. This variable is used by the middleware to allow the game frontend/wallet to seamlessly integrate with the batcher without any extra work on your end.

## Cleanup

At any point after stopping the batcher, you can clean up via the following command:

```
npm stop
```


To clean up after stopping the docker, you can use the following command:

```
npm stop
```

If you want to use an env file named something else, e.g. `.env.XXX`, you simply need to set and export the environmental variable `NODE_ENV` to `XXX` before running the above commands:

```
export NODE_ENV="XXX"
npm start
npm stop
```

Docker will then use `.env.XXX` as the env file.

## [DEV] Usage without Docker

You can also run the batcher without using docker, but for this, you will need an instance of postgres running with a database initialized using [`db/migrations/up.sql`](db/migrations/up.sql) and with its credentials specified in `.env.development`. Note also that in such a case, the batcher expects an `.env.development` file, which needs to be present in the batcher's root directory, rather than one directory above that. Once you have this set up, you can run the batcher using the following:

```
npm install
npm run build
npm run dev
```

If you are not using a fresh clone of the repo and want to ensure a clean install, you can also run the `wipe.sh` script beforehand to delete all compiled files and `node_modules`:

```
./wipe.sh
```
