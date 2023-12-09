// @ts-check
/**
 * @typedef {import('../../types/types').MigrationFunction} MigrationFunction
 * @typedef {import('web3').default} Web3
 */
/** @type {any} */
var artifacts;

const paimaL2Contract = artifacts.require("PaimaL2Contract");
const contractConfig = require("../../truffle-config.js").contract_config;
const utils = require("../scripts/utils.js");
const { getAddress, getOptions } = utils;

/** @type {MigrationFunction} */
module.exports = async function (deployer, network) {
  const {
    fee: fee
  } = contractConfig;
  
  const contractAddress = getAddress(network, "PaimaL2Contract");
  const options = getOptions();

  const contractInstance = await paimaL2Contract.at(contractAddress);
  if (fee) {
    await contractInstance.setFee(fee, options);
  }
};
