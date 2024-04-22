import Config from "@npmcli/config";
import { getWorkspaceRoot } from "workspace-tools";
import { join } from "node:path";
import fs from "node:fs/promises";
import { getOrganizationFromFeedUrl } from "../utils/get-organization-from-feed-url.js";

export type NpmrcOrg = {
  feed: string;
  organization: string;
  pat?: string;
};

/**
 * Retrieves the path to the default npmrc file created by Rush init from the rush.json configuration file, if available.
 *
 * @param {string} workspaceRoot - The root directory of the workspace where rush.json should be located.
 * @returns {Promise<string|null>} - The full path to the Rush-managed npmrc file if found, or null if rush.json is not accessible or does not define an npmrc path.
 */
const getRushNpmrcPath = async (
  workspaceRoot: string,
): Promise<string | null> => {
  const rushJsonPath = join(workspaceRoot, "rush.json");
  try {
    await fs.access(rushJsonPath);
    // Check the default Rush .npmrc path
    return join(workspaceRoot, "common/config/rush/.npmrc");
  } catch (error) {
    return null;
  }
};

/**
 * Resolves the path to the .npmrc file for the given workspace. It first checks for an .npmrc file
 * at the workspace root and if not found, it then checks alternative locations
 *
 * @param {string} workspaceRoot - The root directory of the workspace.
 * @returns {Promise<string>} - The path to the .npmrc file if found.
 * @throws {Error} - Throws an error if no .npmrc file is found in any of the expected locations.
 */
const resolveNpmrcPath = async (workspaceRoot: string): Promise<string> => {
  // First check for .npmrc at the root directory
  const rootNpmrcPath = join(workspaceRoot, ".npmrc");
  try {
    await fs.access(rootNpmrcPath);
    return rootNpmrcPath;
  } catch (error) {
    console.log(
      ".npmrc not found at the root. Checking for Rush-managed .npmrc...",
    );
  }

  // If not found, check for a Rush-managed .npmrc
  const rushNpmrcPath = await getRushNpmrcPath(workspaceRoot);
  if (rushNpmrcPath) {
    try {
      await fs.access(rushNpmrcPath);
      return rushNpmrcPath;
    } catch (error) {
      console.log("Rush-managed .npmrc also not found.");
    }
  }

  // If no .npmrc file is found in any expected locations
  throw new Error("No .npmrc file found");
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
  const npmrcPath = await resolveNpmrcPath(workspaceRoot);

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
    (config.data?.get("project") || {})["data"] || {},
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
