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

const nativeNftSale = artifacts.require("NativeNftSale");
const nativeProxy = artifacts.require("NativeProxy");
const nft = artifacts.require("Nft");
/** @type {DeployConfigJson} */
const deployConfig = require("../deploy-config.json");
const utils = require("../scripts/utils.js");

const { addAddress, getAddress, getOptions } = utils;

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
  const nftAddress = getAddress(network, "Nft");
  const owner = accounts[0];

  const decimalsMultiplier = 10n ** BigInt(decimals);
  const nativePrice = BigInt(price) * decimalsMultiplier;

  const options = getOptions();
  
  await deployer.deploy(nativeNftSale);
  const nftSaleInstance = await nativeNftSale.deployed();
  const nftSaleAddress = nftSaleInstance.address;

  await deployer.deploy(nativeProxy, nftSaleAddress, owner, nftAddress, nativePrice.toString(10));
  const proxyInstance = await nativeProxy.deployed();
  const proxyAddress = proxyInstance.address;

  const nftInstance = await nft.deployed();
  await nftInstance.setMinter(proxyAddress, options);

  addAddress(network, "NativeNftSale", nftSaleAddress);
  addAddress(network, "NativeProxy", proxyAddress);
};
