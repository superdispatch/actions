import { info } from '@actions/core';
import { context } from '@actions/github';
import { GitHub } from '@actions/github/lib/utils';

export class GithubLabel {
  name: string;
  color: string;
  description: string;

  constructor(name: string, color: string, description: string) {
    this.name = name;
    this.color = color;
    this.description = description;
  }
}

export const IssueLabelMap = new Map([
  [
    'Change Request',
    new GithubLabel('feature', '248213', 'New feature or change request'),
  ],
  [
    'Production Defect',
    new GithubLabel('bugfix', 'd73a4a', "Something isn't working"),
  ],
  ['Maintenance', new GithubLabel('maintenance', 'ffaf1a', 'Maintenance')],
  [
    'Technical Debt',
    new GithubLabel('tech-debt', 'a2eeef', 'New feature or request'),
  ],
  [
    'Sub-task',
    new GithubLabel('feature', '248213', 'New feature or change request'),
  ],
  [
    'Epic',
    new GithubLabel('feature', '248213', 'New feature or change request'),
  ],
]);

export async function createLabelIfNotExists(
  octokit: InstanceType<typeof GitHub>,
  githubLabel: GithubLabel,
) {
  const { data: labels } = await octokit.request(
    'GET /repos/{owner}/{repo}/labels',
    context.repo,
  );

  const hasLabel = labels.find((x) => x.name === githubLabel.name);
  info("{githubLabel.name} label {hasLabel ? '' : 'not'} found");
  if (!hasLabel) {
    info('Creating {githubLabel.name} label...');
    await octokit.request('POST /repos/{owner}/{repo}/labels', {
      ...context.repo,
      name: githubLabel.name,
      description: githubLabel.description,
      color: githubLabel.color,
    });
    info('The label created');
  }
}
