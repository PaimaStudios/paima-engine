/* eslint-disable no-console, @typescript-eslint/explicit-function-return-type */

import pkg from 'pkg';
import devPkg from 'pkg-dev';
import fs from 'fs';
import pkgJson from '../package.json' assert { type: 'json' };

console.log('Package script start');
console.log(process.argv);
const compilationTarget = process.argv[2] /* as 'macos' | 'linux' */;
const isDebug = process.argv[3] === '--debug';

function getTmpFolder() {
  return `./packaged/`;
}
function getTmpFile() {
  return `${getTmpFolder()}${compilationTarget}-${isDebug}.json`;
}
function createTmpConfig() {
  let config = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

  if (!fs.existsSync(getTmpFolder())) {
    fs.mkdirSync(getTmpFolder(), { recursive: true });
  }
  config.pkg.assets.push(`./batcher-bin/${getBatcherName()}`);
  fs.writeFileSync(getTmpFile(), JSON.stringify(config, null, 2));
}
function getBatcherName() {
  const base = `paima-batcher-${compilationTarget}`;
  if (isDebug) {
    return 'dev-' + base;
  }
  return base;
}
async function packageApp() {
  try {
    createTmpConfig();
    const exe = isDebug ? devPkg : pkg;

    const baseOptions = ['experimental-specifier-resolution=node', 'no-warnings'];
    if (isDebug) {
      baseOptions.push('inspect');
    }
    const args = [
      ...['packaged/engineCorePacked.js'],
      ...['--options', baseOptions.join(',')],
      ...['--config', getTmpFile()],
      // ...['--debug'], // use to see package content
    ];
    if (isDebug) {
      args.push(...['--output', `packaged/@standalone/dev-paima-engine-${compilationTarget}`]);
      args.push(...[`-t`, `node18-${compilationTarget}-x64`]);
      args.push(...[`--build`]); // don't download prebuilt base binaries, build them
    } else {
      // pkg only supports creating prod builds that match the machine you're compiling on (ex: linux can't build macos)
      // UNLESS you compile them all at the same time (I know it makes no sense, but this is what they say)
      // so we build both <macos, linux> together, and then ignore the build we don't care about
      // that way we can pack the right files for the right builds
      args.push(...['--out-path', `packaged/tmp/`]);
    }
    console.log(args);
    await exe.exec(args);
    console.log('Packaging complete.');
  } catch (error) {
    console.error('Error during packaging:', error);
  }
}

async function generateMetadata() {
  const metadata = {
    version: pkgJson.version
  };
  fs.writeFileSync(getTmpFolder() + 'metadata.json', JSON.stringify(metadata, null, 2));
}

void packageApp();
void generateMetadata();
