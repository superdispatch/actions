import { getInput, info, setFailed, setOutput } from '@actions/core';
import { context, getOctokit } from '@actions/github';
import { parseIssue } from '../utils/JiraIssue';

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
  const issue = parseIssue(HEAD_REF);

  if (!issue) {
    info('Skipping... Could not find issue');
    return;
  }

  info(`Found issue: ${issue}`);

  const { data: pr } = await octokit.request(
    'GET /repos/{owner}/{repo}/pulls/{pull_number}',
    { ...context.repo, pull_number: PR_NUMBER },
  );

  if (!pr.title.includes(issue)) {
    info('Updating PR...');
    await octokit.rest.pulls.update({
      pull_number: pr.number,
      owner: context.repo.owner,
      repo: context.repo.repo,
      title: `[${issue}] ${pr.title}`,
      body: `${pr.body || ''}
      
**JIRA card:**

[issue](https://${jiraNamespace}.atlassian.net/browse/${issue})
`,
    });
    info('Updated PR title');
  } else {
    info('Skipping update. PR has already issue number.');
  }

  setOutput('issue', issue);
}

main().catch(setFailed);
