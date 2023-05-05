# Nft

This directory comprises 3 core smart contracts (`Nft.sol`, `NativeNftSale.sol`, `Erc20NftSale.sol`) and other periphery contracts &ndash; these contracts enable the minting and purchase of Nfts.

WARNING: THIS README IS DEPRECATED AND WAITING TO BE UPDATED

## Contracts description

Contract code can be found in the [src](src/) folder. Though there are multiple source files, the core contracts are the [Proxy](src/Proxy/Proxy.sol), [Erc20NftSale](src/Erc20NftSale.sol), and [Nft](src/Nft.sol) contracts.

- [Nft.sol](src/Nft.sol): this contract is an ERC721 smart contract implementation. It's an upgradeable smart contract; the upgrade functionality has been implemented using Openzeppelin upgrade contracts. A core function of this contract is minting NFTs, and only a permissioned minter of owner of the contract can do this.

- [Erc20NftSale.sol](src/Erc20NftSale.sol): the marketplace or sale contracts which is also the logic contract in the proxy-implementation pair. This contract is assigned a minter on the Nft contract and all purchase of NFTs on the Nft contract is done via this contract.

- [Proxy](src/Proxy/Proxy.sol): the main NftSale which holds all the  state, but delegates all the calls to the current logic contract.

- [State](src/State.sol): holds state variables definitions for the NftSale contract. We keep state in a single place to enable a safe proxy pattern.

## Deployment

Before using the deploy script, install dependencies by simply running:

```
npm clean-install
```

Afterwards, to deploy the contracts, you can simply run the deploy script [`deploy.sh`](./deploy.sh) and follow the prompts. Note that there are a few prerequisites that you will be asked to fulfill:
 - You should ensure that the config [`deploy-config.json`](./deploy-config.json) is up to date before deploying,
 - You will be asked to provide a private key associated with a wallet with sufficient funds that will be used for deployment.

## Adding networks

If you want to deploy to a network different than the networks configured in [`truffle-config.js`](./truffle-config.js), simply:

1. Add your network's config to [`truffle-config.js`](./truffle-config.js) under a different identifier,
2. Add an appropriate deployment config to [`deploy-config.js`](./deploy-config.json) under the same identifier,
3. Run `export TARGET_NETWORK=[your identifier]` before running the [`deploy.sh`](./deploy.sh) script.