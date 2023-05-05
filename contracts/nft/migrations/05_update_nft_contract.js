const nft = artifacts.require("Nft");
const deployConfig = require("../deploy-config.json");
const utils = require("../scripts/utils.js");

const { getOptions } = utils;

module.exports = async function (deployer, network, accounts) {
  const networkConfig = deployConfig[network];
  const nftConfig = networkConfig["Nft"];
  const {
    minter,
    maxSupply,
    baseUri
  } = nftConfig;

  const options = getOptions();

  const nftInstance = await nft.deployed();

  if (minter) {
    await nftInstance.setMinter(minter, options);
  }
  if (maxSupply) {
    await nftInstance.updateMaxSupply(maxSupply, options);
  }
  if (baseUri) {
    await nftInstance.setBaseURI(baseUri, options);
  }
};
