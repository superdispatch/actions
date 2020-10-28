import { getInput, info, setFailed } from '@actions/core';
import { exec } from '@actions/exec';
import { context } from '@actions/github';
import { sendReport } from '@actions/utils/sendReport';
import { format } from 'util';

async function main() {
  const pr = getInput('pr');
  const dir = getInput('dir');
  const alias = getInput('alias') || `preview-${pr}`;
  const token = getInput('token');
  const netlifyToken = getInput('netlify-token', { required: true });
  const netlifySiteID = getInput('netlify-site-id', { required: true });

  let deployJSON = '';

  info(format('Deploying "%sæ from "%s"…', alias, dir));

  await exec(
    'netlify',
    [
      'deploy',
      '--json',
      '--dir',
      dir,
      '--alias',
      alias,
      '--auth',
      netlifyToken,
      '--site',
      netlifySiteID,
    ],
    {
      listeners: {
        stdout: (data) => {
          info(data.toString());

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
    content,
    label: alias,
    title: 'Preview is ready!',
  });
}

main().catch(setFailed);
