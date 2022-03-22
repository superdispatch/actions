import { getInput, group, info, setFailed, warning } from '@actions/core';
import { context, getOctokit } from '@actions/github';
import { GitHub } from '@actions/github/lib/utils';
import { execOutput } from 'utils/exec';

const message = getInput('message');
const dryRun = getInput('dry-run');
const token = getInput('token', { required: true });
const command = getInput('command', { required: true });
const updateCommand = getInput('update-command', { required: true });

async function main() {
  let exitCode = 0;

  const octokit = getOctokit(token);
  const branch = process.env.GITHUB_HEAD_REF;

  if (!branch) {
    warning('GITHUB_HEAD_REF is not found');
    info('Skipping...');
    return;
  }

  const completeCheck = await createCheck(octokit);

  try {
    await group('Running command', async () => {
      const result = await execOutput(command);

      exitCode = result.exitCode;

      if (result.exitCode !== 0) {
        throw new Error(`Command exited with code ${exitCode}`);
      }
    });
  } catch (error: unknown) {}

  console.log({ exitCode });

  if (exitCode === 0) {
    info('Command successfully finished');

    await completeCheck({
      conclusion: 'success',
      output: {
        title: `"${command}" succeed`,
      },
    });
    return;
  }

  await checkoutRepo(branch);

  await group('Running update command', async () => {
    await execOutput(updateCommand);
  });

  const { stdout: changes } = await execOutput('git', [
    'status',
    '--porcelain',
  ]);

  const changedFiles = changes
    .split('\n')
    .filter(Boolean)
    .map((file) => file.split(' ').pop());

  if (!changedFiles.length) {
    info('No changes detected');
    return;
  }

  await group('Committing changes', async () => {
    if (dryRun === 'true') {
      info('Dry run enabled, skipping commit');
      return;
    }

    await execOutput('git', ['add', '.']);
    await execOutput('git', ['commit', '-m', message]);
    await execOutput('git', ['push', 'origin', branch]);
  });

  if (dryRun === 'true') {
    info('Dry run enabled, skipping PR comment');
    return;
  }

  const { stdout: sha } = await execOutput('git', ['rev-parse', 'HEAD']);
  const commitUrl = `https://github.com/${context.repo.owner}/${context.repo.repo}/pull/${context.issue.number}/commits/${sha}`;

  await completeCheck({
    details_url: commitUrl,
    conclusion: 'failure',
    output: {
      title: `"${command}" failed`,
      summary: `Snapshots are updated for command: "${command}"`,
    },
  });

  await octokit.rest.issues.createComment({
    issue_number: context.issue.number,
    owner: context.repo.owner,
    repo: context.repo.repo,
    body: `🚨 **Snapshot command failed**

Snapshots are updated automatically in following commit ${commitUrl}
Please review before merging.`,
  });
}

async function checkoutRepo(branch: string) {
  await execOutput('git', ['config', 'user.name', 'github_actions']);
  await execOutput('git', [
    'config',
    'user.email',
    'github-actions[bot]@users.noreply.github.com',
  ]);

  await execOutput('git', ['fetch', '--unshallow', 'origin', branch]);
  await execOutput('git', ['checkout', '-b', branch, `origin/${branch}`]);
}

interface CheckDetails {
  details_url?: string;
  conclusion?: 'failure' | 'success';
  output?: {
    title?: string;
    summary?: string;
  };
}

export async function createCheck(octokit: InstanceType<typeof GitHub>) {
  const pull_request = context.payload.pull_request as unknown as {
    head: { sha: string };
  };

  const check = await octokit.rest.checks.create({
    ...context.repo,
    name: 'Update snapshots',
    head_sha: pull_request.head.sha,
    status: 'in_progress',
  });

  return async (details: CheckDetails) => {
    await octokit.rest.checks.update({
      ...context.repo,
      check_run_id: check.data.id,
      completed_at: new Date().toISOString(),
      status: 'completed',
      ...details,
    });
  };
}

main().catch(setFailed);
