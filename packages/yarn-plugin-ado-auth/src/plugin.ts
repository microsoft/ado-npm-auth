import { type Plugin } from "@yarnpkg/core";
import { type GetAuthHeaderOptions, getToken } from "./getToken.ts";
import { getConfiguration } from "./configuration.ts";

/**
 * Called when getting the authentication header for a request to the npm registry.
 * You can use this mechanism to dynamically query a CLI for the credentials for a
 * specific registry.
 */
async function getNpmAuthenticationHeader(
  currentHeader: string | undefined,
  registry: string,
  options: GetAuthHeaderOptions,
): Promise<string | undefined> {
  const customToken = getToken(options, registry);
  if (customToken !== undefined) {
    const token =
      typeof customToken === "string" ? customToken : await customToken;
    return `Bearer ${token}`;
  }
  return currentHeader;
}

/**
 * The plugin definition.
 */
const plugin: Plugin = {
  /**
   * Add the plugin configuration options
   */
  configuration: getConfiguration(),

  /**
   * Add a hook to authenticate on demand with npm feeds
   */
  hooks: {
    getNpmAuthenticationHeader,
  },
};

// eslint-disable-next-line no-restricted-exports
export default plugin;
