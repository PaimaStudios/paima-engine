const erc20NftSale = artifacts.require("Erc20NftSale");
const proxy = artifacts.require("Proxy");
const deployConfig = require("../deploy-config.json");

module.exports = async function (deployer, network, accounts) {
  const networkConfig = deployConfig[network];
  const nftSaleConfig = networkConfig["NftSale"];
  const erc20NftSaleConfig = networkConfig["Erc20NftSale"];
  const {
    nftAddress,
    price
  } = nftSaleConfig;
  const {
    currencies
  } = erc20NftSaleConfig;
  const owner = accounts[0];
  
  await deployer.deploy(erc20NftSale);
  const nftSaleInstance = await erc20NftSale.deployed();
  const nftSaleAddress = nftSaleInstance.address;

  const currenciesArray = [];
  for (const key in currencies) {
      currenciesArray.push(currencies[key]);
  }

  await deployer.deploy(proxy, nftSaleAddress, currenciesArray, owner, nftAddress, price.toString(10));
  const proxyInstance = await proxy.deployed();
  const proxyAddress = proxyInstance.address;

  console.log("Deployed ERC20 NFT Sale contract:")
  console.log("   ERC20 NFT Sale address: ", nftSaleAddress);
  console.log("   Proxy address:          ", proxyAddress);
};
