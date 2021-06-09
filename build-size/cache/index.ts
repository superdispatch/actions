import { ReserveCacheError, restoreCache, saveCache } from '@actions/cache';
import { getInput, group, info, setFailed, warning } from '@actions/core';
import { promises as fs } from 'fs';
import { getBuildSizes } from '../utils/BuildSizes';
import { getBuildSnapshotMeta } from '../utils/BuildSnapshotMeta';

const dir = getInput('dir', { required: true });
const sha = getInput('sha', { required: true });
const label = getInput('label', { required: true });

main().catch(setFailed);

async function main() {
  const meta = getBuildSnapshotMeta({ sha, label });

  const restoredKey = await group('Checking cache', () => {
    info(`Restoring cache for the: ${meta.key}`);
    return restoreCache([meta.filename], meta.key);
  });

  if (restoredKey) {
    info('Cache hit, skipping further computations');
    return;
  }

  await group('Computing build size', async () => {
    const sizes = await getBuildSizes(dir);

    info(`Writing build size report to: ${meta.filename}`);
    await fs.writeFile(meta.filename, JSON.stringify(sizes), 'utf-8');

    try {
      info(`Caching report to: ${meta.key}`);
      await saveCache([meta.filename], meta.key);
    } catch (error: unknown) {
      if (error instanceof ReserveCacheError) {
        warning(error);
      } else {
        throw error;
      }
    }
  });
}
