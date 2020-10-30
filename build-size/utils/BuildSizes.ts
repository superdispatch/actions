import { create as createGlob } from '@actions/glob';
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

function isValidFile(filename: string) {
  return (
    /\.(js|css)$/.test(filename) &&
    !/service-worker\.js$/.test(filename) &&
    !/precache-manifest\.[0-9a-f]+\.js$/.test(filename)
  );
}

function getFileNameKey(filename: string, buildPath: string): string {
  const key = path.relative(buildPath, filename);

  return (
    key
      // `1.a57f92fb.chunk.js` -> `1.[hash].chunk.js`
      .replace(/\.([a-f0-9])+\./, '.[hash].')
  );
}

export async function getBuildSizes(
  dir: string,
): Promise<Record<string, number>> {
  const globber = await createGlob(dir);
  const [buildPath] = globber.getSearchPaths();

  const sizes: Record<string, number> = {};

  for await (const filename of globber.globGenerator()) {
    if (!isValidFile(filename)) {
      continue;
    }

    const key = getFileNameKey(filename, buildPath);

    sizes[key] = await computeFileSize(filename);
  }

  return sizes;
}
