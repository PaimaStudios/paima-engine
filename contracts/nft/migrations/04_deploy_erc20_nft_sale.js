const erc20NftSale = artifacts.require("Erc20NftSale");
const proxy = artifacts.require("Proxy");
const nft = artifacts.require("Nft");
const deployConfig = require("../deploy-config.json");
const utils = require("../scripts/utils.js");

const { addAddress, getAddress, getOptions } = utils;

module.exports = async function (deployer, network, accounts) {
  const networkConfig = deployConfig[network];
  const nftSaleConfig = networkConfig["NftSale"];
  const erc20NftSaleConfig = networkConfig["Erc20NftSale"];
  const {
    price
  } = nftSaleConfig;
  const {
    currencies
  } = erc20NftSaleConfig;
  const nftAddress = getAddress(network, "Nft");
  const owner = accounts[0];
  
  await deployer.deploy(erc20NftSale);
  const nftSaleInstance = await erc20NftSale.deployed();
  const nftSaleAddress = nftSaleInstance.address;

  const options = getOptions();

  const currenciesArray = [];
  for (const key in currencies) {
      currenciesArray.push(currencies[key]);
  }

  await deployer.deploy(proxy, nftSaleAddress, currenciesArray, owner, nftAddress, price.toString(10));
  const proxyInstance = await proxy.deployed();
  const proxyAddress = proxyInstance.address;

  const nftInstance = await nft.at(nftAddress);
  await nftInstance.setMinter(proxyAddress, options);

  addAddress(network, "Erc20NftSale", nftSaleAddress);
  addAddress(network, "Proxy", proxyAddress);
};
