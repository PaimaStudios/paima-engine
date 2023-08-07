# Game Input Nonces

See docs

## Paima SM Nonce Garbage Collection

(Not for initial implementation, a future optimization)

While Paima SM is parallelized and running a number of matches in parallel, it can also in parallel perform nonce table garbage collection. Effectively, it can query the DB for all nonces which have a value (block height they were accepted) which is greater than 24 hours worth of blocks, and delete them.

This will likely require telling Paima SM on initialization the block time of the given chain it is deployed on, or having a very high estimate for the slowest blockchain that will be targeted. Exact accuracy does not matter, however it just has to garbage collect anything greater than 24 hours (so we'll likely just have a very high estimate, and even if it ends up being 48 hours instead of 24 hours, this makes no difference, just means we maintain useless state a little longer, but make our lives simpler).
