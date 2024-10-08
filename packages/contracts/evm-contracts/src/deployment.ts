import { types } from 'hardhat/config';
import { listDeployments } from '@nomicfoundation/ignition-core';
import * as path from 'path';
import * as fs from 'fs';
import { paimaScope } from './common.js';

paimaScope
  .task(
    'copy-ignition-deployment',
    `Copy the hardhat-ignition deployed addresses information to a target folder`
  )
  .addParam('rootDir', `Root directory of your hardhat-ignition project`, undefined, types.string)
  .addParam('outDir', `Build output directory to place deployment info`, undefined, types.string)
  .setAction(async (taskArgs, hre) => {
    await copyDeployments(taskArgs.rootDir, taskArgs.outDir);
  });
export async function copyDeployments(rootDir: string, outDir: string): Promise<void> {
  const deploymentDir = path.resolve(rootDir, 'src', 'ignition', 'deployments');
  const deployments = await listDeployments(deploymentDir);
  for (const deployment of deployments) {
    const deployedAddressesPath = path.join(deploymentDir, deployment, 'deployed_addresses.json');
    const json = fs.readFileSync(deployedAddressesPath, 'utf8');

    const deploymentsOutput = path.join(outDir, 'deployments');
    if (!fs.existsSync(deploymentsOutput)) {
      fs.mkdirSync(deploymentsOutput, { recursive: true });
    }

    const fixedJson = json.replace(/[\r\n]+$/, '');
    const outputTs = `export default ${fixedJson} as const;`;
    // TODO: maybe also generate cjs and mjs files equivalents?
    fs.writeFileSync(path.join(deploymentsOutput, `${deployment}.ts`), outputTs, { flag: 'w' });
  }
}
