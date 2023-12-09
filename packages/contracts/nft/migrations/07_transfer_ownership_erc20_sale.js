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

const nftSale = artifacts.require("Erc20NftSale");
const proxy = artifacts.require("Proxy");
/** @type {DeployConfigJson} */
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
