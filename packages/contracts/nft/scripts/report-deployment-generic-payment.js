const utils = require("../scripts/utils.js");

const { reportAddresses } = utils;

function main() {
    const network = process.env.TARGET_NETWORK;
    console.log();
    reportAddresses(network, ["GenericPayment", "GenericPaymentProxy"]);
    console.log();
}

main();
