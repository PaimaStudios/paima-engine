const nft = artifacts.require("Nft");
const deployConfig = require("../deploy-config.json");

module.exports = async function (deployer) {
  const nftConfig = deployConfig["Nft"];
  const {
    name,
    symbol,
    supply,
    owner
  } = nftConfig;
  deployer.deploy(nft, name, symbol, supply, owner);
  const nftInstance = await nft.deployed();
  const nftAddress = nftInstance.address;

  console.log("Deployed NFT contract:")
  console.log("   NFT contract address:   ", nftAddress);
};
