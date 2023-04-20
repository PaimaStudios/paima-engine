const paimaL2Contract = artifacts.require("PaimaL2Contract");
const contractConfig = require("../../truffle-config.js").contract_config;

module.exports = function (deployer) {
  const {
    owner: owner,
    fee: fee
  } = contractConfig;
  deployer.deploy(paimaL2Contract, owner, fee.toString(10));
};
