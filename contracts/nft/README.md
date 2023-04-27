# NftSale

NftSale contracts comprises 2 core smart contracts (Nft.sol, NftSale.sol) and other periphery contracts - these contracts enable the minting and purchase of Nfts.

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

## Upload Metadata and Images to Arweave

[Scripts](scripts/arweave-upload) have been provided to upload folders, create drive and manifest on arweave, and also create metadata collections in mongodb. Before running these scripts, ensure the following are set:

- Install chrome extension Arconnect, and create a wallet (and secure your wallet config file).
- Rename your arconnect config file to `arweave-keyfile.json` and copy it to the [scripts](scripts/arweave-upload) directory.
- Copy the folders to be uploaded to the scripts directory.
- Change directory to [arweave-upload](scripts/arweave-upload)
- Also if you want to create mongo collections from the local metadata folder, ensure an instance of mongodb has been setup and add the conection URL to the `.env.development` or `.env.production` env file.

## Create Drive and Upload Folder

The steps to create a drive and upload folder(s) are:

1. Create a drive using the `createDrive` subcommand. This returns the `bundleTxId` and `folderID` of the drive's root folder.

2. Upload a folder using the `uploadFolder` subcommand - it takes as required arguments the `folderID` from step 1 and the name of the folder (`folderName`) to be uploaded (a folder with name `folderName` which contains files/data to be uploaded should exist in `scripts/arweave-upload`). And it returns the `bundleTxID` and `folderID` of the newly uploaded folder.

3. After uploading metadata folder, create metadata collections using the `createMetadataCollections` subCommand - it takes as a required argument the `folderName` (name of folder uploaded in step 2).

4. Upload a manifest file for the uploaded folder using the `uploadManifest` subcommand - it takes as required arguments the `folderID` from step 2, and the name of the manfest file `manifestName`. It also returns the `bundleTxID`.

5. If NFT image folder was uploaded in step 2, append the NFT image URL for each NFT to its corresponding metadata file using the subcommand `appendImageUrl` - it takes as required arguments the `folderName` (name of the NFT images folder uploaded), and the `manifestDataTxId`. To get the Data Tx ID, log on to [ardrive.io](http://ardrive.io/), connecting with your arconnect wallet, then proceed to the created folder uploaded in step 2, and view  the info for the manifest file, copying the `Data Tx ID`.

With the `bundleTxID`, you can check the status of a transaction using the `checkStatus` subcommand. Once drive has been created and folder uploaded, to upload a new folder to existing drive, repeat steps 2 - 3. For more help run the command:

` npx ts-node scripts/arweave-upload/arweave-upload.ts arweave --help`

### Example 1

Let's create a new drive called `example-drive`, and upload a folder called `nft_images`. Folders `nft_images` contains the NFT images and exists in directory [arweave-upload](scripts/arweave-upload).

#### Create New Drive
```
npx ts-node arweave-upload.ts arweave createDrive example-drive 

returns { bundleTxID: `drive-creation-bundleTxID`, folderID: `drive-root-folderID` }   
```
#### Upload NFT image(s) Folder to Drive's Root Directory
```
npx ts-node arweave-upload.ts arweave uploadFolder  drive-root-folderID nft_images

returns { bundleTxID: `example-1-bundleTxID`, folderID: `example-1-folderID` }   
```

#### Upload Manifest File for nft_images Folder
```
npx ts-node arweave-upload.ts arweave uploadManifest example-1-folderID manifest
```

#### Check Transaction Status
```
npx ts-node arweave-upload.ts arweave checkStatus <bundleTxId>
```

### Example 2

Append the NFT images URL to their corresponding NFT metadata, and upload the NFT metadata folder (`nft_metadata`) to drive created in Example 1. Folder `nft_metadata` contains all NFT metadata and exists in directory [arweave-upload](scripts/arweave-upload). Copy the manifest file Data Tx ID from [ardrive.io](http://ardrive.io/)

#### Append NFT URL to metadata
```
npx ts-node arweave-upload.ts arweave appendImageUrl nft_metadata <manifestDataTxId>
```

#### Upload NFT metadata folder after appending NFT URL to all metadata files
```
npx ts-node arweave-upload.ts arweave uploadFolder drive-root-folderID nft_metadata

returns { bundleTxID: `example-2-bundleTxID`, folderID: `example-2-folderID` }   
```

The `drive-root-folderID` is the drive's root folderID from Example 1.

#### Create metadata collections in DB

```
npx ts-node arweave-upload.ts arweave createMetadataCollections nft_metadata    
```

#### Upload a Manifest File for nft_metadata folder
```
npx ts-node arweave-upload.ts arweave uploadManifest example-2-folderID manifest
```

Run tests:

```bash
forge test
``` 
