#!/bin/bash

function main() {
    getTargetNetwork
    getPrivateKey
    runCore
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

function runCore() {
    echo ""
    echo "Would you like to deploy the contract, or would you like to perform some admin operations with the already deployed contract?"
    echo "  1. Deploy"
    echo "  2. Admin functionality"
    read -p "Please enter your choice (1-2): " choice
    case $choice in
      1)
        runDeployment
        ;;
      2)
        runAdmin
        ;;
      *)
        echo "Invalid choice, exitting."
        ;;
    esac
    
}


function runAdmin() {
    echo ""
    echo "Please select which operation you want to perform. Inputs for the operations"
    echo "are taken from truffle-config.js, so make sure it is up to date."
    echo ""
    echo "What would you like to do?"
    echo "  1. Update the contract owner"
    echo "  2. Update the contract submission fee"
    read -p "Please enter your choice (1-2): " choice

    echo ""
    case $choice in
      1)
        runMigration 3
        ;;
      2)
        runMigration 4
        ;;
      *)
        echo "Invalid choice, not doing anything."
        ;;
    esac
}

function runDeployment() {
    npx truffle migrate --f 2 --to 2 --network $TARGET_NETWORK
    local status=$?
    if [ $status -eq 0 ]; then
        node src/scripts/report-deployment.js
    else
        echo "Something went wrong with the operation."
    fi
}

function runMigration() {
    npx truffle migrate --f $1 --to $1 --network $TARGET_NETWORK
    local status=$?
    if [ $status -eq 0 ]; then
        echo "Operation completed successfully."
    else
        echo "Something went wrong with the operation."
    fi
}


main