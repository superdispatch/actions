import { getInput, group, info, setFailed } from '@actions/core';
import { context, getOctokit } from '@actions/github';
import { execOutput } from 'utils/exec';

const message = getInput('message');
const token = getInput('token', { required: true });
const command = getInput('command', { required: true });
const updateCommand = getInput('update-command', { required: true });

async function main() {
  const octokit = getOctokit(token);
  const branch = process.env.GITHUB_HEAD_REF;

  if (!branch) {
    throw new Error('GITHUB_HEAD_REF is not set');
  }

  try {
    await execOutput(command);
    info('Command executed successfully');

    return;
  } catch (error: unknown) {}

  info('Running update command');
  await execOutput(updateCommand);

  const { stdout: changes } = await execOutput('git', [
    'status',
    '--porcelain',
  ]);

  const files = changes
    .split('\n')
    .filter(Boolean)
    .map((file) => file.split(' ').pop());

  if (!files.length) {
    info('No changes detected');
  }

  await group('Committing changes', async () => {
    await execOutput('git', ['config', 'user.name', 'github_actions']);
    await execOutput('git', ['commit', '-am', message]);
    await execOutput('git', ['push', 'origin', `HEAD:${branch}`]);
  });

  const { stdout: sha } = await execOutput('git', ['rev-parse', 'HEAD']);
  const commitUrl = `https://github.com/${context.repo.owner}/${context.repo.repo}/pull/${context.issue.number}/commits/${sha}`;

  await octokit.rest.issues.createComment({
    issue_number: context.issue.number,
    owner: context.repo.owner,
    repo: context.repo.repo,
    body: `Detected snapshot changes. Updated in commit ${commitUrl}`,
  });
}

main().catch(setFailed);
