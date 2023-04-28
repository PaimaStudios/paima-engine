const nft = artifacts.require("Nft");
const deployConfig = require("../deploy-config.json");

module.exports = async function (deployer, network, accounts) {
  const networkConfig = deployConfig[network];
  const nftConfig = networkConfig["Nft"];
  const {
    owner
  } = nftConfig;

  const options = {
    gasPrice: (10n ** 11n).toString(10),
    gasLimit: (5n * 10n ** 6n).toString(10)
  };

  const nftInstance = await nft.deployed();
  await nftInstance.transferOwnership(owner, options);
};
