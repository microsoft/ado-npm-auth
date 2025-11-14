import { type Configuration, type Plugin, SettingsType } from "@yarnpkg/core";
import { getConfigString } from "./utils.ts";

export type AuthPluginConfigurationValueMap = {
  adoNpmAuthToolPath?: string;
  adoNpmAuthFeedPrefix: string;
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
  };
}
