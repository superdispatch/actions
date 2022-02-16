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
    await group('Running command', async () => {
      const output = await execOutput(command);

      console.log(output);
    });
    return;
  } catch (error: unknown) {}

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
    await execOutput('git', ['checkout', branch]);
    await execOutput('git', ['config', 'user.name', 'github_actions']);
    await execOutput('git', ['commit', '-am', message]);
    await execOutput('git', ['push', 'origin', branch]);
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
