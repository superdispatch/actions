import { createClient } from './JiraAPI';
import { JIRAIssue } from './JiraClient';

const ISSUE_REGEX = /([a-z]{2,}-\d+)/gi;

export function parseIssue(input: string) {
  const match = ISSUE_REGEX.exec(input);
  return match?.[1].toUpperCase();
}

export async function findIssue(input: string): Promise<JIRAIssue | null> {
  const matches = input.match(ISSUE_REGEX);

  if (matches) {
    const jira = createClient();

    for (const match of matches) {
      try {
        return await jira.getIssue(match.toUpperCase());
      } catch (error: unknown) {
        // ignore issue not found error
      }
    }
  }

  return null;
}
