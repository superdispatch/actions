import { saveCache } from '@actions/cache';
import { getInput, info, setFailed } from '@actions/core';
import fs from 'fs';

import { getBuildSizes } from '../utils/getBuildSizes';
import { getSnapshotMeta } from '../utils/getSnapshotMeta';

main().catch(setFailed);

async function main() {
  const dir = getInput('dir');
  const sha = getInput('sha');
  const label = getInput('label');

  const meta = getSnapshotMeta({ sha, label });

  info(
    `Snapshot meta for the ${JSON.stringify({ sha, label })}: ${JSON.stringify(
      meta,
    )}`,
  );

  info(`Measuring build folder "${dir}"…`);

  const sizes = await getBuildSizes({ dir, cwd: process.cwd() });

  info(`File sizes ready: ${JSON.stringify(sizes)}`);

  fs.writeFileSync(meta.filename, JSON.stringify(sizes), 'utf-8');

  info(`Writing "${meta.filename}" to "${meta.key}" cache.`);

  await saveCache([meta.filename], meta.key);
}
