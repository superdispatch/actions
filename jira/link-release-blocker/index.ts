import { getInput, info, setFailed } from '@actions/core';
import { context, getOctokit } from '@actions/github';
import { createClient } from '../utils/JiraAPI';
import { findIssue } from '../utils/JiraIssue';

const token = getInput('token', { required: true });

const SHA = process.env.GITHUB_SHA;
const REF_NAME = process.env.GITHUB_REF_NAME;

async function main() {
  if (REF_NAME !== 'main' && REF_NAME !== 'master') {
    info('Skipping... This action runs only in main/master branch');
    return;
  }

  if (!SHA) {
    info('Skipping... Could not find commit hash');
    return;
  }

  const octokit = getOctokit(token);
  const jira = createClient();

  const { data: commits } = await octokit.request(
    'GET /repos/{owner}/{repo}/commits',
    { ...context.repo, sha: SHA },
  );

  const mainIssue = await findIssue(commits[0].commit.message);

  if (!mainIssue) {
    info('Skipping... Could not find issue');
    return;
  }

  info(`Found main "${mainIssue.key}" issue`);

  for (const item of commits.slice(1)) {
    const blockerIssue = await findIssue(item.commit.message);

    if (blockerIssue) {
      info(`Found blocker "${blockerIssue.key}" issue`);
      info(`Linking "${blockerIssue.key} Blocks ${mainIssue.key}" ...`);

      await jira.issueLink({
        outwardIssue: blockerIssue.key,
        type: 'Blocks',
        inwardIssue: mainIssue.key,
      });

      info('Successfully linked');

      break;
    }
  }

  info('Could not find target issue from commits');
}

main().catch(setFailed);
