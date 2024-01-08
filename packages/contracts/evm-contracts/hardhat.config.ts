import type { HardhatUserConfig } from 'hardhat/config';
// https://github.com/NomicFoundation/hardhat/issues/4734
// import '@nomicfoundation/hardhat-foundry';
import 'hardhat-abi-exporter';
// eslint-disable-next-line import/extensions
import './build/plugin/index.js';

const config: HardhatUserConfig = {
  solidity: '0.8.13',
  paths: {
    artifacts: './artifacts/hardhat',
    cache: './cache/hardhat',
  },
  defaultNetwork: 'localhost',
  networks: {
    localhost: {
      url: 'http://127.0.0.1:8545',
      accounts: process.env.DEPLOYER_PRIVATE_KEY == null ? [] : [process.env.DEPLOYER_PRIVATE_KEY],
    },
  },
  abiExporter: {
    path: './publish/abi',
    runOnCompile: true,
    clear: true,
    flat: false,
  },
};

export default config;
