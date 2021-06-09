import { getInput, group, setFailed } from '@actions/core';
import { context } from '@actions/github';
import { execJSON } from 'utils/exec';
import { sendReport } from 'utils/sendReport';

const pr = Number(getInput('pr', { required: true }));
const defaultAlias = `preview-${pr}`;
const dir = getInput('dir', { required: true });
const alias = getInput('alias') || defaultAlias;
const token = getInput('token', { required: true });
const netlifyToken = getInput('netlify-token', { required: true });
const netlifySiteID = getInput('netlify-site-id', { required: true });
const label = alias === defaultAlias ? '' : alias;

async function main() {
  const { deploy_url: previewURL } = await group('Deploying to Netlify', () =>
    execJSON<{ deploy_url: string }>('netlify', [
      'deploy',
      '--json',
      `--dir=${dir}`,
      `--alias=${alias}`,
      `--auth=${netlifyToken}`,
      `--site=${netlifySiteID}`,
    ]),
  );

  await group('Sending deployment report', () => {
    const content = `Built with commit ${context.sha}\n${previewURL}`;

    return sendReport({
      pr,
      token,
      label,
      content,
      title: 'Preview is ready!',
    });
  });
}

main().catch(setFailed);
