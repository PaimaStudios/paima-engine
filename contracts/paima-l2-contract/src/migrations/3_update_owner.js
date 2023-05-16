const paimaL2Contract = artifacts.require("PaimaL2Contract");
const contractConfig = require("../../truffle-config.js").contract_config;
const utils = require("../scripts/utils.js");
const { getAddress, getOptions } = utils;

module.exports = async function (deployer, network) {
  const {
    owner: owner
  } = contractConfig;
  
  const contractAddress = getAddress(network, "PaimaL2Contract");
  const options = getOptions();

  const contractInstance = await paimaL2Contract.at(contractAddress);
  if (owner) {
    await contractInstance.setOwner(owner, options);
  }
};
