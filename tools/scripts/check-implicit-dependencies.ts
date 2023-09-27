const { createProjectGraphAsync } = require('@nx/workspace/src/core/project-graph');

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

  const ownPkgs = Object.keys(graph.nodes).filter(key => isLib(graph.nodes[key].data.root));
  const ownPkgSet = new Set(ownPkgs);

  const packageContent: Record<string, PackageJson> = {};
  for (const pkg of ownPkgs) {
    const pkgJson = require(`../../${graph.nodes[pkg].data.root}/package.json`);
    packageContent[pkg] = pkgJson;
  }
  for (const pkg of ownPkgs) {
    const pkgJson = packageContent[pkg];

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
      console.error(`Package ${pkg} has some version mismatches`);
      for (const mismatch of mismatches) {
        console.log(`- "${mismatch.name}": ${mismatch.used}"`);
        console.log(`+ "${mismatch.name}": ${mismatch.expected}"`);
      }
      console.log();
    }

    // 2) Check that packages are present
    for (const declaredDep of Object.keys(declaredDeps)) {
      analyzedDeps.delete(declaredDep);
    }
    if (analyzedDeps.size > 0) {
      hasError = true;
      console.error(`Package ${pkg} is missing some dependencies`);
      for (const dep of Array.from(analyzedDeps)) {
        console.error(`"${dep}": "${packageContent[dep].version}",`);
      }
      console.log();
    }
  }

  process.exit(hasError ? 1 : 0);
}

void main();
