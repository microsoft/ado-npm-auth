import { makeADORequest } from "./make-ado-request.js";
import { getUserPat } from "./get-user-pat.js";
import { NpmrcOrg } from "./get-repo-npmrc-ado-orgs.js";
import { getUserNPMRC } from "./npmrc.js";

/**
 * Validates the tokens for each feed/organization by making a simple network request to ADO
 * @param { Object } options
 * @param { boolean } [options.silent]
 * @param { Array<NpmrcOrg> } [options.feeds]
 */
export const checkTokens = async function ({ feeds }: { feeds: NpmrcOrg[] }) {
  const userNpmRc = getUserNPMRC();
  
  const feedsWithPat = await getUserPat({ npmrc: userNpmRc, feeds });

  const missingPats = feedsWithPat.filter((item) => !item.pat);

  if (missingPats.length) {
    return false
  }

  try {
    await Promise.all(feedsWithPat.map(feed => 
      makeADORequest({
        password: feed.pat ?? "",
        organization: feed.organization,
      })
    ))
    return true;
  } catch (e) {
    return false;
  }
};
