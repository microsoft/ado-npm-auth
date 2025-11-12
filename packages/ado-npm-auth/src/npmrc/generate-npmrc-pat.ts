import { hostname, platform } from "os";
import { AdoPatResponse, adoPat } from "../azureauth/ado.js";
import { toBase64 } from "../utils/encoding.js";
import { credentialProviderPat } from "./nugetCredentialProvider.js";

/**
 * Generates a valid ADO PAT, scoped for vso.packaging in the given ado organization, 30 minute timeout
 * @returns { string } a valid ADO PAT
 */
export const generateNpmrcPat = async (
  organization: string,
  feed: string,
  encode = false,
  azureAuthLocation?: string,
): Promise<string> => {
  const name = `${hostname()}-${organization}`;
  const rawToken = await getRawToken(
    name,
    organization,
    feed,
    azureAuthLocation,
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
): Promise<string> {

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

  switch (platform()) {
    case "win32":
    case "darwin":
      const pat = await adoPat(
        {
          promptHint: `Authenticate to ${organization} to generate a temporary token for npm`,
          organization,
          displayName: name,
          scope: [patScope],
          timeout: "30",
          output: "json",
        },
        azureAuthLocation,
      );
      return (pat as AdoPatResponse).token;
    case "linux":
      const cpPat = await credentialProviderPat(feed);
      return cpPat.Password;
    default:
      throw new Error(
        `Platform ${platform()} is not supported for ADO authentication`,
      );
  }
}
