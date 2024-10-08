mkdir -p ./build

# Include all our contracts in the build
mkdir -p ./build/contracts
cp -r ./contracts ./build
rm -rf -r ./build/contracts/dev

# ABI is generated during the build by hardhat-abi-exporter
mkdir -p ./build/abi
# remove dependencies and test contracts
rm -rf -r ./build/abi/@openzeppelin
rm -rf -r ./build/abi/contracts/dev
# hoist content out of redundant "contracts" folder
mv ./build/abi/contracts/* ./build/abi/ && rmdir ./build/abi/contracts

# flatten ./MyContract.sol/MyContract.json to just ./MyContract.json
find ./build/abi/ -type d -name '*.sol' -exec sh -c '
    for dir; do
        mv "$dir"/* "$(dirname "$dir")/"
        rmdir "$dir"
    done
' sh {} +

cp ./README.md ./build
cp ./package.json ./build
