# Azure Devops NPM Auth

The `ado-npm-auth` package can automatically use the `azureauth` CLI to fetch tokens and update a user's `.npmrc` file for authenticating to ADO package feeds.

You'll first need an `.npmrc` in your project such as...

```text
registry=https://pkgs.dev.azure.com/org/project/_packaging/feedname/npm/registry/
```

You can run the binary `"ado-npm-auth"` via `yarn ado-npm-auth` or `npm exec ado-npm-auth`.

It will then shell out to the `azureauth` package on [npm](https://www.npmjs.com/package/azureauth), retrieve a token, and update your `~/.npmrc`.

## ado-npm-auth vs vsts-npm-auth

The main difference between the two is how they function, and where they can run. The `vsts-npm-auth` tool is Windows only, and uses MSAL authentication.

`ado-npm-auth` uses the `node-azureauth` library, to wrap the [azureauth-cli](https://github.com/AzureAD/microsoft-authentication-cli), which itself is a cross platform MSAL wrapper.

![alt text](image.png)

Since the `azureauth-cli` is cross-platform, `ado-npm-auth` will also run cross-platform as well.