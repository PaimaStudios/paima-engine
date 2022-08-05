const storage = artifacts.require("Storage");
const contractConfig = require("../../truffle-config.js").contract_config;

module.exports = function (deployer) {
  const {
    owner: owner,
    fee: fee
  } = contractConfig;
  deployer.deploy(storage, owner, fee.toString(10));
};
