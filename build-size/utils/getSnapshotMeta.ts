import os from 'os';
import path from 'path';

export interface SnapshotMeta {
  key: string;
  filename: string;
}

export interface SnapshotMetaOptions {
  sha: string;
  label: string;
}

export function getSnapshotMeta({
  sha,
  label,
}: SnapshotMetaOptions): SnapshotMeta {
  const key = `build-size-v1-${label}-${sha}`;

  return { key, filename: path.join(os.tmpdir(), `${key}.json`) };
}
