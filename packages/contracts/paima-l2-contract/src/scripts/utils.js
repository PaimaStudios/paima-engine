const fs = require('fs');

const ADDRESSES_PATH = "contract-addresses.json";

function getOptions() {
    return {
        gasPrice: (10n ** 11n).toString(10),
        gasLimit: (5n * 10n ** 6n).toString(10)
    };
}

function addAddress(network, key, address) {
    const addresses = loadAddresses();
    if (!addresses.hasOwnProperty(network)) {
      addresses[network] = {};
    }
    addresses[network][key] = address;
    saveAddresses(addresses);
}

function getAddress(network, key) {
    const addresses = loadAddresses();
    return addresses?.[network]?.[key];
}

function reportAddresses(network, keys) {
    const maxKeyLength = Math.max(...keys.map(k => k.length));
    console.log("Deployed contract addresses:");
    for (const key of keys) {
        const extraSpaceLength = maxKeyLength - key.length;
        const extraSpace = " ".repeat(extraSpaceLength);
        const address = getAddress(network, key);
        console.log(`   ${key}:${extraSpace} ${address}`)
    }
}

function loadAddresses() {
    return loadJSON(ADDRESSES_PATH)
}

function saveAddresses(addresses) {
    return saveJSON(ADDRESSES_PATH, addresses);
}

function loadJSON(path) {
    const data = fs.readFileSync(path, 'utf8');
    return JSON.parse(data);
}

function saveJSON(path, data) {
    const jsonData = JSON.stringify(data, null, 2);
    fs.writeFileSync(path, jsonData, 'utf8');
}

module.exports = {
    addAddress,
    getAddress,
    reportAddresses,
    getOptions
};