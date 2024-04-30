import Config from "@npmcli/config";
import { getWorkspaceRoot } from "workspace-tools";
import { join } from "node:path";
import fs from "node:fs/promises"
import { getOrganizationFromFeedUrl } from "../utils/get-organization-from-feed-url.js";

export type NpmrcOrg = {
  feed: string;
  organization: string;
  pat?: string;
};

/**
 * Determine what ADO organizations are used in the workspace's .npmrc
 * These should be used to authenticate against
 * @returns A list of the feeds/ado orgs used in the .npmrc
 */
export const getRepoNpmrcAdoOrganizations = async (): Promise<
  Array<NpmrcOrg>
> => {
  const workspaceRoot = getWorkspaceRoot(process.cwd()) || "";
  let config!: Config;
  const npmrcPath = join(workspaceRoot, ".npmrc")

  try {
    await fs.access(npmrcPath)
  } catch(error) {
    throw new Error("No project .npmrc file found")
  }

  try {
    config = new Config({
      npmPath: npmrcPath,
      shorthands: {},
      definitions: {} as any, // needed so we can access random feed names
    });

    await config.load();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("Invalid URL")) { 
      throw new Error("Registry URL missing or invalid")
    }
    throw new Error("Error loading .npmrc")
  }

  // @npmcli/config does not have a normal way to display all keys
  // so we use this ugly access instead
  const projectNpmrcKeys = Object.keys(
    (config.data?.get("project") || {})["data"] || {}
  );

  // find any and all keys which are a registry
  const registries = projectNpmrcKeys.filter((key) => key.includes("registry"));

  return registries.map<NpmrcOrg>((registry) => {
    const feed = config.get(registry, "project") as string;

    return {
      feed,
      organization: getOrganizationFromFeedUrl(feed),
    };
  });
};
