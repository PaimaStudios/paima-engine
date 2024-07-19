/**
 * This script helps testing new versions by generating a node_modules friendly '@paima' folder
 * You can copy-paste it into a project to test versions early, or use --targetPath to override automatically
 */
import { startLocalRegistry } from '@nx/js/plugins/jest/local-registry';
import {
  existsSync,
  mkdirSync,
  rmdirSync,
  renameSync,
  rmSync,
  readdirSync,
  readFileSync,
  cpSync,
} from 'node:fs';
import { releasePublish } from 'nx/release';
import { resolve } from 'path';
import { Command } from 'commander';
import { x } from 'tar';
import path from 'path';

// Callback used to stop Verdaccio process
let stopLocalRegistry = () => {};

const program = new Command();
(async () => {
  program
    .option(
      '-t, --targetPath <path>',
      'local NPM project whose Paima version to update (ex: ../paima-game-templates/card-game)'
    )
    .parse(process.argv);
  const options = program.opts();

  // local registry target to run
  const localRegistryTarget = '@paima/source:local-registry';
  // storage folder for the local registry
  const bin = './bin/npm';
  mkIfNeeded(bin);
  const storage = `${bin}/tmp/local-registry/storage`;

  /**
   * Step 1: Start Verdaccio
   */
  stopLocalRegistry = await startLocalRegistry({
    localRegistryTarget,
    storage,
    verbose: false,
    clearStorage: true,
  });

  /**
   * Step 2: Publish Library on Verdaccio
   */
  const nxConfig = JSON.parse(readFileSync(resolve(process.cwd(), `nx.json`)).toString());
  const publishStatus = await releasePublish({
    groups: Object.keys(nxConfig['release']['groups']),
  });

  /**
   * Step 3: Extract packages from Verdaccio into a node_modules friendly format
   */

  // get where Verdaccio is storing all the package tarballs
  const packageFolder = resolve(process.cwd(), storage, '@paima');
  const outputFolder = resolve(process.cwd(), bin, '@paima');

  for (const pkg of readdirSync(packageFolder)) {
    // 1) Remove output if it exists from a previous run
    const registryBin = resolve(outputFolder, pkg);
    rmIfExists(registryBin);
    mkIfNeeded(registryBin);
    // 2) read the package.json to know the tarball filename
    const pkgJson = JSON.parse(
      readFileSync(resolve(packageFolder, pkg, `package.json`)).toString()
    );
    const version = pkgJson['dist-tags']['latest'];
    // 3) read the tarball to get the package content
    const tarball = resolve(packageFolder, pkg, `${pkg}-${version}.tgz`);
    await extractTgz(tarball, registryBin);
    // 4) flatten tarball (remove top-level "package" folder)
    moveFolderContentsToParent(resolve(registryBin, 'package'));
    // 5) print success
    console.log(`Wrote: ${registryBin}`);
  }

  if (options.targetPath != null) {
    const targetPath = resolve(process.cwd(), options.targetPath, 'node_modules', '@paima');
    rmIfExists(targetPath);
    cpSync(outputFolder, targetPath, { recursive: true });
    console.log(`Copied result to ${targetPath}`);
  }

  /**
   * Final: When installation is done, no need to have Verdaccio
   */
  stopLocalRegistry();
  rmSync(storage, { recursive: true });

  process.exit(publishStatus);
})().catch(e => {
  // If anything goes wrong, stop Verdaccio
  console.error(e);
  stopLocalRegistry();
  process.exit(1);
});

async function extractTgz(sourceFilePath: string, destinationFolderPath: string): Promise<void> {
  // Ensure the destination folder exists
  if (!existsSync(destinationFolderPath)) {
    mkdirSync(destinationFolderPath, { recursive: true });
  }

  // Extract the .tgz file
  await x({
    file: sourceFilePath,
    C: destinationFolderPath,
  });
}

// Function to move contents of a folder to its parent folder
function moveFolderContentsToParent(folderPath: string): void {
  // Get the parent folder path
  const parentFolderPath = path.dirname(folderPath);

  for (const file of readdirSync(folderPath)) {
    const oldPath = path.join(folderPath, file);
    const newPath = path.join(parentFolderPath, file);
    renameSync(oldPath, newPath);
  }
  rmdirSync(folderPath);
}

function mkIfNeeded(path: string): void {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }
}
function rmIfExists(path: string): void {
  if (existsSync(path)) {
    rmSync(path, { recursive: true });
  }
}
