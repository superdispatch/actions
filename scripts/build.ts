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
    const outPath = path.join(actionDir, 'dist', 'index.js');

    console.log('Installing %s…', path.relative(ROOT_DIR, actionDir));

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
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
