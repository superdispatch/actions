'use strict';

const path = require('path');
const fs = require('fs');
const esbuild = require('esbuild');
const glob = require('@actions/glob');
const { exec } = require('@actions/exec');

const ROOT_DIR = path.join(__dirname, '..');

async function main() {
  const globber = await glob.create(`
    ${ROOT_DIR}/**/action.yml
    !${ROOT_DIR}/node_modules
  `);

  for await (const actionPath of globber.globGenerator()) {
    const actionDir = path.dirname(actionPath);
    const entryPath = path.join(actionDir, 'index.ts');
    const outDir = path.join(actionDir, 'dist');
    const outPath = path.join(outDir, 'index.js');

    if (!fs.existsSync(entryPath)) {
      return;
    }

    console.log('Installing: %s', path.relative(ROOT_DIR, actionDir));

    await esbuild.build({
      bundle: true,
      entryPoints: [entryPath],
      outfile: outPath,

      target: 'node16',
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

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
