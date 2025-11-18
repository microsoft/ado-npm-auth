import { type Configuration, type Ident } from "@yarnpkg/core";
import { TokenCache } from "./tokenCache.ts";

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
