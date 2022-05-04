import { getInput, group, info, setFailed } from '@actions/core';
import { context, getOctokit } from '@actions/github';

const limit = Number(getInput('limit', { required: true }));
const token = getInput('token', { required: true });
const octokit = getOctokit(token);

main().catch(setFailed);

async function main() {
  await group('Checking PR limit', async () => {
    const pr = context.payload.pull_request;

    if (!pr) {
      info('Skipping PR limit');
      return;
    }

    const userPRCount = await calculatePRCount();

    if (userPRCount > limit) {
      info('Limit exceeded. Closing PR');

      await closePRWithComment(pr.number);
    }
  });
}

async function calculatePRCount() {
  let userPRCount = 0;

  const pullRequests = await octokit.request(
    'GET /repos/{owner}/{repo}/pulls',
    context.repo,
  );

  for (const item of pullRequests.data) {
    if (item.user?.login === context.actor) {
      userPRCount++;
    }
  }

  return userPRCount;
}

async function closePRWithComment(prNumber: number) {
  await octokit.request(
    'POST /repos/{owner}/{repo}/issues/{issue_number}/comments',
    {
      ...context.repo,
      body: `You can create max ${limit} pull requests at once. Closing PR...`,
      issue_number: prNumber,
    },
  );
  await octokit.request('PATCH /repos/{owner}/{repo}/pulls/{pull_number}', {
    ...context.repo,
    pull_number: prNumber,
    state: 'closed',
  });
}
