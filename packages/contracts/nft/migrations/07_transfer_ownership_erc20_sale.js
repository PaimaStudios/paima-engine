const nftSale = artifacts.require("Erc20NftSale");
const proxy = artifacts.require("Proxy");
const deployConfig = require("../deploy-config.json");
const utils = require("../scripts/utils.js");

const { getAddress, getOptions } = utils;

module.exports = async function (deployer, network, accounts) {
  const networkConfig = deployConfig[network];
  const nftSaleConfig = networkConfig["Erc20NftSale"];
  const {
    owner
  } = nftSaleConfig;

  const options = getOptions();

  const proxyAddress = getAddress(network, "Proxy");
  const nftSaleInstance = await nftSale.at(proxyAddress);
  await nftSaleInstance.transferOwnership(owner, options);
};
