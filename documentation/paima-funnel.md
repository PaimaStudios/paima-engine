## Paima Funnel

A core library which allows a consumer to initialize a chain funnel object which holds state regarding:

- The blockchain node (aka. nodeUrl)
- The deployed Paima Contract address (aka. storageAddress)
- The set of `ChainDataExtension`s that the developer provided

Thus the internal fields should be:

```ts
nodeUrl: string;
storageAddress: string;
extensions: ChainDataExtension[];
```

Thus to initialize a `PaimaFunnel` the developer should call:

```ts
const nodeUrl = "https://...";
const storageAddress = "0x...";
const extensions = [...];
const chainFunnel = PaimaFunnel.initialize(nodeUrl, storageAddress, extensions);
```

`PaimaFunnel` will have one primary method which gets used to acquire `ChainData` (akin to the `readData` function from existing `storage.ts`, but now simplified):

```ts
// `latestProcessedBlockHeight` will come from the game database.
// `readData` now only takes a single specific block height as input,
//  and either returns the `ChainData` if the block exists, else returns null if the block does not exist
const latestChainData = chainFunnel.readData(latestProcessedBlockHeight + 1);
```

As such, the `ChainData` received from the funnel can be supplied to the game state machine and thus transition the game state forward. The `readData()` method is polled every X seconds, thereby providing a simple interface that will also interact well with the Paima Engine Runtime.
