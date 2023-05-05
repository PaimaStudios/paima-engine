#!/bin/bash

function main() {
    getTargetNetwork
    getPrivateKey
    runDeployment
}

function getTargetNetwork() {
    if [ -z ${TARGET_NETWORK+x} ]; then
        echo ""
        echo "Which network would you like to deploy to?"
        echo "  1. Milkomeda C1 Mainnet"
        echo "  2. Milkomeda C1 Testnet"
        read -p "Please enter your choice (1-2): " choice

        case $choice in
          1)
            TARGET_NETWORK="mainnet"
            ;;
          2)
            TARGET_NETWORK="testnet"
            ;;
          *)
            echo "Invalid choice! Defaulting to Milkomeda C1 Testnet."
            TARGET_NETWORK="testnet"
            ;;
        esac

        export TARGET_NETWORK=$TARGET_NETWORK
    fi
}

function getPrivateKey() {
    if [ -z ${PRIVATE_KEY+x} ]; then
        echo ""
        read -p "Deployment private key unset. Please provide the value (a hex string without the leading 0x): " PRIVATE_KEY
        export PRIVATE_KEY=$PRIVATE_KEY
    fi
}

function runDeployment() {
    npx truffle migrate --network $TARGET_NETWORK
}

main