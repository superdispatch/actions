import { ReserveCacheError, saveCache } from '@actions/cache';
import { getInput, info, setFailed, warning } from '@actions/core';
import { getBuildSizes } from '@actions/utils/BuildSizes';
import { getBuildSnapshotMeta } from '@actions/utils/BuildSnapshotMeta';
import { promises as fs } from 'fs';
import { format } from 'util';

main().catch(setFailed);

async function main() {
  const dir = getInput('dir');
  const sha = getInput('sha');
  const label = getInput('label');

  const meta = getBuildSnapshotMeta({ sha, label });

  info(format('Measuring build folder "%s"…', dir));

  const sizes = await getBuildSizes(dir);

  info(format('File sizes ready:\n%O', sizes));

  await fs.writeFile(meta.filename, JSON.stringify(sizes), 'utf-8');

  info(format('Writing "%s" to "%s" cache.', meta.filename, meta.key));

  try {
    await saveCache([meta.filename], meta.key);
  } catch (e: unknown) {
    if (e instanceof ReserveCacheError) {
      warning(e);
    } else {
      throw e;
    }
  }
}
