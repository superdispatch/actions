import { ReserveCacheError, restoreCache, saveCache } from '@actions/cache';
import { getInput, info, setFailed, warning } from '@actions/core';
import { promises as fs } from 'fs';
import { format } from 'util';

import { getBuildSizes } from '../utils/BuildSizes';
import { getBuildSnapshotMeta } from '../utils/BuildSnapshotMeta';

main().catch(setFailed);

async function main() {
  const dir = getInput('dir', { required: true });
  const sha = getInput('sha', { required: true });
  const label = getInput('label', { required: true });

  const meta = getBuildSnapshotMeta({ sha, label });

  info(format('Checking cache for the key "%s"…', meta.key));

  const restoredKey = await restoreCache([meta.filename], meta.key);

  if (restoredKey) {
    info('Cache hit, finishing the job…');

    return;
  }

  info(format('Computing build size of the "%s"…', dir));

  const sizes = await getBuildSizes(dir);

  info(format('Computed file sizes: %j', sizes));

  await fs.writeFile(meta.filename, JSON.stringify(sizes), 'utf-8');

  info(format('Writing "%s" to "%s" cache.', meta.filename, meta.key));

  try {
    await saveCache([meta.filename], meta.key);
  } catch (error: unknown) {
    if (error instanceof ReserveCacheError) {
      warning(error);
    } else {
      throw error;
    }
  }
}
