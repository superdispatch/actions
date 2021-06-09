import { exec, ExecOptions } from '@actions/exec';

export interface ExecOutput {
  /** Concatenated lines from the stdout */
  stdout: string;
  /** Concatenated lines from the stderr */
  stderr: string;
  /** Lines from the each debug log */
  debug: string[];
}

export async function execOutput(
  commandLine: string,
  args?: string[],
  options?: Omit<ExecOptions, 'listeners'>,
): Promise<ExecOutput> {
  const output: ExecOutput = { debug: [], stdout: '', stderr: '' };

  await exec(commandLine, args, {
    ...options,
    listeners: {
      stdline(line) {
        output.stdout += line;
      },
      errline(line) {
        output.stderr += line;
      },
      debug(data) {
        output.debug.push(data);
      },
    },
  });

  return output;
}

export async function execString(
  commandLine: string,
  args?: string[],
  options?: Omit<ExecOptions, 'listeners'>,
): Promise<string> {
  const { stdout } = await execOutput(commandLine, args, options);
  return stdout.trim();
}

export async function execJSON<T>(
  commandLine: string,
  args?: string[],
  options?: Omit<ExecOptions, 'listeners'>,
): Promise<T> {
  const json = await execString(commandLine, args, options);
  return JSON.parse(json) as T;
}
