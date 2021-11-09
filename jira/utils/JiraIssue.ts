import { createClient } from './JiraAPI';

const ISSUE_REGEX = /([a-z]{2,}-\d+)/g;

export function parseIssue(input: string) {
  const match = ISSUE_REGEX.exec(input);
  return match?.[1].toUpperCase();
}

export async function findIssueKey(input: string): Promise<string | null> {
  const matches = input.match(ISSUE_REGEX);

  if (matches) {
    const jira = createClient();

    for (const match of matches) {
      try {
        const issue = await jira.getIssue(match);
        return issue.key;
      } catch (error: unknown) {
        // ignore issue not found error
      }
    }
  }

  return null;
}
