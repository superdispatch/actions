import { getInput, info, setFailed } from '@actions/core';
import { exec } from '@actions/exec';
import { context } from '@actions/github';
import { format } from 'util';
import { sendReport } from 'utils/sendReport';

async function main() {
  const pr = getInput('pr', { required: true });
  const defaultAlias = `preview-${pr}`;
  const dir = getInput('dir', { required: true });
  const alias = getInput('alias') || defaultAlias;
  const token = getInput('token', { required: true });
  const netlifyToken = getInput('netlify-token', { required: true });
  const netlifySiteID = getInput('netlify-site-id', { required: true });
  const label = alias === defaultAlias ? '' : alias;

  let deployJSON = '';

  info(format('Deploying "%s" from "%s"…', alias, dir));

  await exec(
    'netlify',
    [
      'deploy',
      '--json',
      `--dir=${dir}`,
      `--alias=${alias}`,
      `--auth=${netlifyToken}`,
      `--site=${netlifySiteID}`,
    ],
    {
      listeners: {
        stdout: (data) => {
          deployJSON += data.toString();
        },
      },
    },
  );

  const { deploy_url: previewURL } = JSON.parse(deployJSON) as {
    deploy_url: string;
  };
  const content = `Built with commit ${context.sha}\n${previewURL}`;

  await sendReport({
    pr,
    token,
    label,
    content,
    title: 'Preview is ready!',
  });
}

main().catch(setFailed);
