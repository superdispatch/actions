import { info } from '@actions/core';
import os from 'os';
import path from 'path';
import { format } from 'util';

export interface SnapshotMeta {
  key: string;
  restoreKey: string;
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
  const restoreKey = `build-size-v1-${label}-`;
  const key = restoreKey + sha;
  const meta: SnapshotMeta = {
    key,
    restoreKey,
    filename: path.join(os.tmpdir(), `${key}.json`),
  };

  info(
    format(
      'Snapshot meta for the { sha: %s, label: %s }: %O',
      sha,
      label,
      meta,
    ),
  );

  return meta;
}
