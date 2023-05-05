const nft = artifacts.require("Nft");
const deployConfig = require("../deploy-config.json");
const utils = require("../scripts/utils.js");

const { addAddress, getOptions } = utils;

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
  const [
    _,
    nftDeploymentBlockHeight
  ] = await Promise.all([
    deployer.deploy(nft, name, symbol, supply, owner),
    web3.eth.getBlockNumber() // might not be exact but simpler than going through deployment tx hash
  ]);
  const nftInstance = await nft.deployed();
  const nftAddress = nftInstance.address;

  const options = getOptions();

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
