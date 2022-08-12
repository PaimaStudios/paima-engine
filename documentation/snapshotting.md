# Database Snapshotting

We need to automatically create local snapshots of the database once every week (every `151200` blocks) which we can use to restore in case the backend dies during applying queries and ends up in an invalid state (currently we do not have full atomicity supported, so this acts as a interim mechanism, and also as an easy way for new backend deployments to be bootstrapped quickly).

## Snapshots Storage & Scheduling

Paima Engine Runtime will now automatically create/use a `snapshots` folder. On startup, the runtime will check the snapshots folder and note the block height when the last snapshot was taken (by reading the file names, which are following the `paima-snapshot-X` standard, where `X` is the block height that the snapshot was taken at). If no snapshot exists, then a snapshot is created at that point.

Once the latest snapshot block height is known, the runtime then adds `151200` blocks to determine the block height N which it is required to take the next snapshot (the logic should check if the block height is greater than or equal to, rather than equal to, to address edge cases of people deleting snapshots in the folder after restoring them).

Once the runtime receives ChainData from Paima Funnel with block height N, and Paima SM finishes processing said ChainData, then it is the Runtime's responsibility to initiate the creation of the snapshot.

## Creating The Snapshot

We will be using [pg_dump](https://www.postgresql.org/docs/current/app-pgdump.html) to create the snapshots because "it makes consistent backups even if the database is being used concurrently."

You can find a pretty straightforward set of instructions for initiating the snapshots by following [this guide](https://soshace.com/automated-postgresql-backups-with-nodejs-and-bash/) all the way up until "compressing the archive" (we will want to do compression).

## Snapshot Deletion

Only 2 snapshots should be kept, thus when a new snapshot is created the runtime should check how many snapshots exist in the folder. If there are 3, then the oldest snapshot must be deleted.
