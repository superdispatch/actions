import { getInput, info, setFailed, setOutput } from '@actions/core';
import { context, getOctokit } from '@actions/github';

const token = getInput('token', { required: true });
const ticketPlaceholder = getInput('ticket-placeholder');
const jiraNamespace = getInput('jira-namespace');

const HEAD_REF = process.env.GITHUB_HEAD_REF;
const PR_NUMBER = context.payload.pull_request?.number;

function parseTicket(input: string) {
  const match = /([A-Z]{2,}-\d+)/.exec(input);
  return match?.[1];
}

async function main() {
  if (!PR_NUMBER || !HEAD_REF) {
    info('Skipping... This action runs in PR only');
    return;
  }

  const octokit = getOctokit(token);
  const ticket = parseTicket(HEAD_REF);

  if (!ticket) {
    info('Skipping... Could not find ticket');
    return;
  }

  info(`Found ticket: ${ticket}`);

  const { data: pr } = await octokit.request(
    'GET /repos/{owner}/{repo}/pulls/{pull_number}',
    { ...context.repo, pull_number: PR_NUMBER },
  );

  if (!pr.title.includes(ticket)) {
    info('Updating PR title...');
    await octokit.rest.pulls.update({
      pull_number: pr.number,
      owner: context.repo.owner,
      repo: context.repo.repo,
      title: `${pr.title} [${ticket}]`,
      body: pr.body?.replace(
        ticketPlaceholder,
        `https://${jiraNamespace}.atlassian.net/browse/${ticket}`,
      ),
    });
    info('Updated PR title');
  } else {
    info('Skipping update. PR has already ticket number.');
  }

  setOutput('ticket', ticket);
}

main().catch(setFailed);
