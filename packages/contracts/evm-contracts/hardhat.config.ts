import type { HardhatUserConfig } from 'hardhat/config';
// https://github.com/NomicFoundation/hardhat/issues/4734
// import '@nomicfoundation/hardhat-foundry';
import 'hardhat-abi-exporter';
// eslint-disable-next-line import/extensions
import './build/plugin/index.js';
import 'solidity-docgen';
import path from 'path';
import { SiteConfig } from 'solidity-docgen/dist/site.js';
import fs from 'fs';

const config: HardhatUserConfig = {
  solidity: '0.8.13',
  paths: {
    artifacts: './artifacts/hardhat',
    cache: './cache/hardhat',
  },
  docgen: {
    outputDir: 'artifacts/docs',
    templates: 'docs/templates',
    exclude: ['dev'],
    pageExtension: '.adoc',
    pages: (_, file, config: SiteConfig) => {
      // For each contract file, find the closest README.adoc and return its location as the output page path.
      // const root = (config as any).root;
      const sourcesDir = path.resolve(config.root, config.sourcesDir);
      let dir = path.resolve(config.root, file.absolutePath);
      while (dir.startsWith(sourcesDir)) {
        dir = path.dirname(dir);
        if (fs.existsSync(path.join(dir, 'README.adoc'))) {
          return path.relative(sourcesDir, dir) + config.pageExtension;
        }
      }
    },
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
