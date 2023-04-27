#!/bin/bash

if [ -z ${TARGET_NETWORK+x} ]; then
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

if [ -z ${PRIVATE_KEY+x} ]; then
    echo ""
    read -p "Deployment private key unset. Please provide the value: " PRIVATE_KEY
    export PRIVATE_KEY=$PRIVATE_KEY
fi

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
    echo "TODO: deploy Nft contract to $TARGET_NETWORK"
    ;;
  2)
    echo "TODO: deploy NativeNftSale contract to $TARGET_NETWORK"
    ;;
  3)
    echo "TODO: deploy Erc20NftSale contract to $TARGET_NETWORK"
    ;;
  *)
    echo "Invalid choice, deploying nothing."
    ;;
esac