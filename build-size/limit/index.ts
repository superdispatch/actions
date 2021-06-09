import { ReserveCacheError, restoreCache, saveCache } from '@actions/cache';
import { getInput, group, info, setFailed, warning } from '@actions/core';
import { exec } from '@actions/exec';
import { promises as fs } from 'fs';
import { execJSON, execString } from 'utils/exec';
import { sendReport } from 'utils/sendReport';
import { createBuildSizeDiffReport } from '../utils/BuildSizeDiffReport';

const pr = Number(getInput('pr', { required: true }));
const base = getInput('base_ref', { required: true });
const token = getInput('token', { required: true });
const target = getInput('target', { required: false });
const buildCommand = getInput('build_command', { required: false });
const installCommand = getInput('install_command', { required: false });
const snapshotName = `size-limit-snapshot-${base}.json`;

main().catch(setFailed);

async function setup() {
  if (installCommand) {
    info('Running: install_command');
    await exec(installCommand);
  }

  if (buildCommand) {
    info('Running: build_command');
    await exec(buildCommand);
  }
}

async function computeSizes(): Promise<Record<string, number>> {
  const sizeLimitResult = await execJSON<Array<{ name: string; size: number }>>(
    'npx',
    ['size-limit', '--json', target].filter(Boolean),
  );

  const sizes: Record<string, number> = {};

  for (const { name, size } of sizeLimitResult) {
    sizes[name] = size;
  }

  info(`Computed build file sizes:\n${JSON.stringify(sizes, null, 2)}`);

  return sizes;
}

async function main() {
  const currentSizes = await group('Computing current build size', async () => {
    await setup();
    return computeSizes();
  });

  let previousSizes = await group(
    'Restoring previous build size from cache',
    async () => {
      info(`Restoring: ${snapshotName}`);
      const restoreKey = await restoreCache([snapshotName], snapshotName);
      if (!restoreKey) {
        info('Failed to from cache');
        return null;
      }

      const json = await fs.readFile(snapshotName, 'utf-8');
      const sizes = JSON.parse(json) as Record<string, number>;
      info(`Restored build file sizes:\n${JSON.stringify(sizes, null, 2)}`);
      return sizes;
    },
  );

  if (!previousSizes) {
    previousSizes = await group('Computing previous build size', async () => {
      info('Getting current revision');
      const currentRev = await execString('git ', ['rev-parse', 'HEAD']);

      info(`Checking out base revision: ${base}`);
      await exec('git', ['fetch', 'origin', base, '--depth', '1']);
      await exec('git', ['checkout', '--force', base]);

      await setup();

      const sizes = await computeSizes();
      info(`Saving report to: ${snapshotName}`);
      await fs.writeFile(snapshotName, JSON.stringify(sizes), 'utf-8');

      info(`Caching report: ${snapshotName}`);
      try {
        await saveCache([snapshotName], snapshotName);
      } catch (error: unknown) {
        if (error instanceof ReserveCacheError) warning(error);
        else throw error;
      }

      info(`Checking out to current revision: ${currentRev}`);
      await exec('git', ['checkout', '--force', currentRev]);

      return sizes;
    });
  }

  const buildSizeReport = createBuildSizeDiffReport(
    currentSizes,
    previousSizes,
    { deltaThreshold: 0 },
  );

  await group('Sending build size report', () =>
    sendReport({
      pr,
      token,
      title: 'Size Limit Report',
      content: buildSizeReport,
    }),
  );
}
