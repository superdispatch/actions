import { info } from '@actions/core';
import { create as createGlob } from '@actions/glob';
import { promises as fs } from 'fs';
import path from 'path';
import { brotliCompress } from 'zlib';

async function computeFileSize(filename: string): Promise<number> {
  const buffer = await fs.readFile(filename);

  return new Promise((resolve, reject) => {
    brotliCompress(buffer, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result.byteLength);
      }
    });
  });
}

function isValidFile(filename: string) {
  return (
    /\.(js|css|htm|html)$/.test(filename) &&
    !/service-worker\.js$/.test(filename) &&
    !/precache-manifest\.[0-9a-f]+\.js$/.test(filename)
  );
}

interface GetFileNameKeyOptions {
  hashPattern: string;
  hashPlaceholder: string;
}

function getFileNameKey(
  filename: string,
  buildPath: string,
  options: GetFileNameKeyOptions,
): string {
  const key = path.relative(buildPath, filename);

  return (
    key
      // default behavior `1.a57f92fb.chunk.js` -> `1.[hash].chunk.js`
      .replace(new RegExp(options.hashPattern), options.hashPlaceholder)
  );
}

export async function getBuildSizes(
  dir: string,
  options: GetFileNameKeyOptions,
): Promise<Record<string, number>> {
  info(`Computing build size for the: ${dir}`);
  const globber = await createGlob(dir);
  const [buildPath] = globber.getSearchPaths();

  const sizes: Record<string, number> = {};

  for await (const filename of globber.globGenerator()) {
    if (!isValidFile(filename) || !buildPath) continue;

    const key = getFileNameKey(filename, buildPath, options);
    const fileSize = await computeFileSize(filename);
    //index.[hash].js - 300KB, index.[hash].js - 0.3KB -> index.[hash].js - 300.3KB
    sizes[key] = (sizes[key] || 0) + fileSize;
  }

  info(`Computed file sizes:\n${JSON.stringify(sizes, null, 2)}`);

  return sizes;
}
