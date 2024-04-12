import { checkTokens } from "./check-tokens.js";
import { getOrganizationFromFeedUrl } from "../utils/get-organization-from-feed-url.js";
import { homedir, EOL } from "node:os";
import { join } from "node:path";
import { readFile, writeFile } from "node:fs/promises";
import {
  NpmrcOrg,
  getRepoNpmrcAdoOrganizations,
} from "./get-repo-npmrc-ado-orgs.js";

export const isValidPat = async (): Promise<boolean> => {
  await removeUserNpmrcRegistries();

  const feeds = await getNpmrcFeeds();
  return await checkTokens({ feeds });
};

const removeUserNpmrcRegistries = async () => {
  const userNpmrc = join(homedir(), ".npmrc");

  try {
    const npmrcContent = await readFile(userNpmrc, "utf-8");

    // remove the entry for registries in the user-level .npmrc
    const updatedNpmrcContent = npmrcContent
      .split(EOL)
      .filter((line) => !line.includes("registry="))
      .join(EOL);
    await writeFile(userNpmrc, updatedNpmrcContent);
  } catch (error) {
    // user npmrc does not exist so make an empty one
    await writeFile(userNpmrc, "");
  }
};

const getNpmrcFeeds = async (): Promise<Array<NpmrcOrg>> => {
  const projectNpmrcOrgs = await getRepoNpmrcAdoOrganizations();
  const userNpmrc = await getUserNpmrcFeeds();

  // make a lookup map for pats by org
  const tokenMap = userNpmrc.reduce((acc, curr) => {
    acc[curr.organization] = curr.pat;
    return acc;
  }, {} as Record<string, string | undefined>);

  // try to fill up pats for each project feed from user npmrc feeds
  projectNpmrcOrgs.forEach((feed) => {
    feed.pat = tokenMap[feed.organization];
  });

  return projectNpmrcOrgs;
};

const getUserNpmrcFeeds = async (): Promise<Array<NpmrcOrg>> => {
  const userNpmrcFilepath = join(homedir(), ".npmrc");
  const userNpmrcContent = await readFile(userNpmrcFilepath, "utf-8");
  return userNpmrcContent
    .split(EOL)
    .filter((line) => line.includes(":_password="))
    .map((line) => {
      const [feedRaw, pat] = line.split(":_password=");
      const feed = `https:${feedRaw}`;
      const organization = getOrganizationFromFeedUrl(feed);
      return {
        feed,
        organization,
        pat,
      };
    });
};
