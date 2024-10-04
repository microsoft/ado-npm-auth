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

![screenshot of tool running](https://github.com/microsoft/ado-npm-auth/raw/main/packages/ado-npm-auth/static/image.png)

Since the `azureauth-cli` is cross-platform, `ado-npm-auth` will also run cross-platform as well!

One of the easiest ways to use the tool is to add it to your `"preinstall"` script in your repo like this...

```json
"scripts": {
  "preinstall": "npm exec ado-npm-auth"
},
```

It will then perform a quick "pre-flight" check to assess if the token is valid, and generate a new one if it has expired.

![screenshot of tool running via preinstall](https://github.com/microsoft/ado-npm-auth/raw/main/packages/ado-npm-auth/static/preinstall.png)

### Beware the chicken and egg problem

You may need to set the registry to the public NPM feed when running `npm exec` or `npx`.

There are 2 options to address this case:

### 1: Explictly pass the config file.
You can hop one directory up, or run it from an arbitrary path and pass the configuration.
```cmd
pushd ..
npx ado-npm-auth -c <myrepo>\.npmrc
popd
```

### 2: configure registry explicilty
If that's the case, set the environment variable `npm_config_registry=https://registry.npmjs.org`.

That will ensure that `npx` or `npm exec` grabs from the public NPM feed, bypassing the soon-to-be authenticated ADO feed.

```json
"scripts": {
  "preinstall": "npm_config_registry=https://registry.npmjs.org npm exec ado-npm-auth"
},
```

### User Config File Location

By default ado-npm-auth tries locate the user config file for storing registry auth tokens from the system home directory, which is set to `$HOME` and `$USERPROFILE` environment variables for MacOS/Linux and Windows respectively. However, if your project is not located under your home directory, you will still experience unauthorized errors from the registry.

To customize where ado-npm-auth should locate your user config file, you have two options.

### 1: Set `ADO_NPM_AUTH_USER_CONFIG` environment variable

Set the `ADO_NPM_AUTH_USER_CONFIG` environment variable to the directory where your user config file is located, i.e. `C:\projects`

### 2. Pass `--userConfigFile` option

Pass `--userConfigFile` option to the CLI pointing to the user config file, i.e. `C:\projects\.yarnrc.yml`