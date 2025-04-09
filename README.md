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
      - uses: superdispatch/actions/build-size/report@v1.5.0
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
      - uses: superdispatch/actions/deploy-preview@v1.5.0
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
      - uses: superdispatch/actions/prune-artifacts@v1.5.0
        with:
          skip-recent: 5
          pattern: '^e2e-'
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
      - uses: superdispatch/actions/update-snapshots@v1.5.0
        with:
          command: yarn test
          update-command: yarn test -u
```

### PR limit

Limit PRs per user [see more details](pr-limit/README.md)

## npm/install

#### Features:

- Install packages using `npm`, `yarn` or `pnpm`
- Caches whole `node_modules` directory
- Skips installation step when lockfile cache is hit
- Automatically appends OS and Node version to the `cache-key`

#### Options:

- `working-directory` – the default working directory
- `cache-key` – an explicit key for restoring and saving the cache

#### Usage:

```yaml
jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest]
    steps:
      - uses: actions/checkout@v4
      - uses: superdispatch/actions/npm/install@v2
      - run: npm test
```

Passing `cache-key`

```yaml
jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        node: [14, 16, 18]
        os: [ubuntu-latest, windows-latest]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
      - uses: superdispatch/actions/npm/install@v2
        with:
          cache-key: ${{ github.sha }}-
      - run: npm test
```

## prepare-node-repo

#### Features:

- Disables `autocrlf` in `git config`
- Checks out repository
- Downloads required Node version (see `node-version` option)
- Installs packages (see [superdispatch/actions/npm/install](https://github.com/superdispatch/actions#npminstall))

#### Options:

- `working-directory` – the default working directory
- `node-version` – Node version specifier
- `cache-key` – an explicit key for restoring and saving the cache

#### Usage:

```yaml
jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        node: [14, 16, 18]
        os: [ubuntu-latest, windows-latest]
    steps:
      - uses: superdispatch/actions/setup-node-repo@v4
        with:
          node-version: ${{ matrix.node }}
      - run: npm test
```

Passing `cache-key`

```yaml
jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        node: [14, 16, 18]
        os: [ubuntu-latest, windows-latest]
    steps:
      - uses: superdispatch/actions/setup-node-repo@v4
        with:
          cache-key: ${{ github.sha }}-
          node-version: ${{ matrix.node }}
      - run: npm test
```
