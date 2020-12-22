import { getInput, info, setFailed } from '@actions/core';
import { context, getOctokit } from '@actions/github';
import { format } from 'util';

async function main() {
  const token = getInput('token', { required: true });
  const pattern = getInput('pattern', { required: true });
  const skipRecent = parseInt(getInput('skip-recent'), 10) || 0;

  const octokit = getOctokit(token);
  const matcher = new RegExp(pattern);

  info(
    format(
      'Iterating through the %s/%s…',
      context.repo.owner,
      context.repo.repo,
    ),
  );

  for await (const { data: artifacts } of octokit.paginate.iterator(
    'GET /repos/{owner}/{repo}/actions/artifacts',
    {
      ...context.repo,
      per_page: 50,
    },
  )) {
    if (artifacts.length === 0) {
      info('There are no artifacts left.');

      return;
    }

    info(format('Found %s artifacts…', artifacts.length));

    let skipped = 0;

    for (const { id, name } of artifacts) {
      if (!matcher.exec(name)) {
        info(
          format('Skipping "%s" (not matching pattern "%s")', name, pattern),
        );

        continue;
      }

      if (skipRecent > skipped) {
        skipped += 1;

        info(
          format('Skipping "%s" (belongs to recent "%s")', name, skipRecent),
        );

        continue;
      }

      info(format('Removing "%s" artifact with the id "%s"…', name, id));

      await octokit.request(
        'DELETE /repos/{owner}/{repo}/actions/artifacts/{artifact_id}',
        { ...context.repo, artifact_id: id },
      );
    }
  }
}

main().catch(setFailed);
