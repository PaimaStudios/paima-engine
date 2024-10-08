import fs from 'fs';
import type esbuild from 'esbuild';

export function generateConfig(
  apiFolder: string,
  stfFolder: string,
  precompilesFolder: string,
  eventsFolder: string
): {
  config: esbuild.BuildOptions;
  outFiles: Record<string, string>;
  workspace: string;
} {
  const workspace = process.env.BUNDLE_WORKSPACE;
  if (!workspace) throw new Error('BUNDLE_WORKSPACE variable not set.');

  if (!fs.existsSync(workspace)) throw new Error(`Invalid workspace: ${workspace}.`);

  const outFiles = {
    [apiFolder]: 'endpoints.cjs',
    [stfFolder]: 'gameCode.cjs',
    [precompilesFolder]: 'precompiles.cjs',
    [eventsFolder]: 'events.cjs',
  };

  const config: esbuild.BuildOptions = {
    platform: 'node',
    entryPoints: [`${workspace}/src/index.ts`],
    bundle: true,
    format: 'cjs',
    outfile: `packaged/${outFiles[workspace]}`,
    external: ['pg-native'],
  };
  return {
    config,
    workspace,
    outFiles,
  };
}
