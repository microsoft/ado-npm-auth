import { makeADORequest } from "./makeADORequest.js";
import { getUserPat } from "./getUserPAT.js";
import { NpmrcOrg } from "./get-repo-npmrc-ado-orgs.js";
import { getUserNPMRC } from "./npmrc.js";

/**
 * @param { Object } options
 * @param { boolean } [options.silent]
 * @param { Array<NpmrcOrg> } [options.feeds]
 */
export const checkADO = async function ({ feeds }: { feeds: NpmrcOrg[] }) {
  const userNpmRc = getUserNPMRC();
  
  const feedsWithPat = await getUserPat({ npmrc: userNpmRc, feeds });

  const missingPats = feedsWithPat.filter((item) => !item.pat);
  if (missingPats.length) {
    throw new Error(`❌ Missing PATs in your user profile .npmrc!`)
  }

  try {
    // check each feed for validity
    for (const feed of feedsWithPat) {
      await makeADORequest({
        password: feed.pat || "",
        organization: feed.organization,
      });
    }

  } catch (/** @type {any} */ e) {

    return false;
  }

  return true;
};
