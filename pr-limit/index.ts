import { getInput, group, setFailed, info } from '@actions/core';
import {getOctokit, context} from '@actions/github';

const limit = Number(getInput('limit', { required: true }));
const token = getInput('token', { required: true });

async function main() {
  const octokit = getOctokit(token);

  await group('Checking PR limit', async () => {
    let userPRCount = 0;
    const pr = context.payload.pull_request;

    if (!pr) {
      info('Skipping PR limit');
      return;
    }

    const pullRequests = await octokit.request('GET /repos/{owner}/{repo}/pulls', context.repo);

    for (const item of pullRequests.data) {
      if (item.user?.login === context.actor) {
        userPRCount++;
      }
    }

    if (userPRCount > limit) {
      await octokit.request(
        'POST /repos/{owner}/{repo}/issues/{issue_number}/comments',
        { ...context.repo, body: `You can create max ${limit} PRs at once. Close the PR...`, issue_number: pr.number },
      );
      await octokit.request('PATCH /repos/{owner}/{repo}/pulls/{pull_number}', {
        ...context.repo,
        pull_number: pr.number,
        body: JSON.stringify({ state: 'closed '})
      })
    }
  });
}

main().catch(setFailed);
