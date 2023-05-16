const utils = require("./utils.js");

const { reportAddresses } = utils;

function main() {
    const network = process.env.TARGET_NETWORK;
    console.log();
    reportAddresses(network, ["PaimaL2Contract"]);
    console.log();
}

main();