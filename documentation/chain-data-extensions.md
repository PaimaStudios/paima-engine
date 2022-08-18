# Chain Data Extensions

As we move forward developing further games with Paima Engine, our long term intention is to continue adding new features in games which are reliant off of on-chain state. Currently, the only on-chain state which is available for a game state machine to consume is the set of submitted data by users to the deployed Paima Contract for the game. All other on-chain state is not passed to the state machine in order to keep the model efficient and prevent database bloat and added complexity creeping in.

Though this may be sufficient for the time being, this must be improved upon such that we can continue to extend the Chain Data which is fed to the game state machine with whatever on-chain state that the game requires. For example, we may want to pull in the state of an NFT (ERC-721) contract, so that users are allowed to do X or Y piece of functionality in-game if they own that NFT.

Thus we will be creating a flow between Paima Storage and PaimaSM which allows the implementer of a game state machine to specify which chain data extensions they wish to use and automatically have access to said data in the database hands-free. This will require a bit of abstracting to arrive at this level of seamlessness, but in this doc we will explore the path to making it happen.

## ChainDataExtensions

Each `ChainDataExtension` will have a corresponding `ChainDataExtensionDatum` type which will hold the data for a given instantiation of an extension. In other words, a `ChainDataExtension` specifies what new data we will be funneling from on-chain, and `ChainDataExtensionDatum` is the actual new data from the chain in the given block.

```ts
// A type which represents an extension that will read from an ERC20 contract
type ERC20Extension = {
  contractAddress: string;
};

// A type which represents an extension that will read from an ERC721 contract
type ERC721Extension = {
  contractAddress: string;
};

// The overarching extension datatype
type ChainDataExtension = ERC20Extension | ERC721Extension;

// A type which represents an update in a user's balance in an ERC20 contract
// A transfer thus would result in two ERC20Update events, one with each person's new balance
type ERC20Update = {
  userAddress: string;
  amount: number;
};

// A type which represents an update to who owns an NFT in a ERC721 contract
type ERC721Update = {
  userAddress: string;
  nftID: string;
};

// The datum of an `ERC20Extension`
type ERC20ExtensionDatum = {
  contractAddress: string;
  updates: ERC20Update[];
};

// The datum of an `ERC721Extension`
type ERC721ExtensionDatum = {
  contractAddress: string;
  updates: ERC721Update[];
};

// The overarching type for extension datums
type ChainDataExtensionDatum = ERC20ExtensionDatum | ERC721ExtensionDatum;
```

This separation between the extension and the extension datum at the type level allow us to more easily integrate this new feature with the rest of Paima Engine.

## Using ChainDataExtensions

When an implementor is instantiating Paima Funnel, they will be able to specify (a potentially empty) list of `ChainDataExtension`s.

```

nftExtension =

extensions = []

const chainFunnel = PaimaFunnel.initialize(nodeUrl, storageAddress, extensions);

```

## Updating ChainData

As such, `ChainData` will now have a new field which holds all of the extension datums:

```ts
export interface ChainData {
  timestamp: number;
  blockHash: string;
  blockNumber: number;
  submittedData: SubmittedChainData[];
  extensionDatums: ChainDataExtensionDatum[];
}
```

---

Make sure that when an extension is used, the runtime must start polling from a block height that was before any of the contracts were deployed. Thus all events that take place (ie. all NFT mints/transfer events) are accounted for and are saved in the DB so the state machine has proper access to a valid copy of the current state of the contract.
