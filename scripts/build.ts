import { exec } from '@actions/exec';
import { build } from 'esbuild';
import path from 'path';

async function main() {
  const cwd = process.cwd();
  const [dir] = process.argv.slice(2);
  const rootDir = !dir ? cwd : path.join(cwd, dir);
  const entry = path.join(rootDir, 'index.ts');
  const out = path.join(rootDir, 'dist', 'index.js');

  await build({
    bundle: true,
    platform: 'node',

    entryPoints: [entry],
    outfile: out,

    target: 'node12',

    // define: {
    //   // Eliminate dead code.
    //   'process.env.NODE_ENV': JSON.stringify('production'),
    // },
  });

  // entryPoints: ['app.js'],
  //   bundle: true,
  //   platform: 'node',
  //   target: ['node10.4'],
  //   outfile: 'out.js',

  // await exec('rm', ['-rf', out]);
  //
  // await exec('ncc', [
  //   'build',
  //   entry,
  //   '--out',
  //   out,
  //   '--external',
  //   'encoding', // Optional dependency of the `node-fetch`.
  //   '--source-map',
  // ]);
}

main().catch((error) => {
  console.error(error);

  process.exit(1);
});
