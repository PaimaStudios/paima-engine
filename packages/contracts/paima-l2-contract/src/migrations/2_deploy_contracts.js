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
const { addAddress } = utils;

/** @type {MigrationFunction} */
module.exports = async function (deployer, network) {
  const {
    owner: owner,
    fee: fee
  } = contractConfig;
  await deployer.deploy(paimaL2Contract, owner, fee.toString(10));

  const contractInstance = await paimaL2Contract.deployed();
  const contractAddress = contractInstance.address;
  addAddress(network, "PaimaL2Contract", contractAddress);
};
