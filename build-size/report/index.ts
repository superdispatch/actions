import { restoreCache } from '@actions/cache';
import { getInput, info, setFailed, warning } from '@actions/core';
import { context } from '@actions/github';
import { getBuildSizes } from '@actions/utils/BuildSizes';
import { getBuildSnapshotMeta } from '@actions/utils/BuildSnapshotMeta';
import { sendReport } from '@actions/utils/sendReport';
import filesize from 'filesize';
import { promises as fs } from 'fs';
import path from 'path';
import { format } from 'util';

function toFinite(value: unknown): number {
  return typeof value == 'number' && Number.isFinite(value) ? value : 0;
}

function formatRow(
  currentSize: number,
  previousSize: number,
): [size: string, delta: string, diff: string] {
  const formattedSize = filesize(currentSize);

  let delta = currentSize - previousSize;

  // Reduce noise from the insignificant changes.
  if (Math.abs(delta) < 512) {
    delta = 0;
  }

  const deltaFormat = delta > 0 ? '+%s' : '%s';
  const formattedDelta = format(deltaFormat, filesize(delta));

  const diff = delta / currentSize;
  const diffFormat = diff > 0 ? '+%s 🔺' : diff < 0 ? '%s 🔽' : '%s';
  const formattedDiff = format(
    diffFormat,
    diff.toLocaleString('en-us', { style: 'percent' }),
  );

  return [formattedSize, formattedDelta, formattedDiff];
}

async function getReportContent(
  dir: string,
  sha: string,
  label: string,
): Promise<string> {
  const meta = getBuildSnapshotMeta({ sha, label });

  info(format('Restoring cache from [%s, %s] keys', meta.key, meta.restoreKey));

  const restoredKey = await restoreCache([meta.filename], meta.key, [
    meta.restoreKey,
  ]);

  if (!restoredKey) {
    warning(
      format(
        'Failed to restore cache from [%s, %s] keys',
        meta.key,
        meta.restoreKey,
      ),
    );

    return 'Failed to restore previous report cache.';
  }

  if (restoredKey !== meta.key) {
    warning(
      format(
        'Failed to find latest key for sha "%s", using "%s" instead.',
        sha,
        restoredKey,
      ),
    );
  }

  const previousSizesJSON = await fs.readFile(meta.filename, 'utf-8');
  const previousSizes = JSON.parse(previousSizesJSON) as Record<string, number>;
  const currentSizes = await getBuildSizes(dir);

  const files = Object.keys({
    ...previousSizes,
    ...currentSizes,
  }).sort((a, b) => a.localeCompare(b));

  let totalCurrentSize = 0;
  let totalPreviousSize = 0;

  const rows = [
    format('%s...%s', sha, context.sha),
    '| Path | Size | Delta |',
    '| - | - | - |',
  ];

  for (const file of files) {
    const currentSize = toFinite(currentSizes[file]);
    const previousSize = toFinite(previousSizes[file]);

    totalCurrentSize += currentSize;
    totalPreviousSize += previousSize;

    const [size, delta, diff] = formatRow(currentSize, previousSize);

    rows.push(
      format(
        '| %s/**%s** | %s | %s (%s) |',
        path.dirname(file),
        path.basename(file),
        size,
        delta,
        diff,
      ),
    );
  }

  const [totalSize, totalDelta, totalDiff] = formatRow(
    totalCurrentSize,
    totalPreviousSize,
  );

  rows.push(format('| | %s | %s (%s) |', totalSize, totalDelta, totalDiff));

  return rows.join('\n');
}

async function main() {
  const pr = getInput('pr', { required: true });
  const dir = getInput('dir', { required: true });
  const sha = getInput('sha', { required: true });
  const label = getInput('label', { required: true });
  const token = getInput('token', { required: true });

  const content = await getReportContent(dir, sha, label);

  return sendReport({
    pr,
    label,
    token,
    content,
    title: 'Build Size Report',
  });
}

main().catch(setFailed);
