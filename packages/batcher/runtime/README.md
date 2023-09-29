# Paima Batcher Runtime

The overarching runtime.

Currently the library is in development, unpublished, and to be
imported and used locally.

## (Outdated) Usage

To run the batcher, it is recommended to use the instructions in [the root `README.md`](../README.md), but some of the details of what needs to happen under the hood relevant directly to this package are briefly described here.

Before running, you need to have an instance of postgres running with a database initialized with [`db/migrations/up.sql`](db/migrations/up.sql) (running the docker setup will do this for you).

The runtime also expects various environment variables to be set -- see e.g. [`.env.devnet`](../.env.devnet).

Finally, to run the batcher, simply compile the code, then run `node build/index.js`.
