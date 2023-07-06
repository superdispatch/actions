import { getInput, info, setFailed, setOutput } from '@actions/core';
import { context, getOctokit } from '@actions/github';
import { findIssue } from '../utils/JiraIssue';
import { IssueLabelMap } from './github-labels';

const token = getInput('token', { required: true });

const HEAD_REF = process.env.GITHUB_HEAD_REF;
const PR_NUMBER = context.payload.pull_request?.number;

async function main() {
  if (!PR_NUMBER || !HEAD_REF) {
    info('Skipping... This action runs in PR only');
    return;
  }

  const octokit = getOctokit(token);
  const { data: pr } = await octokit.request(
    'GET /repos/{owner}/{repo}/pulls/{pull_number}',
    { ...context.repo, pull_number: PR_NUMBER },
  );

  const issue = (await findIssue(HEAD_REF)) || (await findIssue(pr.title));

  if (!issue) {
    info('Skipping... Could not find issue');
    return;
  }

  info(`Found issue: ${issue.key}`);

  const projectLabel = issue.fields.project.key;
  const { data: labels } = await octokit.request(
    'GET /repos/{owner}/{repo}/labels',
    context.repo,
  );
  const hasRepLabel = labels.find((x) => x.name === projectLabel);

  if (!hasRepLabel) {
    await octokit.request('POST /repos/{owner}/{repo}/labels', {
      ...context.repo,
      name: projectLabel,
      description: 'Project label',
      color: 'f29513',
    });
  }

  const issueTypeName = issue.fields.issuetype.name;
  const issueLabel = IssueLabelMap.get(issueTypeName);
  let issueLabelToAdd = undefined;
  if (issueLabel !== undefined) {
    const hasIssueTypeLabelExists = labels.find(
      (x) => x.name === issueLabel.name,
    );
    if (!hasIssueTypeLabelExists) {
      await octokit.request('POST /repos/{owner}/{repo}/labels', {
        ...context.repo,
        name: issueLabel.name,
        description: issueLabel.description,
        color: issueLabel.color,
      });
    }
    const hasIssueTypeLabelExistsInPR = pr.labels.find(
      (x) => x.name === issueLabel.name,
    );
    if (!hasIssueTypeLabelExistsInPR) {
      issueLabelToAdd = issueLabel.name;
    }
  }

  const hasPRLabel = pr.labels.find((x) => x.name === projectLabel);

  if (!hasPRLabel) {
    let labelsToAdd = [projectLabel];
    if (issueLabelToAdd !== undefined) {
      labelsToAdd.push(issueLabelToAdd);
    }
    info(`Adding label "${projectLabel}"`);
    await octokit.request(
      'POST /repos/{owner}/{repo}/issues/{issue_number}/labels',
      {
        ...context.repo,
        issue_number: pr.number,
        labels: labelsToAdd,
      },
    );
    info('Added label');
  } else {
    info('Skipping update. PR has already label.');
  }

  setOutput('issue', issue.key);
  setOutput('label', projectLabel);
}

main().catch(setFailed);
