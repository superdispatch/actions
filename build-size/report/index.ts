import { restoreCache } from '@actions/cache';
import { getInput, group, info, setFailed, warning } from '@actions/core';
import { promises as fs } from 'fs';
import { sendReport } from 'utils/sendReport';
import { createBuildSizeDiffReport } from '../utils/BuildSizeDiffReport';
import { getBuildSizes } from '../utils/BuildSizes';
import { getBuildSnapshotMeta } from '../utils/BuildSnapshotMeta';

const pr = Number(getInput('pr', { required: true }));
const dir = getInput('dir', { required: true });
const hashPattern = getInput('hash-pattern', { required: false });
const hashPlaceholder = getInput('hash-placeholder', { required: false });
const sha = getInput('sha', { required: true });
const label = getInput('label', { required: true });
const token = getInput('token', { required: true });

async function main() {
  const currentSizes = await group('Computing current build size', () =>
    getBuildSizes(dir, { hashPattern, hashPlaceholder }),
  );

  const report = await group(
    'Restoring previous build size from cache',
    async () => {
      const meta = getBuildSnapshotMeta({ sha, label });
      info(`Restoring from: ${meta.key}, ${meta.restoreKey}`);
      const restoredKey = await restoreCache([meta.filename], meta.key, [
        meta.restoreKey,
      ]);

      if (!restoredKey) {
        warning(
          `Failed to restore previous build size from: ${meta.key}, ${meta.restoreKey}`,
        );

        return [
          '> ⚠️ Failed to restore build size from cache.',
          '',
          createBuildSizeDiffReport(currentSizes, {}, { deltaThreshold: 0 }),
        ].join('\n');
      }

      const lines: string[] = [];

      if (restoredKey !== meta.key) {
        warning(`Failed to restore last build size from: ${meta.key}`);
        lines.push('> ⚠️ Compared with the stale snapshot', '');
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

      lines.push(createBuildSizeDiffReport(currentSizes, previousSizes));

      return lines.join('\n');
    },
  );

  await group('Sending build size report', () =>
    sendReport({
      pr,
      label,
      token,
      content: report,
      title: 'Build Size Report',
    }),
  );
}

main().catch(setFailed);
