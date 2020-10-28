import { saveCache } from '@actions/cache';
import { getInput, info, setFailed } from '@actions/core';
import { getBuildSizes } from '@actions/utils/getBuildSizes';
import { getSnapshotMeta } from '@actions/utils/getSnapshotMeta';
import fs from 'fs';

main().catch(setFailed);

async function main() {
  const dir = getInput('dir');
  const sha = getInput('sha');
  const label = getInput('label');

  const meta = getSnapshotMeta({ sha, label });

  info(`Measuring build folder "${dir}"…`);

  const sizes = await getBuildSizes({ dir, cwd: process.cwd() });

  info(`File sizes ready: ${JSON.stringify(sizes)}`);

  fs.writeFileSync(meta.filename, JSON.stringify(sizes), 'utf-8');

  info(`Writing "${meta.filename}" to "${meta.key}" cache.`);

  await saveCache([meta.filename], meta.key);
}
