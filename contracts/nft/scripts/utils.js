const fs = require('fs');

const ADDRESSES_PATH = "../contract-addresses.json"

export function loadAddresses() {
    return loadJSON(ADDRESSES_PATH)
}

export function saveAddresses(addresses) {
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