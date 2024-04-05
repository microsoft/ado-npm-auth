import { makeRequest } from "./makeRequest.js";

/**
 * Check if the user is authenticated to the ADO API.
 * This function performs a network request to retrieve an ADO feed for the given organization
 * Since that request is usually slow, and we don't actually know the ID of a valid feed, we just use the "invalid" ID of "1"
 * If the network request returns 401, then the PAT is invalid. If the request returns 404 (or somehow 200) then the PAT is valid
 * @param {Object} options
 * @param {string} options.password The password to use for the login
 * @param {string} options.organization The organization to check against
 * @returns
 */
export const makeADORequest = async ({ password, organization }: {
  password: string;
  organization: string;
}) => {
  const auth = `Basic ${Buffer.from(`.:${password}`).toString("base64")}`;

  const options = {
    hostname: "feeds.dev.azure.com",
    port: 443,
    path: `/${organization}/_apis/packaging/feeds/1?api-version=6.1-preview.1`,
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: auth,
    },
  };

  try {
    await makeRequest(options);
  } catch (/** @type {any} */ error) {
    if ((error as any).statusCode === 404) {
      // this is the good case, because we use a non-existant feed ID
      // but if you get a 404 it means you can even determine that with a valid token
      return;
    }

    throw error;
  }
};
