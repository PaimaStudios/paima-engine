// @ts-check
/**
 * @typedef {import('../types/types').DeployConfigJson} DeployConfigJson
 * @typedef {import('../types/types').MigrationFunction} MigrationFunction
 * @typedef {import('web3').default} Web3
 */
/** @type {Web3} */
var web3;
/** @type {any} */
var artifacts;

const nftSale = artifacts.require("NativeNftSale");
/** @type {DeployConfigJson} */
const deployConfig = require("../deploy-config.json");
const utils = require("../scripts/utils.js");

const { getAddress, getOptions } = utils;

/** @type {MigrationFunction} */
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
