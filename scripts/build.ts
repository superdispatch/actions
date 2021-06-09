import { exec } from '@actions/exec';
import { create as createGlob } from '@actions/glob';
import { build } from 'esbuild';
import * as path from 'path';

const ROOT_DIR = path.join(__dirname, '..');

async function main(): Promise<void> {
  const glob = await createGlob(`
    ${ROOT_DIR}/**/action.yml
    !${ROOT_DIR}/node_modules
  `);

  for await (const actionPath of glob.globGenerator()) {
    const actionDir = path.dirname(actionPath);
    const entryPath = path.join(actionDir, 'index.ts');
    const outDir = path.join(actionDir, 'dist');
    const outPath = path.join(outDir, 'index.js');

    console.log('Installing: %s', path.relative(ROOT_DIR, actionDir));

    await build({
      bundle: true,
      entryPoints: [entryPath],
      outfile: outPath,

      target: 'node12',
      platform: 'node',

      external: [
        // Optional dependency of the `node-fetch`.
        'encoding',
      ],

      // Fix for the https://github.com/node-fetch/node-fetch/issues/784
      keepNames: true,
    });

    if (process.env.CI) {
      let output = '';
      await exec('git', ['status', '--porcelain', outDir], {
        listeners: {
          stdline(line) {
            output += line;
          },
        },
      });

      if (output) {
        await exec('git', ['diff']);
        throw new Error('Build result do not matches with committed.');
      }
    }
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
