import { getInput, info, setFailed, setOutput } from '@actions/core';
import { context, getOctokit } from '@actions/github';
import { getEnv } from 'jira/utils/JiraAPI';
import { findIssue } from '../utils/JiraIssue';

const token = getInput('token', { required: true });
const JIRA_BASE_URL = getEnv('JIRA_BASE_URL');

const HEAD_REF = process.env.GITHUB_HEAD_REF;
const PR_NUMBER = context.payload.pull_request?.number;

async function main() {
  if (!PR_NUMBER || !HEAD_REF) {
    info('Skipping... This action runs in PR only');
    return;
  }

  const octokit = getOctokit(token);
  const issue = await findIssue(HEAD_REF);

  if (!issue) {
    info('Skipping... Could not find issue');
    return;
  }

  info(`Found issue: ${issue.key}`);

  const { data: pr } = await octokit.request(
    'GET /repos/{owner}/{repo}/pulls/{pull_number}',
    { ...context.repo, pull_number: PR_NUMBER },
  );

  if (!pr.title.toLowerCase().includes(issue.key.toLowerCase())) {
    info('Updating PR...');
    await octokit.rest.pulls.update({
      pull_number: pr.number,
      owner: context.repo.owner,
      repo: context.repo.repo,
      title: `[${issue.key}] ${pr.title}`,
      body: `${pr.body || ''}

**JIRA card:**

[${issue.key}](${JIRA_BASE_URL}/browse/${issue.key})
`,
    });
    info('Updated PR title');
  } else {
    info('Skipping update. PR has already issue number.');
  }

  setOutput('issue', issue.key);
}

main().catch(setFailed);
