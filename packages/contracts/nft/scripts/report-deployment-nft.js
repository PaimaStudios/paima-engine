const utils = require("../scripts/utils.js");

const { reportAddresses, buildCdeConfig } = utils;

function main() {
    const network = process.env.TARGET_NETWORK;
    console.log();
    reportAddresses(network, ["Nft"]);
    console.log();
    buildCdeConfig(network);
    console.log();
}

main();