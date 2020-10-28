import { getInput, setFailed } from '@actions/core';
import { exec } from '@actions/exec';
import { context } from '@actions/github';
import { sendReport } from '@actions/utils/sendReport';

async function main() {
  const pr = getInput('pr');
  const dir = getInput('dir');
  const alias = getInput('alias') || `preview-${pr}`;
  const token = getInput('token');
  const netlifyToken = getInput('netlify-token');
  const netlifySiteID = getInput('netlify-site-id');

  let deployJSON = '';

  await exec('netlify', ['deploy', '--json', '--dir', dir, '--alias', alias], {
    env: {
      ...process.env,
      NETLIFY_SITE_ID: netlifySiteID,
      NETLIFY_AUTH_TOKEN: netlifyToken,
    },
    listeners: {
      stdout: (data) => {
        deployJSON += data.toString();
      },
    },
  });

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
