# actions

Collection of reusable github actions

### Build Size

Reports web app build size changes between pull request and main branches.

#### Build Size Cache

##### Inputs

- `dir` - path to the build folder
- `sha` - commit sha, uses `${{ github.sha }}` as default
- `label` - custom label to distinguish multiple builds, uses `"default"` as default

##### Usage

```yml
on:
  push:
    branches:
      - main
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: yarn install
      - run: yarn build
      - uses: superdispatch/actions/build-size/cache@v1
        with:
          dir: build
```

#### Build Size Report

##### Inputs

- `dir` - path to the build folder
- `sha` - commit sha, uses `${{ github.event.pull_request.base.sha }}` as default
- `label` - custom label to distinguish multiple builds, uses `"default"` as default
- `pr` - pull request number, uses `${{ github.event.number }}` as default
- `token` - github token, uses `${{ github.token }}` as default

##### Usage

```yml
on:
  pull_request:
    branches:
      - '**'
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: yarn install
      - run: yarn build
      - uses: superdispatch/actions/build-size/report@v1
        with:
          dir: build
```

### Deploy Preview

Deploys build preview to Netlify

##### Inputs

- `dir` - folder to deploy
- `pr` - pull request number, uses `${{ github.event.number }}` as default
- `alias` - alias for deployment, uses `preview-${pr}` as default
- `token` - github token, uses `${{ github.token }}` as default
- `netlify-token` - netlify token
- `netlify-site-id` - netlify site to deploy to

##### Usage

```yml
on:
  pull_request:
    branches:
      - '**'
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: yarn install
      - run: yarn build
      - uses: superdispatch/actions/deploy-preview@v1
        with:
          dir: build
          netlify-token: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          netlify-site-id: ${{ secrets.NETLIFY_SITE_ID }}
```

### Prune Artifacts

Removes workflow artifacts

##### Inputs

- `token` - github token, uses `${{ github.token }}` as default
- `pattern` - reg-exp pattern string to match an artifact name, uses `".*"` as default
- `skip-recent` - keep specified number of artifacts even if they are matching provided pattern

##### Usage

```yml
on:
  schedule:
    - cron: '0 1 * * *'
jobs:
  prune-artifacts:
    runs-on: ubuntu-latest
    steps:
      - uses: superdispatch/actions/prune-artifacts@v1
        with:
          skip-recent: 5
          pattern: '^e2e-'
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
      - uses: superdispatch/actions/pr-limit@v1
        with:
          limit: 2
```


### Update snapshots

Updates changed files if changes are detected.

##### Inputs

- `dry-run` - string, dry run commit and push commands
- `command` - string, a command that is run for checking
- `update-command` - string, a command that is run if main command fails
- `message` - string, commit message when there is changes found. Defaults "chore: Updated snapshots changes."
- `token` - github token, uses `${{ github.token }}` as default

##### Usage

```yml
name: Tests

on:
  pull_request:
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: superdispatch/update-snapshots
        with:
          command: yarn test
          update-command: yarn test -u
```

