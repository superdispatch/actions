import { debug, getInput, info, setFailed } from '@actions/core';
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

  const commitMessage = commits[0]?.commit.message;

  if (!commitMessage) {
    info('Skipping... Could not find commit message');
    return;
  }

  const mainIssue = await findIssue(commitMessage);

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

  const remoteLinks = await jira.getRemoteLinks(mainIssue.key);
  const existingBlockers = new Set(
    remoteLinks
      .filter(
        (x) =>
          x.object.title.includes('Blocked by ') || // for backward compatibility
          x.object.title.includes('Release Blocked by '),
      )
      .map(
        (x) =>
          x.object.title
            .replace('Release Blocked by ', '')
            .replace('Blocked by ', ''), // for backward compatibility
      ),
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
        title: `Release Blocked by ${blocker.key}`,
        url: `https://superdispatch.atlassian.net/browse/${blocker.key}`,
      },
    });
  }

  info('Successfully linked');
}

async function findBlockersFromCommits(
  targetIssue: JIRAIssue,
  commits: Array<components['schemas']['commit']>,
): Promise<JIRAIssue[]> {
  const blockers: JIRAIssue[] = [];

  for (const item of commits) {
    debug(`Checking commit "${item.commit.message}"`);

    const blockerIssue = await findIssue(item.commit.message);

    if (!blockerIssue) {
      debug('No JIRA issue found for given commit');
      continue;
    }

    debug(`Found issue key "${blockerIssue.key}" for given commit`);

    if (blockerIssue.key === targetIssue.key) {
      debug('Skipping same issue with target issue');
      continue;
    }

    if (blockerIssue.fields.status.name === 'Released') {
      debug('Skipping released jira issue');
      break;
    }

    info(`Found blocker issue: "${blockerIssue.key}"`);
    blockers.push(blockerIssue);
  }

  return blockers;
}

main().catch(setFailed);
