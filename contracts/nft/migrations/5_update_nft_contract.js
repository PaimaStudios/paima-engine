const nft = artifacts.require("Nft");
const deployConfig = require("../deploy-config.json");

module.exports = async function (deployer, network, accounts) {
  const networkConfig = deployConfig[network];
  const nftConfig = networkConfig["Nft"];
  const {
    minter,
    maxSupply,
    baseUri
  } = nftConfig;

  const options = {
    gasPrice: (10n ** 11n).toString(10),
    gasLimit: (5n * 10n ** 6n).toString(10)
  };

  const nftInstance = await nft.deployed();

  if (minter) {
    await nftInstance.setMinter(minter, options);
  }
  if (maxSupply) {
    await nftInstance.updateMaxSupply(maxSupply, options);
  }
  if (baseUri) {
    await nftInstance.setBaseURI(baseUri, options);
  }
};
