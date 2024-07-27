# Paima Assertions

Valid concisely encoded game input when using Paima Engine relies on a simple standard of using a utf-8 encoded string that separates values by a `|`. For example in catapult, to submit moves in a match we use this current schema for game input:

```hs
s|
lobbyID|
roundNumber|
move1|
move2|
move3|
```

In practice:

```
s|83aomafiooao...|5|r1|f6|t|
```

As such we can consider these values inside of the `|`s to be values which pertain to game state. In other words, these are values which the game state machine can validate itself and determine if they are valid and can be applied to the game state, or thrown away because they are invalid.

However we come to an impasse, what if the user wants to submit state from the underlying blockchain into the game? The most obvious example is that the user may want to use an NFT they own inside of the game. This ownership claim/assertion is something that the game state machine cannot in and of itself verify because it does not have access to the global blockchain state.

One approach would be to use [Chain Data Extensions](chain-data-extensions.md), however this only works for specific contracts. In the case of NFTs, each NFT collection has its own contract, and forcing games to ad-hoc keep tracking more and more contracts which bloats out each of their game state DBs further (and repeats the same state across game DBs as well uselessly) is not a good path forward.

## Assertions

As such we can come up with a new model which addresses this specific use case and has the potential to be expanded in the future as well if needed. We will create a blockchain state assertion system which allows users to submit assertions together with their game input.

### Strong Assertions

A strong assertion is a valid game input string following the previous `|` based standard, however with a new strong assertion syntax added to the mix. Let's take a look at an NFT ownership strong assertion:

```js
n<0x83ae1i38a9...|925>
```

As can be seen, strong assertions use a `X<input|input|input|...>` syntax, where the prefix `X` is one or more lowercase letters which specify the assertion (and thus also specify how many inputs are expected).

An assertion makes a claim about the underlying blockchain state which _must_ be true in order for the game input to be considered valid. Thus if a single one of the assertions in a game input string fail to validate at the current block height, then the game input is thrown away before it is even fed to the game state machine.

Of note, what makes a strong assertion _strong_ is if the assertion processor is unable to verify the strong assertion (ex. the NFT indexer is offline for some reason), **this acts as a blocking event**. The processor keeps retrying until the assertions can be verified, and the game state machine does not continue to progress forward. This is vital to know, because strong assertions inherently impact global game state in such a way that the validity of the assertion is required for the history to not fork in a game-breaking way.

### Weak Assertions

A weak assertion is a valid game input string with a new weak assertion syntax added to the mix.

```js
n{0x92aya2h2a...|324}
```

Weak assertions are _weak_ because they inherently are not vital for the proper functioning of game logic in the game state machine. This means that if the processor is unable to verify a weak assertions (ex. the NFT indexer is offline), then **this does not act as a blocking event**.

Instead, if a game input with a weak assertion cannot be verified, then Paima Assertions caches the game input and retries verifying the assertion the next time a new ChainData is submitted to it. If the assertion processor is able to validate the weak assertion at that point in time, then this game input is added to this new ChainData and pushed to the SM.

Of note, weak assertions can only ever be used to assert some L1 state which is never used in game logic itself, but is simply designed to cache/store L1 data so that it can be visually displayed/provided to players. This is because weak assertions break determinism of when they are saved to the game state DB, thus they cannot be relied upon to provide any guarantees.

In other words, weak assertions are likely to primarily be used for users choosing their NFTs to be displayed in matches. (Maybe could theoretically be used in some other context where one is submitting/creating entirely new state which does not matter at what height it gets accepted, but the fact it does get accepted is what matters)

### Other Assertion Notes

- Assertions should be included at the very back of the game input string.
- Game input can still be invalid even if all assertions in the game input are valid.
- Invalid assertions with either too many inputs, invalid inputs, or with an unsupported prefix are thrown away.

## Assertion Processors

In order for assertions to be validated, every submittedInput goes through one or more assertion processors if it has assertions inside of the input. The processors (usually attached to an indexer of blockchain state) then either returns one of three options:

- `true`
- `false`
- `retry`

Strong assertions can only return `true` or `false` (meaning either they are valid or not), while weak assertions can also return `retry` (which means that the processor could not validate the weak assertion at that moment, and should be retried together with the following ChainData).

To support this, there will be a new flow that Paima Engine Runtime follows from on-chain to the state machine:

```
Paima Funnel -> Paima Assertions -> Paima SM
```

# Paima Assertions Implementation

To follow in line with the rest of the interfaces for Funnel and SM, Paima Assertions will be a new module with an initializable object which consumers must create and provide to the Paima Engine Runtime:

```js

assertions = PaimaAssertions.initialize(maxAssertionsPerInput)

...

engine = paimaEngine.initialize(chainFunnel, gameStateMachine, assertions);

```

When initializing Paima Assertions for a specific game, the consumer must also specify the maximum number of assertions that are allowed to be a part of the input data. This allows Paima Assertions to filter input data which has too many assertions, and prevent attacks where bad actors may try to DoS with too many assertions.

Once the Paima Assertions object is initialized (and before feeding it to the runtime), the user can add assertion processors which are currently supported.

```js
assertions.addNFTProcessor(nftIndexerURL);
```

Each processor is expected to be an object with a `processInput` function and implemented such that they can be added to the Paima Assertions object via a `.addXProcessor(...)` function. The `processInput` function takes a submittedData string, and processes the relevant assertions in the string. In the case of the NFT processor, it processes any assertions starting with an `n` prefix.

After validating all relevant assertions in the game input, if the processor finds that any are invalid, then the function returns `false`. Else, if they all validate and/or no relevant assertions are part of the submittedData, then the function returns `true`. And in the case of weak assertions, they can also return `retry` if the processor is unable to validate in that moment.

The Paima Assertions object has it's own `processChainData` function which Paima Engine Runtime will call, which then automatically calls each added processor's `processInput` function for each submittedData in the supplied ChainData. If all processors return `true` for a given submittedData, it passes and is kept in the ChainData. If any return `false`, then that piece of submittedData is thrown away.

Once all of the submittedData has been validated, the `processChainData` function returns a new ChainData to the runtime with any submittedData that contained invalid assertions thrown away, and any weak assertions previously marked as `retry` which have validated this time around now added to submittedData as well.

The runtime then pushes the new ChainData to the SM, thus finishing the assertion validation part of the backend flow.

## Current Implemented Assertion Processors

In this section we will specify the assertions which currently have/will have processors implemented for them.

### NFT (ERC 721) Ownership Assertions

#### Strong Assertion

This strong assertion makes the claim that the user who submitted the game input has ownership of the given NFT at the block height it was submitted.

This strong assertion has a `n` prefix, and two input values. The first input value is the ERC721 contract address, and the second value is the id of the NFT that the user is claiming to own.

```
n<0x83ae1i38a9...|925>
```

For the NFT assertion processor, it will be hitting the `historical-owner` endpoint of the NFT Indexer [indexer source for reference](https://github.com/PaimaStudios/historical-nft-indexer/blob/master/src/lib/api/routes.ts#L29-L33).

#### Weak Assertion

This weak assertion makes the claim that the user who submitted the game input has ownership of the given NFT at the block height when it is processed. In other words, if the weak assertion was `retry`ed and originally was for block height X, it is now verified by the processor for the current block height X+5.

This weak assertion has a `n` prefix, and two input values. The first input value is the ERC721 contract address, and the second value is the id of the NFT that the user is claiming to own.

```
n{0x83ae1i38a9...|925}
```
