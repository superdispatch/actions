import { error, getInput, info, setFailed, setOutput } from '@actions/core';
import { context, getOctokit } from '@actions/github';
import { createClient } from 'jira/utils/JiraAPI';
import { JIRAIssue } from '../utils/JiraClient';
import { findIssue } from '../utils/JiraIssue';

const token = getInput('token', { required: true });
const seniors = getInput('seniors');
const projects = getInput('projects');

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

  // Check if the project filter is defined and if the current issue's project matches the specified filter
  const shouldApplyAction =
    !projects ||
    projects.split(',').some((project) => project === issue.fields.project.key);

  if (!shouldApplyAction) {
    info(
      `Skipping... Issue ${issue.key} does not match the specified project filter`,
    );
    return;
  }

  info(`Found issue: ${issue.key}`);

  const { data: pr } = await octokit.request(
    'GET /repos/{owner}/{repo}/pulls/{pull_number}',
    { ...context.repo, pull_number: PR_NUMBER },
  );

  const { data: pr_reviews } = await octokit.request(
    'GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews',
    { ...context.repo, pull_number: PR_NUMBER },
  );

  let senior_approvals = true;

  // If seniors input is provided, perform the senior_approvals logic
  if (seniors) {
    // Filter the 'CHANGES_REQUESTED' reviews and store their submit times in a Map
    const filteredChangesRequested = pr_reviews
      .filter((review) => review.state === 'CHANGES_REQUESTED')
      .reduce((acc: Map<string, string>, cur) => {
        if (cur.user?.login && cur.submitted_at) {
          acc.set(cur.user.login, cur.submitted_at);
        }
        return acc;
      }, new Map<string, string>());

    pr_reviews.forEach((review) => {
      // Check if the review is 'APPROVED', submitted by the same reviewer, and submitted after the 'CHANGES_REQUESTED' review
      if (
        review.state === 'APPROVED' &&
        review.user?.login &&
        filteredChangesRequested.has(review.user.login) &&
        review.submitted_at &&
        new Date(review.submitted_at) >
          new Date(filteredChangesRequested.get(review.user.login) || '')
      ) {
        // Remove the 'CHANGES_REQUESTED' entry for this user
        filteredChangesRequested.delete(review.user.login);
      }
    });

    // Check if there are any remaining 'CHANGES_REQUESTED' entries
    if (filteredChangesRequested.size > 0) {
      await transitionCard(issue, 'Changes Required in PR');
    } else {
      let states: Map<string, string> = new Map();
      // Iterate through the PR reviews and store the review states in the Map
      for (const x of pr_reviews) {
        if (x.user?.login) {
          states.set(x.user.login, x.state);
        }
      }
      // Check if at least one senior has approved the PR
      // senior_approvals = seniors
      //   .split(',')
      //   .some((senior) => states.get(senior) === 'APPROVED');
    }
  }
  if (pr.mergeable && senior_approvals) {
    await transitionCard(issue, 'Finish Development');
  }

  setOutput('issue', issue.key);
}

async function transitionCard(issue: JIRAIssue, transitionTarget: string) {
  const jira = createClient();
  const { transitions } = await jira.listTransitions(issue.id);
  const transition = transitions.find((item) => item.name === transitionTarget);

  if (transition) {
    info(`Transitioning "${issue.key}" issue to "${transitionTarget}".`);
    await jira.transitionIssue(issue.id, {
      transition: { id: transition.id },
    });
  } else {
    error(`Cannot transition "${issue.key}" to "${transitionTarget}".`);
  }
}

main().catch(setFailed);
