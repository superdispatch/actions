import os from 'os';
import path from 'path';

export interface BuildSnapshotMeta {
  key: string;
  restoreKey: string;
  filename: string;
}

export interface BuildSnapshotMetaOptions {
  sha: string;
  label: string;
}

export function getBuildSnapshotMeta({
  sha,
  label,
}: BuildSnapshotMetaOptions): BuildSnapshotMeta {
  const name = `build-size-v1-${label}`;
  const restoreKey = `${name}-`;
  const key = restoreKey + sha;

  return {
    key,
    restoreKey,
    filename: path.join(os.tmpdir(), `${name}.json`),
  };
}
