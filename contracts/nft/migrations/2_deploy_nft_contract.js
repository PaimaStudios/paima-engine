const nft = artifacts.require("Nft");
const deployConfig = require("../deploy-config.json");
const utils = require("../scripts/utils.js");

const { addAddress } = utils;

module.exports = async function (deployer, network, accounts) {
  const networkConfig = deployConfig[network];
  const nftConfig = networkConfig["Nft"];
  const {
    name,
    symbol,
    supply,
    minter,
    maxSupply,
    baseUri
  } = nftConfig;
  const owner = accounts[0];
  await deployer.deploy(nft, name, symbol, supply, owner);
  const nftInstance = await nft.deployed();
  const nftAddress = nftInstance.address;

  // might not be exact but simpler than going through deployment tx hash:
  const nftDeploymentBlockHeight = await web3.eth.getBlockNumber();

  const options = {
    gasPrice: (10n ** 11n).toString(10),
    gasLimit: (5n * 10n ** 6n).toString(10)
  };

  if (minter) {
    await nftInstance.setMinter(minter, options);
  }
  if (maxSupply) {
    await nftInstance.updateMaxSupply(maxSupply, options);
  }
  if (baseUri) {
    await nftInstance.setBaseURI(baseUri, options);
  }

  addAddress(network, "Nft", nftAddress);
  addAddress(network, "NftDeploymentBlockHeight", nftDeploymentBlockHeight);
};
