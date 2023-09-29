const nftSale = artifacts.require("NativeNftSale");
const deployConfig = require("../deploy-config.json");
const utils = require("../scripts/utils.js");

const { getAddress, getOptions } = utils;

module.exports = async function (deployer, network, accounts) {
  const networkConfig = deployConfig[network];
  const nftSaleConfig = networkConfig["NftSale"];
  const nativeNftSaleConfig = networkConfig["NativeNftSale"];
  const {
    price
  } = nftSaleConfig;
  const {
    decimals
  } = nativeNftSaleConfig;

  const options = getOptions();

  const decimalsMultiplier = 10n ** BigInt(decimals);
  const nativePrice = BigInt(price) * decimalsMultiplier;

  const proxyAddress = getAddress(network, "NativeProxy");
  const nftSaleInstance = await nftSale.at(proxyAddress);

  if (price) {
    await nftSaleInstance.updatePrice(nativePrice.toString(10), options);
  }
};
