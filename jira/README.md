# Jira Actions

Collection of reusable GitHub actions related to Jira

### Add Project Label

Adds JIRA project key as a PR/Issue label

##### Usage

```yml
on:
  pull_request:
jobs:
  update-pr:
    runs-on: ubuntu-latest
    steps:
      - uses: superdispatch/actions/jira/add-project-label@v1.9
        env:
          JIRA_BASE_URL: ${{ secrets.JIRA_BASE_URL }}
          JIRA_USER_EMAIL: ${{ secrets.JIRA_USER_EMAIL }}
          JIRA_API_TOKEN: ${{ secrets.JIRA_API_TOKEN }}
```

### PR limit

Limit PRs per user

##### Inputs

- `token` - github token, uses `${{ github.token }}` as default
- `limit` - number, maximum number of pull requests user can create

##### Usage

```yml
on:
  pull_request:
jobs:
  pr-limit:
    runs-on: ubuntu-latest
    steps:
      - uses: superdispatch/actions/pr-limit@v1.5.0
        with:
          limit: 2
```

### Move Issue based on reviews

Moves Issue to "Code Review Rejected" on "Changes Requested"

Moves Issue to "Ready for QA" if:

- mergable
- (optionally) if approved by Senior Devs

##### Inputs

- `token` - github token, uses `${{ github.token }}` as default
- `seniors` - List of Senior Devs
- `projects` - List of jira projects where action should work

##### Usage

```yml
on:
  pull_request_review:
    types:
      - submitted
      - edited
      - dismissed
jobs:
  jira-pr-review:
    runs-on: ubuntu-latest
    steps:
      - uses: superdispatch/actions/jira/pr-review@v1.0
        env:
          JIRA_BASE_URL: ${{ secrets.JIRA_BASE_URL }}
          JIRA_USER_EMAIL: ${{ secrets.JIRA_USER_EMAIL }}
          JIRA_API_TOKEN: ${{ secrets.JIRA_API_TOKEN }}
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          seniors: 'senior1,senior2,senior3'
          projects: 'CAR,MOBILE,IN'
```
