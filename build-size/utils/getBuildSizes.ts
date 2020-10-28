import path from 'path';
import { measureFileSizesBeforeBuild } from 'react-dev-utils/FileSizeReporter';

interface BuildSizesOptions {
  dir: string;
  cwd: string;
}

export async function getBuildSizes({
  dir,
  cwd,
}: BuildSizesOptions): Promise<Record<string, number>> {
  const absoluteDir = path.isAbsolute(dir) ? dir : path.join(cwd, dir);

  const { sizes } = await measureFileSizesBeforeBuild(absoluteDir);

  for (const filename of Object.keys(sizes)) {
    if (filename.startsWith('/')) {
      sizes[filename.slice(1)] = sizes[filename];
      delete sizes[filename];
    }
  }

  return sizes;
}
