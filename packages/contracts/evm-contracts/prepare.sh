mkdir -p ./publish

# Include all our contracts in the build
mkdir -p ./publish/contracts
cp -r ./contracts ./publish
rm -rf -r ./publish/contracts/dev

# ABI is generated during the build by hardhat-abi-exporter
mkdir -p ./publish/abi
# remove dependencies and test contracts
rm -rf -r ./publish/abi/@openzeppelin
rm -rf -r ./publish/abi/contracts/dev
# hoist content out of redundant "contracts" folder
mv ./publish/abi/contracts/* ./publish/abi/ && rmdir ./publish/abi/contracts

# flatten ./MyContract.sol/MyContract.json to just ./MyContract.json
find ./publish/abi/ -type d -name '*.sol' -exec sh -c '
    for dir; do
        mv "$dir"/* "$(dirname "$dir")/"
        rmdir "$dir"
    done
' sh {} +

# include our hardhat plugin
mkdir -p ./publish/plugin
cp ./build/plugin/* ./publish/plugin/

# include our hardhat configuration
mkdir -p ./publish/plugin
cp ./build/plugin/* ./publish/plugin/

cp ./README.md ./publish
cp ./package.json ./publish
