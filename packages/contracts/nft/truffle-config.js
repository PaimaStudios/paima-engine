const privateKey = process.env.PRIVATE_KEY;
const HDWalletProvider = require("@truffle/hdwallet-provider");

module.exports = {
  contracts_directory: "./src",
  contracts_build_directory: "./build",
  migrations_directory: "./migrations",
  compilers: {
    solc: {
      version: "0.8.13",
      evmVersion: "berlin",
    },
  },
  contract_config: {
    // TODO: modify this value as specified in the docs
    owner: ""
  },
  networks: {
    // TODO: modify the target network as required as specified in the docs
    mainnet: {
      provider: () =>
        new HDWalletProvider({
          privateKeys: [privateKey],
          providerOrUrl: "https://rpc-mainnet-cardano-evm.c1.milkomeda.com",
        }),
      network_id: 2001,
    },
    testnet: {
      provider: () =>
        new HDWalletProvider({
          privateKeys: [privateKey],
          providerOrUrl: "https://rpc-devnet-cardano-evm.c1.milkomeda.com",
        }),
      network_id: 200101,
    },
  },
};
