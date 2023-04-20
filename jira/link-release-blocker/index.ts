import { getInput, info, setFailed } from '@actions/core';
import { context, getOctokit } from '@actions/github';
import { components } from '@octokit/openapi-types';
import { createClient } from '../utils/JiraAPI';
import { JIRAIssue } from '../utils/JiraClient';
import { findIssue } from '../utils/JiraIssue';

const token = getInput('token', { required: true });

const SHA = process.env.GITHUB_SHA;

async function main() {
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
    await jira.addComment(mainIssue.key, 'Release is not blocked 🎉');

    info('Issue is not blocked');
    return;
  }

  const remoteLinks = await jira.getRemoteLinks(mainIssue.key);
  const existingBlockers = new Set(
    remoteLinks
      .filter((x) => x.object.title.includes('Blocked by '))
      .map((x) => x.object.title.replace('Blocked by ', '')),
  );
  const newBlockers = blockers.filter((x) => !existingBlockers.has(x.key));

  if (!newBlockers.length) {
    info('Release blockers are already added');
    return;
  }

  for (const blocker of newBlockers) {
    info(`Linking blocker: "${blocker.key}"`);

    await jira.createRemoteLink(mainIssue.key, {
      object: {
        title: `Blocked by ${blocker.key}`,
        url: `https://superdispatch.atlassian.net/browse/${blocker.key}`,
      },
    });
  }

  await jira.addComment(
    mainIssue.key,
    `Release is blocked by following card(s): 
${newBlockers.map((x) => x.key).join('\n')}`,
  );

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
