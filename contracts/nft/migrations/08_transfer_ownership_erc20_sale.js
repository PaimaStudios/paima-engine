const nftSale = artifacts.require("Erc20NftSale");
const proxy = artifacts.require("Proxy");
const deployConfig = require("../deploy-config.json");
const utils = require("../scripts/utils.js");

const { getOptions } = utils;

module.exports = async function (deployer, network, accounts) {
  const networkConfig = deployConfig[network];
  const nftSaleConfig = networkConfig["Erc20NftSale"];
  const {
    owner
  } = nftSaleConfig;

  const options = getOptions();

  const proxyInstance = await proxy.deployed();
  const nftSaleInstance = await nftSale.at(proxyInstance.address);
  await nftSaleInstance.transferOwnership(owner, options);
};
