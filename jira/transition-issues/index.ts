import { getInput, group, info, setFailed } from '@actions/core';
import { createClient } from '../utils/JiraAPI';
import { parseIssue } from '../utils/JiraIssue';

const changelog = getInput('changelog', { required: true });
const transitionTarget = getInput('transition-target', { required: true });

main().catch(setFailed);

async function main() {
  const jira = createClient();
  const issues = changelog
    .split('\n')
    .map(parseIssue)
    .filter((value): value is string => !!value);

  if (!issues.length) {
    info('Could not find issues');
    return;
  }

  info(`Found ${issues.length} issues.`);

  await group('Transition issues', async () => {
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
        info(
          `Transition called "${transitionTarget}" is not available for "${issue}" issue.`,
        );
      }
    }
  });
}
