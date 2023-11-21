import { getInput, setFailed } from '@actions/core';
import archiver from 'archiver';
import fs from 'fs';
import { createClient } from '../utils/JiraAPI';

const path = getInput('path', { required: true });
const issue = getInput('issue', { required: true });
const filename = getInput('filename', { required: true });

main().catch(setFailed);

async function main() {
  const jira = createClient();
  const jiraIssue = await jira.getIssue(issue);

  const previousAttachment = jiraIssue.fields.attachment.find(
    (attachment) => attachment.filename === filename,
  );

  if (previousAttachment) {
    await jira.deleteAttachment(previousAttachment.id);
  }

  const destinationStream = fs.createWriteStream(filename);

  const archive = archiver('zip');
  archive.on('error', (err) => {
    console.error('Error while zipping', err);
  });

  archive.on('end', () => {
    const readStream = fs.createReadStream(filename);
    void jira.addAttachmentOnIssue(jiraIssue.id, readStream);
  });

  archive.pipe(destinationStream);
  archive.directory(path, filename);
  void archive.finalize();
}
