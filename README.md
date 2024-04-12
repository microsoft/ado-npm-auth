# ado-npm-auth repository

This monorepo contains packages for helping authenticate against the Azure DevOps NPM Artifacts feed.

## Packages

Below are the packages being published from this repo.

### ado-npm-auth

The `ado-npm-auth` package can automatically use the `azureauth` CLI to fetch tokens and update a user's `.npmrc` file for authenticating to ADO package feeds.

View the [README.md](packages/ado-npm-auth/README.md) for more.

### node-azureauth

This package wraps the https://github.com/AzureAD/microsoft-authentication-cli with a node.js exec wrapper.

View the [README.md](packages/node-azureauth/README.md) for more.

## Contributing

Make sure to have [pnpm](https://pnpm.io/) installed.

Then you can install the repo's dependencies with...

```bash
pnpm install
```

And build the packages with...

```bash
> pnpm exec lage build
```
