import { getInput, info, setFailed, warning } from '@actions/core';
import { context, getOctokit } from '@actions/github';
import { RequestError } from '@octokit/request-error';

const token = getInput('token', { required: true });
const pattern = getInput('pattern', { required: true });
const skipRecent = parseInt(getInput('skip-recent'), 10) || 0;

async function main() {
  const octokit = getOctokit(token);
  const matcher = new RegExp(pattern);

  info(
    `Fetching artifacts for the: ${context.repo.owner}/${context.repo.repo}`,
  );

  for await (const { data: artifacts } of octokit.paginate.iterator(
    'GET /repos/{owner}/{repo}/actions/artifacts',
    { ...context.repo, per_page: 50 },
  )) {
    if (artifacts.length === 0) {
      info('There are no artifacts.');
      return;
    }

    info(`Found artifacts: ${artifacts.length}`);

    let skipped = 0;

    for (const { id, name } of artifacts) {
      info(`Checking artifact: ${name}`);

      if (!matcher.exec(name)) {
        info(`Skipping: not matching pattern (/${pattern}/)`);
        continue;
      }

      if (skipRecent > skipped) {
        skipped += 1;
        info(`Skipping: belongs to recent ${skipRecent} artifacts`);
        continue;
      }

      info(`Removing: ${id}`);

      try {
        await octokit.request(
          'DELETE /repos/{owner}/{repo}/actions/artifacts/{artifact_id}',
          { ...context.repo, artifact_id: id },
        );
      } catch (error: unknown) {
        if (error instanceof RequestError && error.status === 404) {
          warning(error);
        } else {
          throw error;
        }
      }
    }
  }
}

main().catch(setFailed);
