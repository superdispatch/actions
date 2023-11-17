import { getInput, setFailed } from '@actions/core';
import archiver from 'archiver';
import fs from 'fs';
import { createClient } from '../utils/JiraAPI';

const path = getInput('path', { required: true });
const issue = getInput('issue', { required: true });
const filename = getInput('filename');

main().catch(setFailed);

async function main() {
  const jira = createClient();
  const jiraIssue = await jira.getIssue(issue);

  console.log('JIRA Issue:', jiraIssue);

  const destination = filename;
  const destinationStream = fs.createWriteStream(destination);

  const archive = archiver('zip');
  archive.on('error', (err) => {
    console.error('Error while zipping', err);
  });

  archive.on('end', () => {
    console.log('Archive', archive);

    const readStream = fs.createReadStream(destination);
    void jira.addAttachmentOnIssue(jiraIssue.id, readStream);
  });

  archive.pipe(destinationStream);
  archive.directory(path, destination);
  void archive.finalize();
}
