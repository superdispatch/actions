import glob from '@actions/glob';
import { promises as fs } from 'fs';
import path from 'path';
import { gzip } from 'zlib';

async function computeFileSize(filename: string): Promise<number> {
  const buffer = await fs.readFile(filename);

  return new Promise((resolve, reject) => {
    gzip(buffer, { level: 9 }, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result.length);
      }
    });
  });
}

interface BuildSizesOptions {
  dir: string;
  cwd: string;
}

export async function getBuildSizes({
  dir,
  cwd,
}: BuildSizesOptions): Promise<Record<string, number>> {
  const absoluteDir = path.isAbsolute(dir) ? dir : path.join(cwd, dir);
  const sizes: Record<string, number> = {};

  const globber = await glob.create(`${absoluteDir}/**/*.{js,css}`);

  for await (const filename of globber.globGenerator()) {
    sizes[filename] = await computeFileSize(filename);
  }

  return sizes;
}
