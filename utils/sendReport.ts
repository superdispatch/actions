import { info } from '@actions/core';
import { context, getOctokit } from '@actions/github';

const GITHUB_ACTIONS_BOT_LOGIN = 'github-actions[bot]';

interface SendReportOptions {
  pr: string;
  token: string;
  label: string;
  title: string;
  content: string;
}

export async function sendReport({
  pr,
  token,
  label,
  title,
  content,
}: SendReportOptions): Promise<void> {
  const octokit = getOctokit(token);
  const reportTitle = `### ${!label ? title : `${title} (${label})`}\n`;

  let previousCommentID: number | undefined = undefined;

  info('Looking for the previous report…');

  for await (const { data: comments } of octokit.paginate.iterator(
    'GET /repos/:owner/:repo/issues/:issue_number/comments',
    {
      ...context.repo,
      per_page: 100,
      issue_number: Number(pr),
    },
  )) {
    for (const {
      id,
      body,
      user: { login },
    } of comments) {
      if (login === GITHUB_ACTIONS_BOT_LOGIN && body.startsWith(reportTitle)) {
        if (previousCommentID == null) {
          info(`Found previous report with ID "${id}"`);

          previousCommentID = id;

          break;
        }
      }
    }
  }

  const body = reportTitle + content;

  if (previousCommentID != null) {
    info(`Updating previous report with ID "${previousCommentID}"…`);

    await octokit.request(
      'PATCH /repos/:owner/:repo/issues/comments/:comment_id',
      { ...context.repo, body, comment_id: previousCommentID },
    );
  } else {
    info('Sending new report…');

    await octokit.request(
      'POST /repos/:owner/:repo/issues/:issue_number/comments',
      { ...context.repo, body, issue_number: Number(pr) },
    );
  }
}
