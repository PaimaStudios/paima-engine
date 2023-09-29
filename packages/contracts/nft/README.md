# Nft

This directory comprises 3 core smart contracts (`Nft.sol`, `NativeNftSale.sol`, `Erc20NftSale.sol`) and other periphery contracts &ndash; these contracts enable the minting and purchase of Nfts.

## Contracts description

Contract code can be found in the [src](src/) folder. Though there are multiple source files, the core contracts are the [Proxy](src/Proxy/Proxy.sol), [Erc20NftSale](src/Erc20NftSale.sol), and [Nft](src/Nft.sol) contracts.

-   [Nft.sol](src/Nft.sol): this contract is an ERC721 smart contract implementation. It's an upgradeable smart contract; the upgrade functionality has been implemented using Openzeppelin upgrade contracts. A core function of this contract is minting NFTs, and only a permissioned minter of owner of the contract can do this.

-   [Erc20NftSale.sol](src/Erc20NftSale.sol): the marketplace or sale contracts which is also the logic contract in the proxy-implementation pair. This contract is assigned a minter on the Nft contract and all purchase of NFTs on the Nft contract is done via this contract.

-   [Proxy](src/Proxy/Proxy.sol): the main NftSale which holds all the state, but delegates all the calls to the current logic contract.

-   [State](src/State.sol): holds state variables definitions for the NftSale contract. We keep state in a single place to enable a safe proxy pattern.

## Deployment

Before using the deploy script, install dependencies by simply running:

```
npm clean-install
```

Afterwards, to deploy the contracts, you can simply run the deploy script [`deploy.sh`](./deploy.sh) and follow the prompts. Note that there are a few prerequisites that you will be asked to fulfill:

-   You should ensure that the config [`deploy-config.json`](./deploy-config.json) is up to date before deploying,
-   You will be asked to provide a private key associated with a wallet with sufficient funds that will be used for deployment.

## Advanced functionality

For most use cases, the information provided above should suffice; however, if you are interested in looking under the hood or doing more complex operations, you may find some use in the following sections.

### Adding networks

If you want to deploy to a network different than the networks configured in [`truffle-config.js`](./truffle-config.js), simply:

1. Add your network's config to [`truffle-config.js`](./truffle-config.js) under a different identifier,
2. Add an appropriate deployment config to [`deploy-config.js`](./deploy-config.json) under the same identifier,
3. Run `export TARGET_NETWORK=[your identifier]` before running the [`deploy.sh`](./deploy.sh) script.

### Config files

When deploying contracts or executing admin functions using the deploy script, two config files are used to determine the values used:

-   [`contract-addresses.json`](./contract-addresses.json) is used to retrieve addresses of the latest deployed contracts. It is updated automatically when a new contract is deployed, so you should never need to edit it manually, unless you want to perform actions with different instances of deployed contracts;
-   [`deploy-config.json`](./deploy-config.json) contains all other config data for the scripts. The individual fields are grouped by the contract they apply to:
    -   `Nft`:
        -   `name`
        -   `symbol`
        -   `supply` &ndash; the maximum number of NFTs that can be minted;
        -   `owner` &ndash; the owner of the contract. Only used for the "transfer ownership" admin function, during deployment, the address of the deploying wallet will be used;
        -   `minter` &ndash; intended primarily for the "add minter" admin function, also used during deployment if not empty;
        -   `baseUri`
    -   `NftSale`:
        -   `price` &ndash; the price of buying an NFT through the sale contract, used both for `NativeNftSale` and `Erc20NftSale`. For native sale the price is multiplied by `10^decimals`;
    -   `NativeNftSale`:
        -   `decimals` &ndash; decimals of the underlying base currency of the chain, used for price calculation;
        -   `owner` &ndash; see `Nft`'s `owner` field;
    -   `Erc20NftSale`:
        -   `currencies` &ndash; an object mapping symbols of supported ERC20 tokens to addresses of their contracts;
        -   `owner` &ndash; see `Nft`'s `owner` field;

Both of these files contain separate sections for different networks, so when updating them, make sure you are applying your changes to the correct network.

### Deployed contract addresses

When deploying any contract using the deploy script, you should see the addresses of the deployed contracts as the final output of the script. Furthermore, the [`contract-addresses.json`](./contract-addresses.json) is also automatically updated with addresses of the newly deployed contracts, so if you want to save addresses of your old contracts, you should do so before deploying new ones. You can manually edit this file to supply any addresses you want (e.g. to deploy a NFT sale contract targetting a different NFT contract than the latest deployed one), but under ordinary operation you should never need to.
