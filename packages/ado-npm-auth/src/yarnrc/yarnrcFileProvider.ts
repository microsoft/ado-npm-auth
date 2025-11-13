import type { Feed } from "../fileProvider.js";
import { FileProvider } from "../fileProvider.js";
import yaml from "js-yaml";
import fs from "node:fs/promises";
import { fromBase64, toBase64 } from "../utils/encoding.js";
import { getOrganizationFromFeedUrl } from "../utils/get-organization-from-feed-url.js";
import { getFeedWithoutProtocol } from "../utils/get-feed-without-protocol.js";
import { writeFileLazy } from "../utils/fileUtils.js";

export class YarnRcFileProvider extends FileProvider {
  constructor(configFile?: string) {
    super("YarnRc", ".yarnrc.yml", configFile);
  }

  override async prepUserFile(): Promise<void> {
    try {
      const yarnrc = await this.paseYarnRc(this.userFilePath);

      // remove the entry for registries in the user-level .npmrc
      if (yarnrc && yarnrc.npmRegistryServer) {
        delete yarnrc.npmRegistryServer;
        await this.writeYarnRc(this.userFilePath, yarnrc);
      }
    } catch {
      // user .yarnrc file does not exist so make an empty one
      await writeFileLazy(this.userFilePath, "");
    }
  }

  override async getUserFeeds(): Promise<Map<string, Feed>> {
    const result = new Map<string, Feed>();
    const yarnrc = await this.paseYarnRc(this.userFilePath);
    if (!yarnrc) {
      // No content
      return result;
    }
    const npmRegistries = yarnrc.npmRegistries || {};
    for (const registry of Object.keys(npmRegistries)) {
      const registryData = npmRegistries[registry] || {};
      const registryWithoutProtocol = registry.startsWith("//")
        ? registry.substring(2)
        : registry;

      const feed: Feed = {
        registry: registryWithoutProtocol,
        adoOrganization: getOrganizationFromFeedUrl(registryWithoutProtocol),
      };

      const authToken = fromBase64(registryData.npmAuthIdent || "");
      const userPasswordIndex = authToken.indexOf(":");
      if (userPasswordIndex > 0) {
        feed.userName = authToken.substring(0, userPasswordIndex);
        feed.authToken = authToken.substring(userPasswordIndex + 1);
      }

      result.set(registryWithoutProtocol, feed);
    }

    return result;
  }

  override async getWorkspaceRegistries(): Promise<string[]> {
    const registries: string[] = [];
    const yarnrc = await this.paseYarnRc(this.workspaceFilePath);

    if (yarnrc.npmRegistryServer) {
      registries.push(getFeedWithoutProtocol(yarnrc.npmRegistryServer));
    }

    if (yarnrc.npmScopes) {
      for (const scope of Object.keys(yarnrc.npmScopes)) {
        const scopeRegistry = yarnrc.npmScopes[scope]?.npmRegistryServer;
        if (scopeRegistry) {
          registries.push(scopeRegistry);
        }
      }
    }

    return registries;
  }

  override async writeWorkspaceRegistries(
    feedsToPatch: Iterable<Feed>,
  ): Promise<void> {
    const yarnrc = (await this.paseYarnRc(this.userFilePath)) || {};

    if (!yarnrc.npmRegistries) {
      yarnrc.npmRegistries = {};
    }

    for (const feed of feedsToPatch) {
      const yarnRcYamlKey = "//" + feed.registry;
      const entry = yarnrc.npmRegistries[yarnRcYamlKey] || {};
      // Make sure alwaysAuth is the default
      if (entry.npmAlwaysAuth === undefined) {
        entry.npmAlwaysAuth = true;
      }
      entry.npmAuthIdent = toBase64(`${feed.userName}:${feed.authToken}`);
      yarnrc.npmRegistries[yarnRcYamlKey] = entry;
    }

    await this.writeYarnRc(this.userFilePath, yarnrc);
  }

  async writeYarnRc(filePath: string, yarnrc: YarnRc) {
    const yarnrcContent = yaml.dump(yarnrc);
    await writeFileLazy(filePath, yarnrcContent);
  }

  async paseYarnRc(filePath: string): Promise<YarnRc> {
    const content = await fs.readFile(filePath, "utf8");
    return yaml.load(content, { filename: filePath }) as YarnRc;
  }
}

type YarnRc = {
  npmRegistryServer?: string;
  npmScopes?: Record<
    string,
    {
      npmRegistryServer?: string;
      npmAlwaysAuth?: boolean;
      npmAuthIdent?: string;
      npmAuthToken?: string;
    }
  >;
  npmRegistries?: Record<
    string,
    {
      npmAlwaysAuth?: boolean;
      npmAuthIdent?: string;
      npmAuthToken?: string;
    }
  >;
};
