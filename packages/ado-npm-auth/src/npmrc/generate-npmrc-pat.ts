import { hostname } from "os";
import { AdoPatResponse, adoPat } from "../azureauth/ado.js";
import { toBase64 } from "../utils/encoding.js";

/**
 * Generates a valid ADO PAT, scoped for vso.packaging in the given ado organization, 30 minute timeout
 * @returns { string } a valid ADO PAT
 */
export const generateNpmrcPat = async (
  organization: string,
  encode = false,
): Promise<string> => {
  const name = `${hostname()}-${organization}`;
  const pat = await adoPat({
    promptHint: `${name} .npmrc PAT`,
    organization,
    displayName: `${name}-npmrc-pat`,
    scope: ["vso.packaging"],
    timeout: "30",
    output: "json",
  });

  const rawToken = (pat as AdoPatResponse).token;

  if (encode) {
    return toBase64(rawToken);
  }

  return rawToken;
};
