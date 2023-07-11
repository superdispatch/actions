import { getInput, info, setFailed, setOutput } from '@actions/core';
import { context, getOctokit } from '@actions/github';
import { findIssue } from '../utils/JiraIssue';
import {
  createLabelIfNotExists,
  GithubLabel,
  IssueLabelMap,
} from './github-labels';

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

  const projectLabel = new GithubLabel(
    issue.fields.project.key,
    'f29513',
    'Project label',
  );
  await createLabelIfNotExists(octokit, projectLabel);

  const issueTypeName = issue.fields.issuetype.name;
  const issueLabel = IssueLabelMap.get(issueTypeName);
  if (issueLabel !== undefined) {
    await createLabelIfNotExists(octokit, issueLabel);
  }

  const labelsToAdd = ([projectLabel, issueLabel] as GithubLabel[])
    .reduce<GithubLabel[]>((items, label) => {
      const isLabelExists = pr.labels.find((x) => x.name === label.name);
      if (!isLabelExists) {
        items.push(label);
      }
      return items;
    }, [])
    .map((githubLabel) => githubLabel.name);

  if (labelsToAdd.length !== 0) {
    info(`Adding label "${labelsToAdd.toString()}"`);
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
