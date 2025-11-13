# yarn-plugin-ado-auth

A Yarn Berry (v4.x+) plugin that provides seamless, on-demand authentication for Azure DevOps (ADO) npm package feeds. This plugin automatically authenticates to private ADO registries when Yarn needs to download packages, eliminating the need for manual token management.

## What This Plugin Does

The `yarn-plugin-ado-auth` plugin integrates directly into Yarn's package resolution process by implementing the `getNpmAuthenticationHeader` hook. When Yarn attempts to fetch packages from an Azure DevOps npm registry, the plugin:

1. **Detects ADO registry requests** - Identifies when Yarn is connecting to an ADO feed
2. **Checks for existing tokens** - First looks for authentication tokens in your `.yarnrc.yml` configuration
3. **Automatically authenticates** - If no valid token exists, uses the `azureauth` CLI tool to obtain a fresh token via MSAL authentication
4. **Caches tokens** - Stores tokens in memory for the duration of the Yarn process to avoid redundant authentication
5. **Injects authentication** - Seamlessly provides the Bearer token to Yarn for registry requests

This approach provides a frictionless developer experience - you never need to manually run authentication commands or manage token expiration.

## Installation

Add the plugin to your Yarn project:

```bash
yarn plugin import https://github.com/microsoft/ado-npm-auth/releases/download/latest/yarn-plugin-ado-auth.cjs
```

Or install from a local build:

```bash
yarn plugin import /path/to/yarn-plugin-ado-auth/dist/yarn-plugin-ado-auth.cjs
```

## Configuration

The plugin supports two configuration options in your `.yarnrc.yml` file:

### `adoNpmAuthFeedPrefix`

**Type:** `string`  
**Default:** `"https://pkgs.dev.azure.com/"`

The URL prefix used to identify Azure DevOps npm feeds. The plugin only attempts authentication for registries that start with this prefix.

```yaml
adoNpmAuthFeedPrefix: "https://pkgs.dev.azure.com/"
```

### `adoNpmAuthToolPath`

**Type:** `string` (optional)  
**Default:** `null` (uses `azureauth` from PATH)

The absolute path to the `azureauth` CLI tool. If not specified, the plugin will search for `azureauth` in your system PATH. Note that yarn has a pattern where environment variables starting with YARN\_ will override .yarnrc.yml settings. So setting YARN_ADO_NPM_AUTH_TOOL_PATH can be used to override this value on the fly.

```yaml
adoNpmAuthToolPath: "/usr/local/bin/azureauth"
```

## The azureauth Command Line Tool

