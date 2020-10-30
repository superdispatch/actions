import prettyBytes from 'pretty-bytes';
import { format } from 'util';

function toFinite(value: unknown): number {
  return typeof value == 'number' && Number.isFinite(value) ? value : 0;
}

function normalizeDelta(delta: number): number {
  const absoluteDelta = Math.abs(delta);

  if (absoluteDelta < 512) return 0;

  return Math.sign(delta) * (Math.ceil(absoluteDelta * 100) / 100);
}

function getDiffIcon(diff: number): string {
  if (diff >= 0.5) return '🆘';
  if (diff >= 0.2) return '🚨';
  if (diff >= 0.1) return '⚠️';
  if (diff >= 0.05) return '🔍';
  if (diff <= -0.5) return '🏆';
  if (diff <= -0.2) return '🎉';
  if (diff <= -0.1) return '👏';
  if (diff <= -0.05) return '✅';
  return '';
}

function formatRow(
  size: number,
  delta: number,
): [size: string, delta: string, diff: string, icon: string] {
  const formattedSize = prettyBytes(size);
  const formattedDelta = prettyBytes(delta, { signed: true });
  const diff = delta / size;
  const diffFormat = diff > 0 ? '+%s' : '%s';
  const formattedDiff = format(
    diffFormat,
    diff.toLocaleString('en-US', { style: 'percent' }),
  );

  return [formattedSize, formattedDelta, formattedDiff, getDiffIcon(diff)];
}

export function createBuildSizeDiffReport(
  currentSizes: Record<string, number>,
  previousSizes: Record<string, number>,
): string {
  let totalSize = 0;
  let totalDelta = 0;
  const changedRows: string[] = [];
  const unChangedRows: string[] = [];
  const files = Object.keys({
    ...currentSizes,
    ...previousSizes,
  }).sort((a, b) => a.localeCompare(b));

  for (const file of files) {
    const size = toFinite(currentSizes[file]);
    const delta = normalizeDelta(size - toFinite(previousSizes[file]));

    totalSize += size;
    totalDelta += delta;

    const [formattedSize, formattedDelta, formattedDiff, diffIcon] = formatRow(
      size,
      delta,
    );

    if (delta === 0) {
      unChangedRows.push(format('| `%s` | %s |', file, formattedSize));
    } else {
      changedRows.push(
        format(
          '| `%s` | %s | %s (%s) | %s |',
          file,
          formattedSize,
          formattedDelta,
          formattedDiff,
          diffIcon,
        ),
      );
    }
  }

  const [
    formattedTotalSize,
    formattedTotalDelta,
    formattedTotalDiff,
    totalDiffIcon,
  ] = formatRow(totalSize, totalDelta);

  const lines = [format('**Total Size**: %s', formattedTotalSize)];

  if (totalDelta > 0) {
    lines.push('');
    lines.push(
      format(
        '**Size Change**: %s (%s) %s',
        formattedTotalDelta,
        formattedTotalDiff,
        totalDiffIcon,
      ),
    );
  }

  lines.push('');

  if (changedRows.length > 0) {
    lines.push('| Filename | Size | Change |     |');
    lines.push('| :------- | ---: | -----: | :-: |');
    lines.push(...changedRows);
  }

  if (unChangedRows.length > 0) {
    lines.push('', '');
    lines.push(
      '<details><summary>ℹ️ <strong>View Unchanged</strong></summary>',
    );
    lines.push('', '');
    lines.push('| Filename | Size |');
    lines.push('| :------- | ---: |');
    lines.push(...unChangedRows);
  }

  return lines.join('\n');
}
