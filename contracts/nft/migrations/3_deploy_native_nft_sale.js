const nativeNftSale = artifacts.require("NativeNftSale");
const nativeProxy = artifacts.require("NativeProxy");
const deployConfig = require("../deploy-config.json");

module.exports = async function (deployer, network, accounts) {
  const networkConfig = deployConfig[network];
  const nftSaleConfig = networkConfig["NftSale"];
  const nativeNftSaleConfig = networkConfig["NativeNftSale"];
  const {
    price
  } = nftSaleConfig;
  const {
    nftAddress,
    decimals
  } = nativeNftSaleConfig;
  const owner = accounts[0];

  const decimalsMultiplier = 10n ** BigInt(decimals);
  const nativePrice = BigInt(price) * decimalsMultiplier;
  
  await deployer.deploy(nativeNftSale);
  const nftSaleInstance = await nativeNftSale.deployed();
  const nftSaleAddress = nftSaleInstance.address;

  await deployer.deploy(nativeProxy, nftSaleAddress, owner, nftAddress, nativePrice.toString(10));
  const proxyInstance = await nativeProxy.deployed();
  const proxyAddress = proxyInstance.address;

  console.log("Deployed Native NFT Sale contract:")
  console.log("   Native NFT Sale address:", nftSaleAddress);
  console.log("   Native proxy address:   ", proxyAddress);
};
