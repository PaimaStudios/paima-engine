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
    echo "Would you like to deploy a contract, or would you like to perform some admin operations with already deployed contracts?"
    echo "  1. Deployment functionality"
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

function runDeployment() {
    echo ""
    echo "Please select which contract you want to deploy. After your selection,"
    echo "deployment will start immediately, so please also make sure that your"
    echo "config in deploy-config.json is up to date."
    echo ""
    echo "Which contract would you like to deploy?"
    echo "  1. The Nft contract (Paima ERC721)"
    echo "  2. The NativeNftSale contract (for buying NFTs with the blockchain's native currency)"
    echo "  3. The Erc20NftSale contract (for buying NFTs with pre-specified ERC20 tokens)"
    read -p "Please enter your choice (1-3): " choice

    echo ""
    case $choice in
      1)
        deployNft
        ;;
      2)
        deployNativeNftSale
        ;;
      3)
        deployErc20NftSale
        ;;
      *)
        echo "Invalid choice, deploying nothing."
        ;;
    esac
}

function runAdmin() {
    echo ""
    echo "Please select which operation you want to perform. Inputs for the operations"
    echo "are taken from deploy-config.json, so make sure it is up to date."
    echo ""
    echo "What would you like to do?"
    echo "  1. Transfer Nft contract ownership"
    echo "  2. Transfer NativeNftSale contract ownership"
    echo "  3. Transfer Erc20NftSale contract ownership"
    echo "  4. Add a minter to the Nft contract"
    echo "  5. Update max supply of the Nft contract"
    echo "  6. Update base URI of the Nft contract"
    echo "  7. Update NFT price in the NativeNftSale contract"
    echo "  8. Update NFT price in the Erc20NftSale contract"
    read -p "Please enter your choice (1-8): " choice

    echo ""
    case $choice in
      1)
        runMigration 5
        ;;
      2)
        runMigration 6
        ;;
      3)
        runMigration 7
        ;;
      4)
        runMigration 8
        ;;
      5)
        runMigration 9
        ;;
      6)
        runMigration 10
        ;;
      7)
        runMigration 11
        ;;
      8)
        runMigration 12
        ;;
      *)
        echo "Invalid choice, not doing anything."
        ;;
    esac
}

function deployNft() {
    npx truffle migrate --f 2 --to 2 --network $TARGET_NETWORK
    local status=$?
    if [ $status -eq 0 ]; then
        node scripts/report-deployment-nft.js
    else
        echo "Something went wrong while deploying the Nft contract."
    fi
}

function deployNativeNftSale() {
    npx truffle migrate --f 3 --to 3 --network $TARGET_NETWORK
    local status=$?
    if [ $status -eq 0 ]; then
        node scripts/report-deployment-native-sale.js
    else
        echo "Something went wrong while deploying the NativeNftSale contract."
    fi

}

function deployErc20NftSale() {
    npx truffle migrate --f 4 --to 4 --network $TARGET_NETWORK
    local status=$?
    if [ $status -eq 0 ]; then
        node scripts/report-deployment-erc20-sale.js
    else
        echo "Something went wrong while deploying the Erc20NftSale contract."
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