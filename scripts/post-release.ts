import { exec } from '@actions/exec';
import { version } from '../package.json';

async function replaceLatestReleaseTags() {
  const [major, minor] = version.split('.');
  const tag = `v${version}`;
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

async function main() {
  await replaceLatestReleaseTags();
  await exec('np', ['--release-draft-only']);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
