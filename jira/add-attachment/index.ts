import { getInput, setFailed } from '@actions/core';
import fs from 'fs';
import { basename } from 'path';
import { createClient } from '../utils/JiraAPI';

const path = getInput('path', { required: true });
const issue = getInput('issue', { required: true });

main().catch(setFailed);

async function main() {
  const jira = createClient();
  const jiraIssue = await jira.getIssue(issue);

  const previousAttachment = jiraIssue.fields.attachment.find(
    (attachment) => attachment.filename === basename(path),
  );

  if (previousAttachment) {
    await jira.deleteAttachment(previousAttachment.id);
  }

  const readStream = fs.createReadStream(path);
  void jira.addAttachmentOnIssue(jiraIssue.id, readStream);
}
