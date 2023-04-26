const erc20NftSale = artifacts.require("Erc20NftSale");
const proxy = artifacts.require("Proxy");
const deployConfig = require("../deploy-config.json");

module.exports = async function (deployer) {
  const nftSaleConfig = deployConfig["NftSale"];
  const erc20NftSaleConfig = deployConfig["Erc20NftSale"];
  const {
    nftAddress,
    price,
    owner
  } = nftSaleConfig;
  const {
    currencies
  } = erc20NftSaleConfig;
  
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
