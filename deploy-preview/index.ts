import { getInput, info, setFailed } from '@actions/core';
import { context } from '@actions/github';
import { sendReport } from '@actions/utils/sendReport';
import NetlifyAPI from 'netlify';
import { format } from 'util';

async function main() {
  const pr = getInput('pr');
  const dir = getInput('dir');
  const alias = getInput('alias');
  const token = getInput('token');
  const netlifyToken = getInput('netlify-token');
  const netlifySiteID = getInput('netlify-site-id');

  const netlify = new NetlifyAPI(netlifyToken);

  const {
    deploy: { deploy_url, deploy_ssl_url },
  } = await netlify.deploy(netlifySiteID, dir, {
    branch: alias,
    statusCb: ({ msg, phase }) => {
      info(format('%s %s', phase === 'start' ? '-' : '✔', msg));
    },
  });

  const previewURL = deploy_ssl_url || deploy_url;
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
