import fs from 'fs';
import type esbuild from 'esbuild';

export function generateConfig(apiFolder: string, stfFolder: string): esbuild.BuildOptions {
  const workspace = process.env.BUNDLE_WORKSPACE;
  if (!workspace) throw new Error('BUNDLE_WORKSPACE variable not set.');

  if (!fs.existsSync(workspace)) throw new Error(`Invalid workspace: ${workspace}.`);

  const outFile = {
    [apiFolder]: 'endpoints.cjs',
    [stfFolder]: 'gameCode.cjs',
  };
  return {
    platform: 'node',
    entryPoints: [`${workspace}/src/index.ts`],
    bundle: true,
    format: 'cjs',
    outfile: `packaged/${outFile[workspace]}`,
    external: ['pg-native'],
  };
}
