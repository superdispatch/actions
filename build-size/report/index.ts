import { restoreCache } from '@actions/cache';
import { getInput, group, info, setFailed, warning } from '@actions/core';
import { promises as fs } from 'fs';
import { sendReport } from 'utils/sendReport';
import { createBuildSizeDiffReport } from '../utils/BuildSizeDiffReport';
import { getBuildSizes } from '../utils/BuildSizes';
import { getBuildSnapshotMeta } from '../utils/BuildSnapshotMeta';

const pr = Number(getInput('pr', { required: true }));
const dir = getInput('dir', { required: true });
const sha = getInput('sha', { required: true });
const label = getInput('label', { required: true });
const token = getInput('token', { required: true });

async function main() {
  const content = await group('Generating report', async () => {
    info(`Computing build size for the: ${dir}`);
    const currentSizes = await getBuildSizes(dir);
    info(`Computed file sizes:\n${JSON.stringify(currentSizes, null, 2)}`);

    const meta = getBuildSnapshotMeta({ sha, label });
    info(`Restoring previous build size from: ${meta.key}, ${meta.restoreKey}`);
    const restoredKey = await restoreCache([meta.filename], meta.key, [
      meta.restoreKey,
    ]);

    if (!restoredKey) {
      warning(
        `Failed to restore previous build size from: ${meta.key}, ${meta.restoreKey}`,
      );

      return [
        '> ⚠️ Failed to restore previous build size from cache.',
        '',
        createBuildSizeDiffReport(currentSizes, {}, { deltaThreshold: 0 }),
      ].join('\n');
    }

    if (restoredKey !== meta.key) {
      warning(`Failed to restore previous build size from: ${meta.key}`);
    }

    const previousSizesJSON = await fs.readFile(meta.filename, 'utf-8');
    const previousSizes = JSON.parse(previousSizesJSON) as Record<
      string,
      number
    >;

    info(
      `Restored previous build file sizes:\n${JSON.stringify(
        previousSizes,
        null,
        2,
      )}`,
    );

    return createBuildSizeDiffReport(currentSizes, previousSizes);
  });

  await group('Sending build size report', () =>
    sendReport({
      pr,
      label,
      token,
      content,
      title: 'Build Size Report',
    }),
  );
}

main().catch(setFailed);
