import { getInput, info, setFailed } from '@actions/core';
import { context, getOctokit } from '@actions/github';
import { createClient } from '../utils/JiraAPI';
import { JIRAIssue } from '../utils/JiraClient';
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

  const blockers: JIRAIssue[] = [];
  const octokit = getOctokit(token);

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

    if (!blockerIssue || blockerIssue.key === mainIssue.key) {
      continue;
    }

    if (blockerIssue.fields.status.name === 'Released') {
      break;
    }

    info(`Found blocker issue: "${blockerIssue.key}"`);
    blockers.push(blockerIssue);
  }

  if (!blockers.length) {
    info('Issue is not blocked');
    return;
  }

  for (const blocker of blockers) {
    info(`Linking blocker: "${blocker.key}"`);
    await linkReleaseBlocker(mainIssue, blocker);
  }

  info('Successfully linked');
}

async function linkReleaseBlocker(
  mainIssue: JIRAIssue,
  blockerIssue: JIRAIssue,
) {
  const jira = createClient();

  await jira.issueLink({
    inwardIssue: blockerIssue.key,
    type: 'Blocks',
    outwardIssue: mainIssue.key,
  });

  await jira.addComment(
    mainIssue.key,
    `SuperdispatchActions: Release is blocked by ${blockerIssue.key}`,
  );
}

main().catch(setFailed);
