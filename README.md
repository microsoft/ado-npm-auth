# ado-npm-auth repository

This monorepo contains packages for helping authenticate against the Azure DevOps NPM Artifacts feed.

## ado-npm-auth

The `ado-npm-auth` package can automatically use the `azureauth` CLI to fetch tokens and update a user's `.npmrc` file for authenticating to ADO package feeds.

You'll first need an `.npmrc` in your project such as...

```text
registry=https://pkgs.dev.azure.com/org/project/_packaging/feedname/npm/registry/
```

You can run the binary `"ado-npm-auth"`.

It will then shell out to the `azureauth` package on [npm](https://www.npmjs.com/package/azureauth), retrieve a token, and update your `~/.npmrc`.
