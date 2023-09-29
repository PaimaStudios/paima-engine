const nftSale = artifacts.require("Erc20NftSale");
const deployConfig = require("../deploy-config.json");
const utils = require("../scripts/utils.js");

const { getAddress, getOptions } = utils;

module.exports = async function (deployer, network, accounts) {
  const networkConfig = deployConfig[network];
  const nftSaleConfig = networkConfig["NftSale"];
  const {
    price
  } = nftSaleConfig;

  const options = getOptions();

  const proxyAddress = getAddress(network, "Proxy");
  const nftSaleInstance = await nftSale.at(proxyAddress);

  if (price) {
    await nftSaleInstance.updatePrice(price.toString(10), options);
  }
};
