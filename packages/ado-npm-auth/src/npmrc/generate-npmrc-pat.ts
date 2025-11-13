import { hostname, platform } from "os";
import type { AdoPatResponse } from "../azureauth/ado.js";
import { adoPat } from "../azureauth/ado.js";
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
  switch (platform()) {
    case "win32":
    case "darwin": {
      const pat = await adoPat(
        {
          promptHint: `Authenticate to ${organization} to generate a temporary token for npm`,
          organization: `https://dev.azure.com/${organization}`,
          displayName: name,
          scope: ["vso.packaging"],
          timeout: "30",
        },
        azureAuthLocation,
      );
      return (pat as AdoPatResponse).token;
    }
    case "linux": {
      const cpPat = await credentialProviderPat(feed);
      return cpPat.Password;
    }
    default:
      throw new Error(
        `Platform ${platform()} is not supported for ADO authentication`,
      );
  }
}
