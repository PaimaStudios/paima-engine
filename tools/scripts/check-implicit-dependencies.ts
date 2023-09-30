const { createProjectGraphAsync } =
  require('@nx/workspace/src/core/project-graph') as typeof import('@nx/workspace/src/core/project-graph');
const fs = require('fs') as typeof import('fs');
const JSON5 = require('json5') as typeof import('json5');
const path = require('path') as typeof import('path');

/**
 * NPM requires us that all packages properly references each other in package.json
 * This is hard to enforce manually locally,
 *     because npm workspaces have a feature that makes you don't need to specify local packages in package.json
 * So this script checks that any library package that depends on another properly lists its dependencies
 */

type Dep = { target: string };
type PackageJson = {
  version: string;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  peerDependencies: Record<string, string>;
};
type VersionMismatch = { name: string; used: string; expected: string };
type DepAndPath = {
  path: string;
  dep: string;
};

const packageFolders = fs
  .readdirSync('./packages', { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .map(dirent => dirent.name);
function isPackage(path: string): boolean {
  for (const pkg of packageFolders) {
    if (path.includes(`packages/${pkg}`)) {
      return true;
    }
  }
  return false;
}

const libFolders = ['paima-sdk'];
function isLib(path: string): boolean {
  for (const lib of libFolders) {
    if (path.includes(`packages/${lib}`)) {
      return true;
    }
  }
  return false;
}

let hasError = false;
async function main() {
  const graph = await createProjectGraphAsync();

  const ownPkgs = Object.keys(graph.nodes).filter(key => isPackage(graph.nodes[key].data.root));
  const ownPkgSet = new Set(ownPkgs);

  // cache the content of each package so we can look it up faster later
  const packageContent: Record<string, PackageJson> = {};
  for (const pkg of ownPkgs) {
    const pkgJson = require(`../../${graph.nodes[pkg].data.root}/package.json`);
    packageContent[pkg] = pkgJson;
  }
  // cache whether or not a package has a special build config
  const hasBuildConfig: Record<string, boolean> = {};
  for (const pkg of ownPkgs) {
    hasBuildConfig[pkg] = fs.existsSync(`./${graph.nodes[pkg].data.root}/tsconfig.build.json`);
  }

  for (const pkg of ownPkgs) {
    const pkgJson = packageContent[pkg];
    const ownRoot = graph.nodes[pkg].data.root;

    const analyzedDeps = new Set(
      (graph.dependencies[pkg] as Dep[]).map(dep => dep.target).filter(dep => ownPkgSet.has(dep))
    );

    const declaredDeps = {
      ...pkgJson.dependencies,
      ...pkgJson.devDependencies,
      ...pkgJson.peerDependencies,
    };
    // clear out dependencies not from our project
    for (const dep of Object.keys(declaredDeps)) {
      if (!ownPkgSet.has(dep)) {
        delete declaredDeps[dep];
      }
    }

    // 1) Check that versions are correct
    {
      const mismatches: VersionMismatch[] = [];
      for (const declaredDep of Object.keys(declaredDeps)) {
        const declaredVersion = declaredDeps[declaredDep];
        const realVersion = packageContent[declaredDep].version;

        if (realVersion !== declaredVersion) {
          mismatches.push({ name: declaredDep, used: declaredVersion, expected: realVersion });
        }
      }
      if (mismatches.length > 0) {
        hasError = true;
        console.error(
          `Package ${purpleText(`${ownRoot}/package.json`)} has some version mismatches`
        );
        for (const mismatch of mismatches) {
          console.log(redText(`- "${mismatch.name}": ${mismatch.used}"`));
          console.log(greenText(`+ "${mismatch.name}": ${mismatch.expected}"`));
        }
        console.log();
      }
    }

    // 2) Check that packages are present
    //    Note: adding to package.json is only required if this is a lib we intend to publish
    if (isLib(pkg)) {
      const remainingDeps = new Set(analyzedDeps);
      for (const declaredDep of Object.keys(declaredDeps)) {
        remainingDeps.delete(declaredDep);
      }
      if (remainingDeps.size > 0) {
        hasError = true;
        console.error(
          `Package ${purpleText(`${ownRoot}/package.json`)} is missing some dependencies`
        );
        for (const dep of Array.from(remainingDeps)) {
          console.error(greenText(`"${dep}": "${packageContent[dep].version}",`));
        }
        console.log();
      }
    }

    // 3) Check that references are up-to-date
    {
      const depAndPaths: DepAndPath[] = Array.from(analyzedDeps).map(dep => ({
        path: graph.nodes[dep].data.root as string,
        dep,
      }));

      const extra: string[] = []; // references that aren't necessary
      const wrongPath: { pkg: string; path: string }[] = [];

      // json5 to support trailing commas (used in tsconfig.json)
      const jsonString = fs.readFileSync(`./${ownRoot}/tsconfig.json`, 'utf-8');
      const tsconfigJson = JSON5.parse(jsonString);
      for (const ref of tsconfigJson['references'] ?? []) {
        const { path } = ref;
        const folder = getMeaningfulPartOfPath(path);
        const indexOfMatch = depAndPaths.findIndex(depthAndPath =>
          depthAndPath.path.endsWith(folder)
        );
        if (indexOfMatch === -1) {
          extra.push(folder);
        } else {
          const fileRef = getFilenameFromPath(path);
          if (hasBuildConfig[depAndPaths[indexOfMatch].dep]) {
            if (fileRef !== 'tsconfig.build.json') {
              wrongPath.push({ pkg, path: path });
              hasError = true;
            }
          }
          depAndPaths.splice(indexOfMatch, 1);
        }
      }
      if (wrongPath.length > 0) {
        hasError = true;
        console.error(
          `Package ${purpleText(`${ownRoot}/tsconfig.json`)} has some incorrect references`
        );
        for (const path of wrongPath) {
          console.error(`${redText(path.path)} → ${greenText(`${path.path}/tsconfig.build.json`)}`);
        }
        console.log();
      }
      if (extra.length > 0) {
        hasError = true;
        console.error(
          `Package ${purpleText(`${ownRoot}/tsconfig.json`)} has unnecessary references`
        );
        for (const ref of extra) {
          console.error(redText(ref));
        }
        console.log();
      }
      if (depAndPaths.length > 0) {
        hasError = true;
        console.error(
          `Package ${purpleText(`${ownRoot}/tsconfig.json`)} is missing some references`
        );
        for (const depAndPath of depAndPaths) {
          const basePath = path.relative(ownRoot, depAndPath.path);
          hasBuildConfig[depAndPath.dep];
          console.error(
            greenText(
              `{ "path": "${
                hasBuildConfig[depAndPath.dep] ? `${basePath}/tsconfig.build.json` : basePath
              }" },`
            )
          );
        }
        console.log();
      }
    }
  }

  // 4) Check tsconfig paths (needed because of https://github.com/nrwl/nx/issues/19391)
  {
    // json5 to support trailing commas (used in tsconfig.json)
    const jsonString = fs.readFileSync(`./tsconfig.base.json`, 'utf-8');
    const tsconfigJson = JSON5.parse(jsonString);

    const tsconfigPaths = new Set<string>(Object.keys(tsconfigJson.compilerOptions.paths));
    const expectedPkgs = new Set(ownPkgs.map(pkg => `${pkg}/*`));

    const extraPaths = setDifference(tsconfigPaths, expectedPkgs);
    const missingPaths = setDifference(expectedPkgs, tsconfigPaths);

    if (extraPaths.size > 0 || missingPaths.size > 0) {
      hasError = true;
      console.error(`Root ${purpleText(`$./tsconfig.base.json`)} has incorrect "paths"`);
    }
    if (extraPaths.size > 0) {
      for (const path of extraPaths) {
        console.error(redText(`"${path}": ${tsconfigJson.compilerOptions.paths[path]}`));
      }
    }
    if (missingPaths.size > 0) {
      for (const path of missingPaths) {
        const pkgName = path.substring(0, path.length - 2); // strip the trailing /*
        console.error(greenText(`"${path}": ["./${graph.nodes[pkgName].data.root}/*"],`));
      }
    }
  }

  process.exit(hasError ? 1 : 0);
}

function setDifference<T>(setA: Set<T>, setB: Set<T>): Set<T> {
  const difference = new Set(setA);
  for (const elem of setB) {
    difference.delete(elem);
  }
  return difference;
}

/**
 * Return the part of the path that doesn't have ../ prefix and doesn't have the filename
 */
function getMeaningfulPartOfPath(inputPath: string) {
  const normalizedPath = path.normalize(inputPath);
  const pathParts = normalizedPath.split(path.sep);

  // Remove '..' and '.' from the beginning
  while (pathParts.length && (pathParts[0] === '..' || pathParts[0] === '.')) {
    pathParts.shift();
  }

  // Remove the filename
  if (pathParts.length && path.extname(pathParts[pathParts.length - 1]) !== '') {
    pathParts.pop();
  }

  const result = pathParts.join(path.sep);

  // normalize by removing any trailing slash
  if (result.endsWith('/')) {
    return result.slice(0, -1);
  }
  return result;
}

function getFilenameFromPath(filePath: string): string | null {
  const baseName = path.basename(filePath);
  // basename might return a directory. We check that it is a file by checking if it includes a file extension (.)
  // obviously files in Linux don't require a file extension, but tsconfig.json always does so it's okay
  return baseName && baseName.includes('.') ? baseName : null;
}

const greenText = (text: string) => `\x1b[32m${text}\x1b[0m`;
const redText = (text: string) => `\x1b[31m${text}\x1b[0m`;
const purpleText = (text: string) => `\x1b[35m${text}\x1b[0m`;

void main();
