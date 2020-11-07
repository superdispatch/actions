import { ReserveCacheError, restoreCache, saveCache } from '@actions/cache';
import { getInput, setFailed, warning } from '@actions/core';
import { exec } from '@actions/exec';
import { sendReport } from '@sd/utils/sendReport';
import { promises as fs } from 'fs';

import { createBuildSizeDiffReport } from '../utils/BuildSizeDiffReport';

const pr = getInput('pr', { required: true });
const base = getInput('base_ref', { required: true });
const token = getInput('token', { required: true });
const target = getInput('target', { required: false });
const buildCommand = getInput('build_command', { required: false });
const installCommand = getInput('install_command', { required: false });
const snapshotName = `size-limit-snapshot-${base}.json`;

main().catch(setFailed);

async function setup() {
  if (installCommand) {
    await exec(installCommand);
  }

  if (buildCommand) {
    await exec(buildCommand);
  }
}

async function computeSizes(): Promise<Record<string, number>> {
  const args = ['size-limit', '--json'];

  if (target) {
    args.push(target);
  }

  let json = '';

  await exec('npx', args, {
    listeners: {
      stdout: (data) => {
        json += data.toString();
      },
    },
  });

  const sizes: Record<string, number> = {};

  for (const { name, size } of JSON.parse(json) as Array<{
    name: string;
    size: number;
  }>) {
    sizes[name] = size;
  }

  return sizes;
}

async function computePreviousSizes(): Promise<Record<string, number>> {
  const restoreKey = await restoreCache([snapshotName], snapshotName);

  if (restoreKey) {
    const json = await fs.readFile(snapshotName, 'utf-8');

    return JSON.parse(json) as Record<string, number>;
  }

  let currentRef = '';

  await exec('git ', ['rev-parse', 'HEAD'], {
    listeners: {
      stdout: (data) => {
        currentRef += data.toString();
      },
    },
  });

  await exec('git', ['fetch', 'origin', base, '--depth', '1']);
  await exec('git', ['checkout', '--force', base]);

  await setup();

  const sizes = await computeSizes();

  await fs.writeFile(snapshotName, JSON.stringify(sizes), 'utf-8');

  try {
    await saveCache([snapshotName], snapshotName);
  } catch (error: unknown) {
    if (error instanceof ReserveCacheError) {
      warning(error);
    } else {
      throw error;
    }
  }

  await exec('git', ['checkout', '--force', currentRef.trim()]);

  return sizes;
}

async function main() {
  await setup();

  const currentSizes = await computeSizes();
  const previousSizes = await computePreviousSizes();

  await sendReport({
    pr,
    token,
    title: 'Size Limit Report',
    content: createBuildSizeDiffReport(currentSizes, previousSizes),
  });
}
