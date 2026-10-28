import { type Configuration, type Plugin, SettingsType } from "@yarnpkg/core";
import { getConfigString } from "./utils.ts";

export type AuthPluginConfigurationValueMap = {
  adoNpmAuthToolPath?: string;
  adoNpmAuthFeedPrefix: string;
  adoNpmAuthTenantId?: string;
  adoNpmAuthDomain?: string;
};

export function getConfiguration() {
  return {
    adoNpmAuthToolPath: {
      description: `The path to the ADO authentication tool`,
      type: SettingsType.STRING,
      default: null,
    },
    adoNpmAuthFeedPrefix: {
      description: `The prefix to use for ADO NPM feed URLs`,
      type: SettingsType.STRING,
      default: `https://pkgs.dev.azure.com/`,
    },
    adoNpmAuthTenantId: {
      description: `The Azure AD tenant ID to use when authenticating with Azure DevOps. If unset, azureauth defaults to the Microsoft tenant, which fails for non-Microsoft corporate tenants.`,
      type: SettingsType.STRING,
      default: null,
    },
    adoNpmAuthDomain: {
      description: `The preferred account domain for filtering cached MSAL accounts (e.g. "contoso.com"). Useful when the user has cached accounts in multiple tenants.`,
      type: SettingsType.STRING,
      default: null,
    },
  } as Plugin["configuration"];
}

export function loadConfiguration(
  configuration: Configuration,
): AuthPluginConfigurationValueMap {
  return {
    adoNpmAuthToolPath: getConfigString(configuration, "adoNpmAuthToolPath"),
    adoNpmAuthFeedPrefix: getConfigString(
      configuration,
      "adoNpmAuthFeedPrefix",
      true,
    ),
    adoNpmAuthTenantId: getConfigString(configuration, "adoNpmAuthTenantId"),
    adoNpmAuthDomain: getConfigString(configuration, "adoNpmAuthDomain"),
  };
}
