const nft = artifacts.require("Nft");
const deployConfig = require("../deploy-config.json");

module.exports = async function (deployer, network, accounts) {
  const networkConfig = deployConfig[network];
  const nftConfig = networkConfig["Nft"];
  const {
    name,
    symbol,
    supply
  } = nftConfig;
  const owner = accounts[0];
  deployer.deploy(nft, name, symbol, supply, owner);
  const nftInstance = await nft.deployed();
  const nftAddress = nftInstance.address;

  console.log("Deployed NFT contract:")
  console.log("   NFT contract address:   ", nftAddress);
};
