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
