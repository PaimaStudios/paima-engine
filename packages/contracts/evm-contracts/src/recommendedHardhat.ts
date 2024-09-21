import type { HardhatUserConfig } from 'hardhat/config';
import { scope, subtask } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox-viem';
import '@nomicfoundation/hardhat-ignition-viem';
import 'hardhat-dependency-compiler';
import 'hardhat-interact';
import 'hardhat-abi-exporter';
import { TASK_NODE_SERVER_READY } from 'hardhat/builtin-tasks/task-names';
import { listDeployments } from '@nomicfoundation/ignition-core';
import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

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
  forceToDisk(rootDir, outDir); // note: need to register this listener first

  subtask(TASK_NODE_SERVER_READY, async (_, hre, runSuper) => {
    const result = await runSuper();

    await hre.run(
      {
        scope: 'ignition',
        task: 'deploy',
      },
      config
    );

    return result;
  });
}

/**
 * see https://github.com/NomicFoundation/hardhat-ignition/issues/791
 */
function forceToDisk(rootDir: string, outDir: string) {
  scope('ignition').task(
    'deploy',
    async (taskArguments: IgnitionDeployParameters, hre, runSuper) => {
      const network = hre.hardhatArguments.network ?? hre.config.defaultNetwork ?? 'hardhat';
      // see https://github.com/NomicFoundation/hardhat-ignition/issues/791
      if (taskArguments.deploymentId == null && network === 'hardhat') {
        taskArguments.deploymentId = taskArguments.deploymentId ?? 'chain-31337';
      }
      const result = await runSuper(taskArguments);

      copyDeployments(rootDir, outDir);
      return result;
    }
  );
}

export async function copyDeployments(rootDir: string, outDir: string): Promise<void> {
  const deploymentDir = path.resolve(rootDir, 'src', 'ignition', 'deployments');
  const deployments = await listDeployments(deploymentDir);
  for (const deployment of deployments) {
    const deployedAddressesPath = path.join(deploymentDir, deployment, 'deployed_addresses.json');
    const json = fs.readFileSync(deployedAddressesPath, 'utf8');

    const deploymentsOutput = path.join(outDir, 'deployments');
    if (!fs.existsSync(deploymentsOutput)) {
      fs.mkdirSync(deploymentsOutput);
    }

    const fixedJson = json.replace(/[\r\n]+$/, '');
    const outputTs = `export default ${fixedJson} as const;`;
    // TODO: maybe also generate cjs and mjs files equivalents?
    fs.writeFileSync(path.join(deploymentsOutput, `${deployment}.ts`), outputTs, { flag: 'w' });
  }
}
