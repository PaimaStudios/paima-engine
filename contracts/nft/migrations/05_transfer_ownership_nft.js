const nft = artifacts.require("Nft");
const deployConfig = require("../deploy-config.json");
const utils = require("../scripts/utils.js");

const { getAddress, getOptions } = utils;

module.exports = async function (deployer, network, accounts) {
  const networkConfig = deployConfig[network];
  const nftConfig = networkConfig["Nft"];
  const {
    owner
  } = nftConfig;

  const nftAddress = getAddress(network, "Nft");
  const options = getOptions();

  const nftInstance = await nft.at(nftAddress);
  await nftInstance.transferOwnership(owner, options);
};
