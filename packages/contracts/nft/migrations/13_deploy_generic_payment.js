const genericPayment = artifacts.require("GenericPayment");
const genericPaymentProxy = artifacts.require("GenericPaymentProxy");
const deployConfig = require("../deploy-config.json");
const utils = require("../scripts/utils.js");

const { addAddress } = utils;

module.exports = async function (deployer, network) {
    const networkConfig = deployConfig[network];
    const { owner } = networkConfig["GenericPayment"];

    await deployer.deploy(genericPayment);
    const genericPaymentInstance = await genericPayment.deployed();
    const genericPaymentAddress = genericPaymentInstance.address;

    await deployer.deploy(genericPaymentProxy, genericPaymentAddress, owner);
    const genericPaymentProxyInstance = await genericPaymentProxy.deployed();
    const genericPaymentProxyAddress = genericPaymentProxyInstance.address;

    addAddress(network, "GenericPayment", genericPaymentAddress);
    addAddress(network, "GenericPaymentProxy", genericPaymentProxyAddress);
};
