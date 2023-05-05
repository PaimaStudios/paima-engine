const nftSale = artifacts.require("NativeNftSale");
const proxy = artifacts.require("NativeProxy");
const deployConfig = require("../deploy-config.json");
const utils = require("../scripts/utils.js");

const { getAddress, getOptions } = utils;

module.exports = async function (deployer, network, accounts) {
  const networkConfig = deployConfig[network];
  const nftSaleConfig = networkConfig["NativeNftSale"];
  const {
    owner
  } = nftSaleConfig;

  const options = getOptions();

  const proxyAddress = getAddress(network, "NativeProxy");
  const nftSaleInstance = await nftSale.at(proxyAddress);
  await nftSaleInstance.transferOwnership(owner, options);
};
