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
