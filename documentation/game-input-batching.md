# Game Input Batching

One major feature which we will be looking to implement in the near future is game input batching. The idea behind it is that rather than each user submitting their own transactions directly on-chain, instead they:

1. Create a valid game input.
2. Sign the game input + a current moment timestamp with their private key.
3. Provide the game input + signature + their address to a batcher.
4. The batcher compiles the signed game inputs of many users and submits one "batched game input" transaction the contract.

Game input batching provides us with a few major benefits, primarily in the realm of UX:

1. We get some scaling/efficiency benefits in regards to on-chain processing.
2. We can allow users on mobile to merely generate a new keypair without owning any crypto, pay the batcher via in-app purchases, and play the games.
3. We can build "bridges" on any L1 blockchain (ex. Ethereum, Cardano, Algorand, Solana, ...) where users pay the bridge (on-chain) to have the ability to use the batcher (off-chain) to submit their game input for them.
4. We can subsidize users who meet certain requirements to play for free (ex. they own a Paima NFT)

## Paima Engine Support

One of the great things about game input batching is that we can support it on the level of Paima Engine such that every game will be able to automatically get to take advantage of it for free. Furthermore, the implementer of a game state machine does not even have to consider batched game inputs (besides the fact that address types may vary if supporting other L1s).

Specifically, we will support batched game inputs within `Paima Funnel`. Paima Funnel will now be responsible for parsing all submittedData which was sent to the game contract and "deconstructing" all batched game input transactions into individual submittedData. As such, Paima Funnel will still return a single `ChainData` with a list of submittedData, however batched game input submittedData gets split up into many distinct submittedData.

In order for this to be secure, while processing a batched game input transaction Paima Funnel verifies every signature matches for every game input supplied. If not, then that game input is thrown away. As such, when constructing a submittedData, the address will be verified and can be trusted if they end up inside of the `ChainData` (of note, in regular submitted game input this signature validation is performed by the blockchain validators who verified the tx before it was added to a block, so now we have to do it instead). Thus the game state machine will be able to trust the authenticity of all submittedData, whether or not they came from batched game input txs, and not have to even consider how they were submitted.

## Batched Game Input Transaction Standard

We will specify a standard batched game input transactions are required to follow in order to be considered valid.

```
B~
userAddress/userSignature/gameInput/millisecondTimestamp~
userAddress/userSignature/gameInput/millisecondTimestamp~
userAddress/userSignature/gameInput/millisecondTimestamp~
```

Effectively `~` is used as a separator at the batched tx level, and users submit 4 element tuples of `(userAddress, userSignature, gameInput, millisecondTimestamp)` which are encoded as being separated with a `/`. An initial capital `B~` is used to demarcate this is a batched game input transaction.

Thus batching is quite simple overall, and the only extra overhead for game implementors is the fact that game input should never use `~` or `/` or else it will break batched game input parsing.
