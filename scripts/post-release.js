'use strict';

const { exec } = require('@actions/exec');
const pkg = require('../package.json');

async function main() {
  const [major, minor] = pkg.version.split('.');
  const tag = `v${pkg.version}`;
  const latestTags = [`v${major}`, `v${major}.${minor}`];

  try {
    await exec('git', ['push', '--delete', 'origin', ...latestTags], {
      failOnStdErr: false,
    });
  } finally {
    for (const latestTag of latestTags) {
      await exec('git', ['tag', '--force', latestTag, tag]);
    }

    await exec('git', ['push', 'origin', '--tags']);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
