import { build } from 'esbuild';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const root = dirname(fileURLToPath(import.meta.url));

await build({
  entryPoints: [`${root}/mina.worker.js`],
  outfile: `${root}/mina.worker.txt`,
  bundle: true,
  format: 'esm',
});
