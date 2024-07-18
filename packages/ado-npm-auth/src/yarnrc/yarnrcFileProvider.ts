import { Feed, FileProvider } from "../fileProvider.js";
import yaml from "js-yaml";
import fs from "node:fs/promises"
import { fromBase64, toBase64 } from "../utils/encoding.js";
import { getOrganizationFromFeedUrl } from "../utils/get-organization-from-feed-url.js";
import { getFeedWithoutProtocol } from "../utils/get-feed-without-protocol.js";

export class YarnRcFileProvider extends FileProvider {
    constructor() {
        super("YarnRc", ".yarnrc.yml");
    }

    override async prepUserFile(): Promise<void> {
        // no need to do anything
    }

    override async getUserFeeds(): Promise<Map<string, Feed>> {
        const result = new Map<string, Feed>();
        const yarnrc = await this.paseYarnRc(this.userFilePath);
        if (!yarnrc) {
            // No content
            return result;
        }
        const npmRegistries = yarnrc.npmRegistries || {};
        for (var registry of Object.keys(npmRegistries) ) {
            const registryData = npmRegistries[registry] || {};
            const registryWithoutProtocol = registry.startsWith("//") ? registry.substring(2) : registry;
            
            const feed: Feed = {
                registry: registryWithoutProtocol,
                adoOrganization: getOrganizationFromFeedUrl(registryWithoutProtocol),
            }

            const authToken = fromBase64(registryData.npmAuthIdent || "")
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
        const registries : string[] = []
        const yarnrc = await this.paseYarnRc(this.workspaceFilePath);
        
        if (yarnrc.npmRegistryServer) {
            registries.push(getFeedWithoutProtocol(yarnrc.npmRegistryServer));
        }

        if (yarnrc.npmScopes) {
            for (var scope of Object.keys(yarnrc.npmScopes) ) {
                const scopeRegistry  = yarnrc.npmScopes[scope]?.npmRegistryServer;
                if (scopeRegistry) {
                    registries.push(scopeRegistry);
                }
            }
        }

        return registries;
    }

    override async writeWorspaceRegistries(feedsToPatch: Iterable<Feed>): Promise<void> {
        const yarnrc = await this.paseYarnRc(this.userFilePath) || {};

        if (!yarnrc.npmRegistries) {
            yarnrc.npmRegistries = {};
        }

        for (var feed of feedsToPatch) {
            const yarnRcYamlKey = "//" + feed.registry;
            const entry = yarnrc.npmRegistries[yarnRcYamlKey] || {};
            // Make sure alwaysAuth is the default
            if (entry.npmAlwaysAuth === undefined) {
                entry.npmAlwaysAuth = true;
            }
            entry.npmAuthIdent = toBase64(`${feed.userName}:${feed.authToken}`);
            yarnrc.npmRegistries[yarnRcYamlKey] = entry;
        }

        const yarnrcContent = yaml.dump(yarnrc);
        await fs.writeFile(this.userFilePath, yarnrcContent);
    }

    async paseYarnRc(filePath: string): Promise<YarnRc> { 
        const content = await fs.readFile(filePath, 'utf8');
        return yaml.load(content, {filename: filePath}) as YarnRc;
    }

}

interface YarnRc {
    npmRegistryServer?: string,
    npmScopes?: {
        [org: string]: {
            npmRegistryServer?: string,
            npmAlwaysAuth?: boolean,
            npmAuthIdent?: string,
            npmAuthToken?: string,
        },
    },
    npmRegistries?: {
        [registry: string]: {
            npmAlwaysAuth?: boolean,
            npmAuthIdent?: string,
            npmAuthToken?: string,
        },
    },
}