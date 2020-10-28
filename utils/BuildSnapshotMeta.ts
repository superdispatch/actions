import { info } from '@actions/core';
import os from 'os';
import path from 'path';
import { format } from 'util';

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
  const restoreKey = `build-size-v1-${label}-`;
  const key = restoreKey + sha;
  const meta: BuildSnapshotMeta = {
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
