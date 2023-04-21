const nft = artifacts.require("Nft");
const contractConfig = require("../truffle-config.js").contract_config;

module.exports = function (deployer) {
  const name = "Test NFT contract";
  const symbol = "TNC";
  const supply = 100;
  const {
    owner
  } = contractConfig;
  deployer.deploy(nft, name, symbol, supply, owner);
};
