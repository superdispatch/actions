import { saveCache } from '@actions/cache';
import { getInput, info, setFailed } from '@actions/core';
import { getBuildSizes } from '@actions/utils/BuildSizes';
import { getBuildSnapshotMeta } from '@actions/utils/BuildSnapshotMeta';
import { promises as fs } from 'fs';

main().catch(setFailed);

async function main() {
  const dir = getInput('dir');
  const sha = getInput('sha');
  const label = getInput('label');

  const meta = getBuildSnapshotMeta({ sha, label });

  info(`Measuring build folder "${dir}"…`);

  const sizes = await getBuildSizes({ dir, cwd: process.cwd() });

  info(`File sizes ready: ${JSON.stringify(sizes)}`);

  await fs.writeFile(meta.filename, JSON.stringify(sizes), 'utf-8');

  info(`Writing "${meta.filename}" to "${meta.key}" cache.`);

  await saveCache([meta.filename], meta.key);
}
