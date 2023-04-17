import { getInput, info, setFailed } from '@actions/core';
import { context, getOctokit } from '@actions/github';
import { components } from '@octokit/openapi-types';
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

  const jira = createClient();
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

  const blockers = await findBlockersFromCommits(
    mainIssue,
    commits.slice(0, 10),
  );

  if (!blockers.length) {
    info('Issue is not blocked');
    return;
  }

  for (const blocker of blockers) {
    info(`Linking blocker: "${blocker.key}"`);

    await jira.issueLink({
      inwardIssue: blocker.key,
      type: 'Blocks',
      outwardIssue: mainIssue.key,
    });
  }

  const { comments } = await jira.getComments(mainIssue.key);
  const hasComment = comments.find(
    (c) =>
      c.body.content[0].content[0].text ===
      'SuperdispatchActions: Release is blocked by following card(s): ',
  );

  if (!hasComment) {
    await jira.addComment(
      mainIssue.key,
      `SuperdispatchActions: Release is blocked by following card(s): 
${blockers.map((x) => x.key).join('\n')}`,
    );
  }

  info('Successfully linked');
}

async function findBlockersFromCommits(
  targetIssue: JIRAIssue,
  commits: Array<components['schemas']['commit']>,
): Promise<JIRAIssue[]> {
  const blockers: JIRAIssue[] = [];

  for (const item of commits) {
    const blockerIssue = await findIssue(item.commit.message);

    if (!blockerIssue || blockerIssue.key === targetIssue.key) {
      continue;
    }

    if (blockerIssue.fields.status.name === 'Released') {
      break;
    }

    info(`Found blocker issue: "${blockerIssue.key}"`);
    blockers.push(blockerIssue);
  }

  return blockers;
}

main().catch(setFailed);
