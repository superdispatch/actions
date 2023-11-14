import { getInput, setFailed } from '@actions/core';
import { createClient } from '../utils/JiraAPI';

const title = getInput('title', { required: true });
const url = getInput('url', { required: true });
const issue = getInput('issue', { required: true });

main().catch(setFailed);

async function main() {
  const jira = createClient();

  const remoteLinks = await jira.getRemoteLinks(issue);
  const remoteLink = remoteLinks.find((link) => link.object.title === title);

  if (remoteLink) {
    console.log('REMOTE LINK:', remoteLink);
    await jira.deleteRemoteLink(issue, title);
  }

  await jira.createRemoteLink(issue, {
    object: { title, url },
  });
}
