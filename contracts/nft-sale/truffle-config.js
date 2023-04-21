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
    owner: ""
  },
  networks: {
    ganache: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*",
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
