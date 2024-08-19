import { getWorkspaceRoot } from "workspace-tools";
import { join } from "node:path";
import fs from "node:fs/promises";
import path from "node:path";
import { homedir } from "node:os";
import { getOrganizationFromFeedUrl } from "./utils/get-organization-from-feed-url.js";
import { makeADORequest } from "./ado/make-ado-request.js";

/**
 * Default user to be used in the .npmrc
 */
export const defaultUser = "me";

/**
 * Default email to be used in the .npmrc
 */
export const defaultEmail = "me@example.com";

export interface Feed {
  registry: string;
  adoOrganization: string;
  userName?: string;
  email?: string;
  authToken?: string;
}

export type ValidatedFeed = {
  feed: Feed;
  isValid: boolean;
  fileProvider: FileProvider;
};

export abstract class FileProvider {
  public workspaceFilePath: string;
  public userFilePath: string;

  public feeds: Map<string, Feed>;

  constructor(
    public id: string,
    public workspaceFileName: string,
    configFile?: string,
  ) {
    let workspaceFilePath = undefined;
    if (configFile && path.basename(configFile) === this.workspaceFileName) {
      workspaceFilePath = path.resolve(configFile);
    } else {
      const workspaceRoot = getWorkspaceRoot(process.cwd()) || "";
      workspaceFilePath = join(workspaceRoot, this.workspaceFileName);
    }
    this.workspaceFilePath = workspaceFilePath;

    const userHome =
      process.env["HOME"] || process.env["USERPROFILE"] || homedir() || "";
    this.userFilePath = join(userHome, workspaceFileName);
    this.feeds = new Map<string, Feed>();
  }

  public async isSupportedInRepo(): Promise<boolean> {
    try {
      await fs.access(this.workspaceFilePath);
    } catch (error) {
      return false;
    }

    return true;
  }

  public async validateAllUsedFeeds(): Promise<ValidatedFeed[]> {
    await this.prepUserFile();

    const result: ValidatedFeed[] = [];

    const workspaceRegistries = await this.getWorkspaceRegistries();
    const userFeeds = await this.getUserFeeds();

    // check each feed for validity
    for (const registry of workspaceRegistries) {
      const feed = userFeeds.get(registry);

      if (feed) {
        let feedIsValid = true;
        try {
          await makeADORequest({
            password: feed.authToken || "",
            organization: feed.adoOrganization,
          });
        } catch (e) {
          feedIsValid = false;
        }
        result.push({ feed: feed, isValid: feedIsValid, fileProvider: this });
      } else {
        // No representation of the token in the users config file.
        result.push({
          feed: {
            registry: registry,
            adoOrganization: getOrganizationFromFeedUrl(registry),
          },
          isValid: false,
          fileProvider: this,
        });
      }
    }

    return result;
  }

  abstract prepUserFile(): Promise<void>;
  abstract getUserFeeds(): Promise<Map<string, Feed>>;
  abstract getWorkspaceRegistries(): Promise<string[]>;
  abstract writeWorspaceRegistries(feedsToPatch: Iterable<Feed>): Promise<void>;
}
