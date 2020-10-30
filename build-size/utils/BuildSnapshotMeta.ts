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
  const name = `build-size-v1-${label}`;
  const restoreKey = `${name}-`;
  const key = restoreKey + sha;
  const meta: BuildSnapshotMeta = {
    key,
    restoreKey,
    filename: path.join(os.tmpdir(), `${name}.json`),
  };

  info(format('Snapshot meta for the:\n%O\n%O', { sha, label }, meta));

  return meta;
}
