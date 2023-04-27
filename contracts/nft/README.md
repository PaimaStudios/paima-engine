# Nft

This directory comprises 3 core smart contracts (`Nft.sol`, `NativeNftSale.sol`, `Erc20NftSale.sol`) and other periphery contracts &ndash; these contracts enable the minting and purchase of Nfts.

WARNING: THIS README IS DEPRECATED AND WAITING TO BE UPDATED

## Contracts description

Contract code can be found in the [src](src/) folder. Though there are multiple source files, the core contracts are the [Proxy](src/Proxy/Proxy.sol), [NftSale](src/NftSale.sol), and [Nft](src/Nft.sol) contracts.

- [Nft.sol](src/Nft.sol): this contract is an ERC721 smart contract implementation. It's an upgradeable smart contract; the upgrade functionality has been implemented using Openzeppelin upgrade contracts. A core function of this contract is minting NFTs, and only a permissioned minter of owner of the contract can do this.

- [NftSale.sol](src/NftSale.sol): the marketplace or sale contracts which is also the logic contract in the proxy-implementation pair. This contract is assigned a minter on the Nft contract and all purchase of NFTs on the Nft contract is done via this contract.

- [Proxy](src/Proxy/Proxy.sol): the main NftSale which holds all the  state, but delegates all the calls to the current logic contract.

- [State](src/State.sol): holds state variables definitions for the NftSale contract. We keep state in a single place to enable a safe proxy pattern.

## Development setup

Install Foundry as per its [tutorial](https://github.com/gakonst/foundry#installation),
that is by:

```bash
curl -L https://foundry.paradigm.xyz | bash
# reload terminal session or source shell config for foundryup command to be available
foundryup
```

## Deployment

The following script and hardhat task have been provided for deploying and initializing the contracts:

- [deploy-nft.ts](scripts/deploy-nft.ts): deploys NFT smart contract.
- [deploy-native-nftsale.ts](scripts/deploy-native-nftsale.ts): deploys MilkADA based NftSale smart contract.
- [deploy-nftsale.ts](scripts/deploy-nftsale.ts): deploys ERC20 based NftSale smart contract
- [update.ts](tasks/update.ts): updates NFT storage
- [transfer-ownership.ts](tasks/transfer-ownership.ts)

Before running the deployment script and update task, create a file `.env.development` or `.env.production` in root of contracts folder `nft-sale`. The contents of this file should follow the template `.env.template`. Also ensure `NODE_ENV` is set to `development` or `production`. 

Before deploying any versions of the Sale smart contracts (NftSale | NativeNftSale), ensure the NFT contract is deployed first, and it's address saved and exists in [contract-addresses.json](contract-addresses.json).

#### Deploy NFT contract, run the following command:

` npx hardhat run scripts/deploy-nft.ts  --network <mainnet | testnet>`

#### Deploy NativeNftSale (MilkADA based) smart contract, run the following command:

` npx hardhat run scripts/deploy-native-nftsale.ts  --network <mainnet | testnet>`

#### Deploy NftSale (ERC20 based) smart contract, run the following command:

` npx hardhat run scripts/deploy-native-nftsale.ts  --network <mainnet | testnet>`

After deploying the contracts, all deployment addresses are saved to [contract-addresses.json](contract-addresses.json).

#### Next initialize the contracts storage uisng the hardhat task:

`npx hardhat update-storage --baseuri <baseURI>  --minter <nftSaleProxy | nativeNftSaleProxyAddress>  --supply <max supply> --network  <mainnet | testnet>`

#### Transfer Ownership of NFT and NftSale Contract

`npx hardhat transfer-ownership --owner <new owner> --network <mainnet | testnet>`

