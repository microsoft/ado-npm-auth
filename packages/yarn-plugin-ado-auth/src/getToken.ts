import {
  type Configuration,
  type Ident,
  StreamReport,
  formatUtils,
} from "@yarnpkg/core";
import { getOrganizationFromFeedUrl, generateNpmrcPat } from "ado-npm-auth";
import { loadConfiguration } from "./configuration.ts";
import { getConfigMap, getConfigString, type MapLike } from "./utils.ts";
import { spawnSync } from "node:child_process";
import os from "node:os";

/** not correctly exported so redefined here */
export type GetAuthHeaderOptions = {
  configuration: Configuration;
  ident?: Ident;
};

/**
 * Get the token for the given registry, using caching to avoid multiple calls, initializing
 * the cache on first use.
 */
export const getToken = (() => {
  let tokenCache: TokenCache | undefined = undefined;
  return (options: GetAuthHeaderOptions, registry: string) => {
    tokenCache ??= new TokenCache(options.configuration);
    return tokenCache.getToken(registry, options.ident);
  };
})();

/**
 * A simple in-memory cache for tokens per registry. This will attempt to load tokens from the
 * existing settings first, and if not found, will use the ADO CLI to get a new token.
 */
class TokenCache {
  private configuration: Configuration;
  private prefix: string;
  private azureAuthPath?: string;
  private cache: Record<string, string | Promise<string>> = {};

  constructor(configuration: Configuration) {
    this.configuration = configuration;
    const settings = loadConfiguration(configuration);
    this.prefix = settings.adoNpmAuthFeedPrefix ?? "";
    this.azureAuthPath = settings.adoNpmAuthToolPath || findAzureAuthPath();
  }

  /**
   * Will return the token for the given registry, either from cache or by fetching a new one. If it is in
   * the cache already, it will return it directly. Otherwise it will return a promise that resolves to the token
   * @param registry the registry/feed that we need to authenticate against
   */
  getToken(
    registry: string,
    ident?: Ident,
  ): string | Promise<string> | undefined {
    if (!this.prefix || registry.startsWith(this.prefix)) {
      return (this.cache[registry] ??= this.fetchToken(registry, ident));
    }
    return undefined;
  }

  /**
   * Do the work to fetch a token for the given registry. This will attempt to get it from yarnrc/env first,
   * and if not found, will use the ADO CLI to get a new token.
   *
   * @param registry registry to authenticate to
   * @param ident optional ident, used for configuration lookups (yarn pass through)
   * @returns a promise that resolves to a string
   */
  private async fetchToken(registry: string, ident?: Ident): Promise<string> {
    const configuration = this.configuration;
    await StreamReport.start(
      { configuration, stdout: process.stdout },
      async (report) => {
        const prettyRegistry = formatUtils.pretty(
          configuration,
          registry,
          formatUtils.Type.URL,
        );
        // first see if a token is set via .yarnrc, either hardcoded or via environment variable
        const authConfig = this.getAuthConfiguration(registry, ident);
        const tokenFromYarnrc = getConfigString(authConfig, "npmAuthToken");
        if (tokenFromYarnrc) {
          this.cache[registry] = tokenFromYarnrc;
          report.reportInfo(
            null,
            `✅ Authenticated to: ${prettyRegistry} (via configuration)`,
          );
          return;
        }

        const organization = getOrganizationFromFeedUrl(registry);
        if (!organization) {
          throw new Error(
            `❌ Could not determine organization from registry URL: ${registry}`,
          );
        }

        const pat = await generateNpmrcPat(
          organization,
          registry,
          false,
          this.azureAuthPath,
        );
        this.cache[registry] = pat;
        report.reportInfo(
          null,
          `✅ Authenticated to: ${prettyRegistry} (via ADO CLI)`,
        );
      },
    );

    const pat = this.cache[registry];
    if (pat == null) {
      throw new Error(`❌ Failed to authenticate to: ${registry}`);
    }
    return pat;
  }

  /**
   * Get the authentication configuration for the given registry and ident. This code was
   * taken from Yarn's npm plugin to match their logic. Importing that package directly results in
   * a massive bundle, so extracted just this logic.
   */
  private getAuthConfiguration(registry: string, ident?: Ident): MapLike {
    const scopeConfiguration = ident && this.getScopeConfiguration(ident.scope);

    if (scopeConfiguration?.get(`npmAuthToken`)) {
      return scopeConfiguration;
    }

    const registryConfiguration = this.getRegistryConfiguration(registry);

    return registryConfiguration ?? this.configuration;
  }

  /**
   * Return the auth configuration for the given scope if one has been set
   * @param scope package scope to use for lookups
   */
  private getScopeConfiguration(scope: string | null): MapLike | null {
    if (scope != null) {
      const scopeConfigurations = getConfigMap(this.configuration, `npmScopes`);
      const scopeConfiguration = getConfigMap(scopeConfigurations, scope);
      if (scopeConfiguration) {
        return scopeConfiguration;
      }
    }
    return null;
  }

  /**
   * Return the auth configuration for the given registry if one has been set
   * @param registry registry to get configuration for
   */
  private getRegistryConfiguration(registry: string): MapLike | null {
    // get the npmRegistries configuration map
    const registryConfigurations = getConfigMap(
      this.configuration,
      `npmRegistries`,
    );
    // normalize the registry url for lookups, same as yarn does internally
    const normalizedRegistry = registry.replace(/\/$/, ``);

    // first try to get an exact match
    const exactEntry = getConfigMap(registryConfigurations, normalizedRegistry);
    if (typeof exactEntry !== `undefined`) {
      return exactEntry;
    }

    // then try without protocol
    const noProtocolEntry = getConfigMap(
      registryConfigurations,
      normalizedRegistry.replace(/^[a-z]+:/, ``),
    );

    return noProtocolEntry ?? null;
  }
}

function findAzureAuthPath(): string | undefined {
  const isWin = os.platform() === "win32";
  const execName = isWin ? "azureauth.exe" : "azureauth";
  const cmd = isWin ? "where" : "which";

  try {
    const result = spawnSync(cmd, [execName], { encoding: "utf-8" });
    if (result.status === 0 && result.stdout) {
      const line = result.stdout.split(/\r?\n/).find(Boolean);
      return line ? line.trim() : undefined;
    }
  } catch {
    // Ignore errors, fall through to undefined
  }

  return undefined;
}
