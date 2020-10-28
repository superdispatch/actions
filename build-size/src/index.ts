import { saveCache } from '@actions/cache';
import { getInput, info, setFailed } from '@actions/core';
import { context } from '@actions/github';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { measureFileSizesBeforeBuild } from 'react-dev-utils/FileSizeReporter';

main().catch(setFailed);

function getSnapshotInfo(label: string): [key: string, filepath: string] {
  const key = `build-size-v1-${label}-${context.sha}`;
  const filepath = path.join(
    os.tmpdir(),
    'superdispatch',
    'actions',
    'build-size',
    `${key}.json`,
  );

  info(`Snapshot info for the ${label}: key=${key}, filepath=${filepath}`);

  return [key, filepath];
}

async function getSizes(dir: string): Promise<Record<string, number>> {
  const absolutePath = path.join(process.cwd(), dir);

  info(`Measuring files from the "${absolutePath}"…`);

  const { sizes } = await measureFileSizesBeforeBuild(absolutePath);

  info(`File sizes ready: ${JSON.stringify(sizes)}`);

  return sizes;
}

async function collect(dir: string, label: string) {
  const [key, filepath] = getSnapshotInfo(label);
  const sizes = await getSizes(dir);

  fs.writeFileSync(filepath, JSON.stringify(sizes), 'utf-8');

  info(`Writing "${filepath}" to "${key}" cache.`);

  await saveCache([filepath], key);
}

async function main() {
  const dir = getInput('dir');
  const step = getInput('step');
  const label = getInput('label');

  switch (step) {
    case 'collect':
      return collect(dir, label);
    default: {
      throw new Error(`Unknown step "${step}".`);
    }
  }
}
