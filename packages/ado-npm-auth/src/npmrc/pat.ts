import { decode } from "./base64.js";
import { NpmrcOrg } from "./get-repo-npmrc-ado-orgs.js";
import { getFeedWithoutProtocol } from "./getFeedWithoutProtocol.js";
import { readNpmRC } from "./npmrc.js";

/**
 * Get the User's PAT from the .npmrc file
 * @param {Object} options
 * @param {string} options.npmrc Path to the users' .npmrc file
 * @param { Array<NpmrcOrg> } [options.feeds] Feeds to get the PATs for
 * @returns { Promise<Array<NpmrcOrg>> }
 */
export const getUserPat = async ({ npmrc, feeds = [] }: { npmrc: string; feeds: NpmrcOrg[]}) => {
  try {
    const contents = await readNpmRC({ npmrc });
    const feedsWithPat = feeds.slice(); // create a copy of feeds

    for (let i = 0; i < feeds.length; i++) {
      const match = contents.toString().match(
        // SHould match the URL from the user .npmrc
        new RegExp(`${getFeedWithoutProtocol(feeds[i].feed)}:_password=(.*)`)
      );

      if (match) {
        const [, base64password] = match;
        const pat = decode(base64password);

        feedsWithPat[i].pat = pat;
      }
    }

    return feedsWithPat;
  } catch (error) {
    // user npmrc does not exist, or is invalid
    return [];
  }
};
