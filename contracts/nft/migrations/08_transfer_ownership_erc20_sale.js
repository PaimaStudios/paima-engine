const nftSale = artifacts.require("Erc20NftSale");
const proxy = artifacts.require("Proxy");
const deployConfig = require("../deploy-config.json");

module.exports = async function (deployer, network, accounts) {
  const networkConfig = deployConfig[network];
  const nftSaleConfig = networkConfig["Erc20NftSale"];
  const {
    owner
  } = nftSaleConfig;

  const options = {
    gasPrice: (10n ** 11n).toString(10),
    gasLimit: (5n * 10n ** 6n).toString(10)
  };

  const proxyInstance = await proxy.deployed();
  const nftSaleInstance = await nftSale.at(proxyInstance.address);
  await nftSaleInstance.transferOwnership(owner, options);
};
