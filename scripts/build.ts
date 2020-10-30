import { exec } from '@actions/exec';
import path from 'path';

async function main() {
  const cwd = process.cwd();
  const [dir] = process.argv.slice(2);
  const rootDir = !dir ? cwd : path.join(cwd, dir);
  const entry = path.join(rootDir, 'index.ts');
  const out = path.join(rootDir, 'dist');

  try {
    await exec('git', ['rm', '-rf', out]);
  } catch {
    await exec('rm', ['-rf', out]);
  }

  await exec('ncc', [
    'build',
    entry,
    '--out',
    out,
    '--external',
    'encoding', // Optional dependency of the `node-fetch`.
    '--source-map',
  ]);

  try {
    await exec('git', ['add', out]);
  } catch {
    await exec('git', ['status']);
  }
}

main().catch((error) => {
  console.error(error);

  process.exit(1);
});