This plugin depends on the [azureauth CLI](https://github.com/AzureAD/microsoft-authentication-cli), a cross-platform MSAL (Microsoft Authentication Library) wrapper that handles the OAuth flow with Azure Active Directory.

### Installation

The `azureauth` tool is distributed via the [`node-azureauth`](https://www.npmjs.com/package/azureauth) npm package, which automatically downloads the appropriate binary for your platform:

```bash
npm install -g azureauth
# or
yarn global add azureauth
```

You can also install it as a dev dependency in your project:

```bash
yarn add -D azureauth
```

NOTE: To have this tool baked into your yarn workflow this will need to be installed via another method besides yarn install in your repository, as the tool will not be available for the first download in a fresh repo otherwise.

### How It Works

When authentication is needed, the plugin executes the `azureauth` CLI with parameters specific to your ADO organization and feed. The tool:

1. Opens an interactive authentication prompt (or uses cached credentials)
2. Obtains a Personal Access Token (PAT) from Azure DevOps
3. Returns the token to the plugin
4. The plugin uses this token for subsequent npm registry requests

The `azureauth` tool supports multiple platforms (Windows, macOS, Linux) and architectures (x64, ARM64).

## Using npmAuthToken in .yarnrc.yml

The plugin respects Yarn's standard npm authentication configuration. You can pre-configure tokens in your `.yarnrc.yml` file, and the plugin will use them instead of triggering authentication.

### Basic Token Configuration

```yaml
npmScopes:
  myorg:
    npmRegistryServer: "https://pkgs.dev.azure.com/myorg/myproject/_packaging/myfeed/npm/registry/"
    npmAuthToken: "your-personal-access-token-here"
```

### Environment Variable Pattern

Yarn supports environment variable substitution in configuration files. This is the recommended approach for secure token management:

```yaml
npmScopes:
  myorg:
    npmRegistryServer: "https://pkgs.dev.azure.com/myorg/myproject/_packaging/myfeed/npm/registry/"
    npmAuthToken: "${ADO_NPM_TOKEN}"
```

Then set the environment variable:

```bash
export ADO_NPM_TOKEN="your-token-here"
yarn install
```

### Environment Variables with Fallbacks

Yarn allows you to specify fallback values when an environment variable is not set. This pattern enables the plugin to handle authentication automatically when running locally, while still respecting tokens in CI/CD environments:

```yaml
npmScopes:
  myorg:
    npmRegistryServer: "https://pkgs.dev.azure.com/myorg/myproject/_packaging/myfeed/npm/registry/"
    npmAuthToken: "${ADO_NPM_TOKEN-}" # Empty fallback - plugin will authenticate if not set
```

The `${VAR_NAME-default}` syntax means:

- If `ADO_NPM_TOKEN` is set, use its value
- If `ADO_NPM_TOKEN` is not set or empty, use the default (empty string in this case)
- When the token is empty/missing, the plugin detects this and triggers `azureauth` authentication

**CI/CD Usage:**

```yaml
# In CI/CD pipeline (GitHub Actions, Azure Pipelines, etc.)
env:
  ADO_NPM_TOKEN: ${{ secrets.ADO_PAT }}

steps:
  - run: yarn install # Uses the provided token
```

**Local Development:**

```bash
# No environment variable set
yarn install  # Plugin automatically authenticates via azureauth
```

### Per-Registry Configuration

You can configure authentication for multiple ADO feeds:

```yaml
npmScopes:
  org1:
    npmRegistryServer: "https://pkgs.dev.azure.com/org1/project1/_packaging/feed1/npm/registry/"
    npmAuthToken: "${ORG1_TOKEN-}"

  org2:
    npmRegistryServer: "https://pkgs.dev.azure.com/org2/project2/_packaging/feed2/npm/registry/"
    npmAuthToken: "${ORG2_TOKEN-}"
```

## Complete Configuration Example

Here's a comprehensive `.yarnrc.yml` example:

```yaml
# Yarn version
yarnPath: .yarn/releases/yarn-4.1.0.cjs

# Plugin configuration
plugins:
  - path: .yarn/plugins/@yarnpkg/plugin-ado-auth.cjs
    spec: "https://github.com/microsoft/ado-npm-auth/releases/download/latest/yarn-plugin-ado-auth.cjs"

# ADO Auth Plugin Settings
adoNpmAuthFeedPrefix: "https://pkgs.dev.azure.com/"
adoNpmAuthToolPath: null # Use azureauth from PATH

# Registry Configuration
npmScopes:
  mycompany:
    npmRegistryServer: "https://pkgs.dev.azure.com/mycompany/myproject/_packaging/internal/npm/registry/"
    npmAuthToken: "${ADO_NPM_TOKEN-}" # Fallback to plugin auth if not set

# Global registry (if all packages come from ADO)
npmRegistryServer: "https://pkgs.dev.azure.com/mycompany/myproject/_packaging/internal/npm/registry/"
npmAuthToken: "${ADO_NPM_TOKEN-}"
```

## Authentication Flow

Here's what happens when you run `yarn install`:

1. **Yarn requests package metadata** from the configured registry
2. **Plugin intercepts the request** via the `getNpmAuthenticationHeader` hook
3. **Plugin checks if the registry URL starts with** `adoNpmAuthFeedPrefix`
4. **Plugin looks for a token** in the configuration:
   - If `npmAuthToken` is set and non-empty → use it
   - If `npmAuthToken` is missing/empty → proceed to step 5
5. **Plugin invokes azureauth CLI**:
   - Extracts the organization from the feed URL
   - Executes `azureauth` with appropriate parameters
   - Receives a Personal Access Token (PAT)
6. **Plugin caches the token** in memory for subsequent requests
7. **Plugin returns authentication header** `Bearer <token>` to Yarn
8. **Yarn completes the package installation** using the authenticated connection

## Troubleshooting

### Plugin not authenticating

- Verify the registry URL starts with your configured `adoNpmAuthFeedPrefix`
- Check that `azureauth` is installed and accessible in your PATH
- Set `adoNpmAuthToolPath` explicitly if `azureauth` is in a non-standard location

### Authentication fails in CI/CD

- Ensure the `ADO_NPM_TOKEN` (or your chosen environment variable) is set in your pipeline
- Verify the token has appropriate permissions for the ADO feed
- Check that the token hasn't expired (ADO PATs have configurable expiration dates)

### Token caching issues

- The plugin caches tokens per registry URL for the duration of a single Yarn command
- Each `yarn install` or `yarn add` will re-check token validity
- Clear your Yarn cache if you suspect stale authentication: `yarn cache clean`

## Comparison with ado-npm-auth CLI

This plugin provides similar functionality to the [`ado-npm-auth`](../ado-npm-auth) CLI tool but with key differences:

| Feature                    | yarn-plugin-ado-auth | ado-npm-auth CLI               |
| -------------------------- | -------------------- | ------------------------------ |
| **Authentication Trigger** | On-demand, automatic | Manual or preinstall script    |
| **Token Storage**          | In-memory cache      | Writes to `~/.npmrc`           |
| **Yarn Integration**       | Native plugin hook   | External process               |
| **Configuration**          | `.yarnrc.yml`        | `.npmrc` files                 |
| **Best For**               | Yarn Berry projects  | npm/pnpm/Yarn Classic projects |

Choose `yarn-plugin-ado-auth` if you're using Yarn Berry (v2+) and want seamless, automatic authentication without modifying global config files.

## License

MIT

## Contributing

See the [main repository README](../../README.md) for contribution guidelines.
