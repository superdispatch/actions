import { exec } from '@actions/exec';
import { build } from 'esbuild';
import path from 'path';

async function main() {
  const cwd = process.cwd();
  const [dir] = process.argv.slice(2);
  const rootDir = !dir ? cwd : path.join(cwd, dir);
  const entry = path.join(rootDir, 'index.ts');
  const out = path.join(rootDir, 'dist');

  await exec('rm', ['-rf', out]);

  await build({
    bundle: true,
    entryPoints: [entry],
    outdir: out,

    target: 'node12',
    platform: 'node',
    minifySyntax: true,
    external: ['encoding'],

    // Fix for the https://github.com/node-fetch/node-fetch/issues/784
    keepNames: true,
  });
}

main().catch((error) => {
  console.error(error);

  process.exit(1);
});
