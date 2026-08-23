import { hostname, platform } from "node:os";
import type { AdoPatResponse } from "../azureauth/ado.js";
import { adoPat } from "../azureauth/ado.js";
import { toBase64 } from "../utils/encoding.js";
import { isWsl } from "../utils/is-wsl.js";
import { credentialProviderPat } from "./nugetCredentialProvider.js";

/**
 * Optional overrides forwarded to `azureauth ado pat`.
 *
 * - `tenant`: Azure AD tenant ID. When unset, azureauth defaults to the
 *   Microsoft tenant, which fails for non-Microsoft corporate tenants.
 * - `domain`: preferred account domain used to filter cached MSAL accounts
 *   (e.g. "contoso.com"). Useful when multiple tenants share the MSAL cache.
 */
export type GenerateNpmrcPatOptions = {
  tenant?: string;
  domain?: string;
};

/**
 * Generates a valid ADO PAT, scoped for vso.packaging in the given ado organization, 30 minute timeout
 * @returns { string } a valid ADO PAT
 */
export const generateNpmrcPat = async (
  organization: string,
  feed: string,
  encode = false,
  azureAuthLocation?: string,
  options: GenerateNpmrcPatOptions = {},
): Promise<string> => {
  const name = `${hostname()}-${organization}`;
  const rawToken = await getRawToken(
    name,
    organization,
    feed,
    azureAuthLocation,
    options,
  );

  if (encode) {
    return toBase64(rawToken);
  }

  return rawToken;
};

async function getRawToken(
  name: string,
  organization: string,
  feed: string,
  azureAuthLocation?: string,
  options: GenerateNpmrcPatOptions = {},
): Promise<string> {
  const linuxTenantDomainOverrideError =
    "tenant/domain overrides are not supported on Linux with CredentialProvider.Microsoft";

  /**
   *  Use vso.packaging_write to include "Collaborator" (Feed and Upstream Reader) permissions.
   * vso.packaging only provides "Reader" access (view/download packages).
   * vso.packaging_write provides "Contributor" access (publish/promote/deprecate) which includes
   * Collaborator permissions (save packages from upstream sources).
   * Reference: https://learn.microsoft.com/en-us/azure/devops/integrate/get-started/authentication/oauth#available-scopes
   *
   * I filed feedback on VSO to add this: https://developercommunity.visualstudio.com/t/the-scope-for-vsopackaging-SHOULD-inclu/10998135
   */
  const patScope = "vso.packaging_write";
  const getAzureAuthToken = async (): Promise<string> => {
    const pat = await adoPat(
      {
        promptHint: `Authenticate to ${organization} to generate a temporary token for npm`,
        organization,
        displayName: name,
        scope: [patScope],
        tenant: options.tenant,
        domain: options.domain,
        timeout: "30",
        output: "json",
      },
      azureAuthLocation,
    );

    return (pat as AdoPatResponse).token;
  };

  if (isWsl()) {
    return await getAzureAuthToken();
  }

  switch (platform()) {
    case "win32":
    case "darwin":
      return await getAzureAuthToken();
    case "linux": {
      if (options.tenant || options.domain) {
        throw new Error(linuxTenantDomainOverrideError);
      }

      const cpPat = await credentialProviderPat(feed);
      return cpPat.Password;
    }
    default:
      throw new Error(
        `Platform ${platform()} is not supported for ADO authentication`,
      );
  }
}
