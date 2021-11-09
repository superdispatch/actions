import { getInput, info, setFailed, setOutput } from '@actions/core';
import { context, getOctokit } from '@actions/github';
import { findIssueKey } from '../utils/JiraIssue';

const token = getInput('token', { required: true });
const jiraNamespace = getInput('jira-namespace', { required: true });

const HEAD_REF = process.env.GITHUB_HEAD_REF;
const PR_NUMBER = context.payload.pull_request?.number;

async function main() {
  if (!PR_NUMBER || !HEAD_REF) {
    info('Skipping... This action runs in PR only');
    return;
  }

  const octokit = getOctokit(token);
  const issueKey = await findIssueKey(HEAD_REF);

  if (!issueKey) {
    info('Skipping... Could not find issue');
    return;
  }

  info(`Found issue: ${issueKey}`);

  const { data: pr } = await octokit.request(
    'GET /repos/{owner}/{repo}/pulls/{pull_number}',
    { ...context.repo, pull_number: PR_NUMBER },
  );

  if (!pr.title.toLowerCase().includes(issueKey.toLowerCase())) {
    info('Updating PR...');
    await octokit.rest.pulls.update({
      pull_number: pr.number,
      owner: context.repo.owner,
      repo: context.repo.repo,
      title: `[${issueKey}] ${pr.title}`,
      body: `${pr.body || ''}

**JIRA card:**

[${issueKey}](https://${jiraNamespace}.atlassian.net/browse/${issueKey})
`,
    });
    info('Updated PR title');
  } else {
    info('Skipping update. PR has already issue number.');
  }

  setOutput('issue', issueKey);
}

main().catch(setFailed);
