import type { HardhatUserConfig } from 'hardhat/config';
import { scope, subtask } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox-viem';
import '@nomicfoundation/hardhat-ignition-viem';
import 'hardhat-dependency-compiler';
import 'hardhat-interact';
import 'hardhat-abi-exporter';
import { TASK_NODE_SERVER_READY } from 'hardhat/builtin-tasks/task-names';
import * as dotenv from 'dotenv';
import { copyDeployments } from './deployment';

export function defaultHardhatConfig(config: {
  envPath: string;
  outDir: string;
}): HardhatUserConfig {
  const testnet: Record<string, string> = {};
  const mainnet: Record<string, string> = {};
  dotenv.config({ path: `${config.envPath}/.env.testnet`, processEnv: testnet });
  dotenv.config({ path: `${config.envPath}/.env.mainnet`, processEnv: mainnet });

  const defaultConfig: HardhatUserConfig = {
    solidity: '0.8.20',
    paths: {
      sources: './src/solidity',
      tests: './test',
      cache: './cache',
      artifacts: `${config.outDir}/artifacts`,
      ignition: './src/ignition',
    },
    networks: {
      // note: localhost / hardhat networks exist implicitly
      // hardhat is in-process (temporal) created for single commands. localhost is persisted by `npx hardhat node`
      hardhat: {
        mining: {
          auto: true,
          interval: 2000,
        },
      },
      testnet: {
        url: testnet.CHAIN_URI ?? '',
        accounts:
          testnet.DEPLOYER_PRIVATE_KEY == null || testnet.DEPLOYER_PRIVATE_KEY === ''
            ? []
            : [testnet.DEPLOYER_PRIVATE_KEY],
        allowUnlimitedContractSize: true,
      },
      mainnet: {
        url: mainnet.CHAIN_URI ?? '',
        accounts:
          mainnet.DEPLOYER_PRIVATE_KEY == null || mainnet.DEPLOYER_PRIVATE_KEY === ''
            ? []
            : [mainnet.DEPLOYER_PRIVATE_KEY],
      },
    },
    abiExporter: {
      path: `${config.outDir}/abi`,
      runOnCompile: true,
      tsWrapper: true,
      clear: true,
      flat: false,
    },
  };

  return defaultConfig;
}

/**
 * This type comes from hardhat-ignition. It's unfortunately not exported
 */
type IgnitionDeployParameters = {
  modulePath: string;
  parameters?: string;
  deploymentId: string | undefined;
  defaultSender: string | undefined;
  reset: boolean;
  verify: boolean;
  strategy: string;
  writeLocalhostDeployment: boolean;
};

/**
 * TODO: this may be replaced by a built-in feature in the future
 * https://github.com/NomicFoundation/hardhat-ignition/issues/791
 */
export function defaultDeployment(
  rootDir: string,
  outDir: string,
  config: IgnitionDeployParameters
): void {
  subtask(TASK_NODE_SERVER_READY, async (_, hre, runSuper) => {
    const result = await runSuper();

    await hre.run(
      {
        scope: 'ignition',
        task: 'deploy',
      },
      config
    );
    await hre.run(
      {
        scope: 'paima',
        task: 'copy-ignition-deployment',
      },
      { rootDir, outDir }
    );

    return result;
  });
}
