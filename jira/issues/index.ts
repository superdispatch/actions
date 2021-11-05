import { getInput, group, info, setFailed } from '@actions/core';
import { createClient } from '../utils/JiraAPI';
import { parseIssue } from '../utils/JiraIssue';

const comment = getInput('comment');
const transitionTarget = getInput('transition');
const issuesInput = getInput('issues', { required: true });

main().catch(setFailed);

async function main() {
  const jira = createClient();
  const issues = parseIssues(issuesInput);

  if (!issues.length) {
    info('Could not find issues. Skipping..');
    return;
  }

  info(`Found ${issues.length} issues.`);

  await group('Transition issues', async () => {
    if (!transitionTarget) {
      info('No transition target specified. Skipping..');
      return;
    }

    for (const issue of issues) {
      const { transitions } = await jira.listTransitions(issue);
      const transition = transitions.find(
        (item) => item.name === transitionTarget,
      );

      if (transition) {
        info(`Transitioning "${issue}" issue to "${transitionTarget}".`);
        await jira.transitionIssue(issue, {
          transition: { id: transition.id },
        });
      } else {
        info(`Cannot transition "${issue}" to "${transitionTarget}".`);
      }
    }
  });

  await group('Comment issues', async () => {
    if (!comment) {
      info('No comment specified. Skipping..');
      return;
    }

    for (const issue of issues) {
      info(`Commenting "${issue}" issue.`);
      await jira.addComment(issue, comment);
    }
  });
}

function parseIssues(input: string): string[] {
  const issues = input
    .split('\n')
    .map(parseIssue)
    .filter((value): value is string => !!value);

  return Array.from(new Set(issues));
}
