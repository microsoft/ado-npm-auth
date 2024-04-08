# node-azureauth

This package wraps the https://github.com/AzureAD/microsoft-authentication-cli with a node.js exec wrapper.

That way the `azureauth` CLI can be downloaded automatically, and therefore scoped to the `./node_modules/.bin` allowing for multiple versions of the AzureAuth CLI
to exist on one machine at once.

## Usage

Install the package wiwth

```bash
> npm i azureauth
```

Use the `azureauth` CLI by calling it from NPM scripts.

```json
"scripts": {
  "authcli": "azureauth --version"
}
```

```bash
> npm run authcli
```

Use it as a node module by importing azureauth.

```js
import { adoPat } from "azureauth";

const pat = await adoPat({
  displayName: "test",
  organization: "test",
  promptHint: "test",
  scope: ["test"],
});
```
