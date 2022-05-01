import { JiraClient } from './JiraClient';

const JIRA_BASE_URL = getEnv('JIRA_BASE_URL');
const JIRA_USER_EMAIL = getEnv('JIRA_USER_EMAIL');
const JIRA_API_TOKEN = getEnv('JIRA_API_TOKEN');

export function createClient() {
  const { protocol, host } = new URL(JIRA_BASE_URL);
  return new JiraClient({
    host,
    protocol,
    username: JIRA_USER_EMAIL,
    password: JIRA_API_TOKEN,
  });
}

export function getEnv(key: string) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing env variable "${key}"`);
  }
  return value;
}
