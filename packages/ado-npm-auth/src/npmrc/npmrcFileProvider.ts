import Config from "@npmcli/config";
import {
  defaultEmail,
  defaultUser,
  Feed,
  FileProvider,
} from "../fileProvider.js";
import fs from "node:fs/promises";
import { EOL } from "node:os";
import { getOrganizationFromFeedUrl } from "../utils/get-organization-from-feed-url.js";
import { getFeedWithoutProtocol } from "../utils/get-feed-without-protocol.js";
import { fromBase64, toBase64 } from "../utils/encoding.js";
import path from "node:path";

export class NpmrcFileProvider extends FileProvider {
  constructor(configFile?: string, userConfigFile?: string) {
    super("NpmRc", ".npmrc", configFile, userConfigFile);
  }

  override async prepUserFile(): Promise<void> {
    try {
      const npmrcContent = await fs.readFile(this.userFilePath, "utf-8");

      // remove the entry for registries in the user-level .npmrc
      const updatedNpmrcContent = npmrcContent
        .split(EOL)
        .filter((line) => !line.includes("registry="))
        .join(EOL);
      await fs.writeFile(this.userFilePath, updatedNpmrcContent);
    } catch (error) {
      // user npmrc does not exist so make an empty one
      await fs.writeFile(this.userFilePath, "");
    }
  }

  override async getWorkspaceRegistries(): Promise<string[]> {
    let config!: Config;

    try {
      config = new Config({
        npmPath: this.workspaceFilePath,
        argv: [
          "<dummy_node>", // pnpm code always slices the first two arv arguments
          "<dummy_pnpm_js>", // pnpm code always slices the first two arv arguments

          // This is to ensure that the parser picks up the selected .npmrc file
          // as the built-in logic for finding the .npmrc file is not resiliant
          // for repo's that are of mixed languages i.e. js + cpp + C# etc.
          // The assumption is that the .npmrc file is next to a node_modules or package.json
          // file which in large mono-repo's at is not always the case.
          `--prefix=${path.dirname(this.workspaceFilePath)}`,
        ],
        shorthands: {},
        definitions: {} as any, // needed so we can access random feed names
      });
      await config.load();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes("Invalid URL")) {
        throw new Error("Registry URL missing or invalid");
      }
      throw new Error("Error loading .npmrc");
    }

    // @npmcli/config does not have a normal way to display all keys
    // so we use this ugly access instead
    const projectNpmrcKeys = Object.keys(
      (config.data?.get("project") || {})["data"] || {},
    );

    // find any and all keys which are a registry
    const registries = projectNpmrcKeys.filter((key) =>
      key.includes("registry"),
    );

    return registries
      .map<string>((registry) => config.get(registry, "project") as string)
      .map((feed) => getFeedWithoutProtocol(feed));
  }

  override async getUserFeeds(): Promise<Map<string, Feed>> {
    const result = new Map<string, Feed>();

    await this.processNpmRcFile(
      this.userFilePath,
      (_: string, registry: string, field: string, value: string) => {
        let feed = result.get(registry);
        if (!feed) {
          feed = {
            registry: registry,
            adoOrganization: getOrganizationFromFeedUrl(registry),
          };
          result.set(feed.registry, feed);
        }
        switch (field) {
          case "_password":
            feed.authToken = fromBase64(value).trim();
            break;
          case "username":
            feed.userName = value;
            break;
          case "email":
            feed.email = value;
            break;
        }
      },
    );

    return result;
  }

  async patchUserNpmRcFile(
    newLinesByRegistryAndField: Map<string, string>,
  ): Promise<string[]> {
    const linesToAdd = new Set<string>(newLinesByRegistryAndField.values());

    const npmrcLines = await this.processNpmRcFile(
      this.userFilePath,
      (line, registry, field, _value) => {
        const newLine = newLinesByRegistryAndField.get(
          this.toRegistryAndFunctionKey(registry, field),
        );
        if (newLine !== undefined) {
          linesToAdd.delete(newLine);
          return newLine;
        }

        return line;
      },
      (line) => line,
    );

    for (const lineToAdd of linesToAdd) {
      npmrcLines.push(lineToAdd);
    }

    return npmrcLines;
  }

  toRegistryAndFunctionKey(registry: string, field: string): string {
    return `//${registry}:${field}=`;
  }

  override async writeWorspaceRegistries(
    feedsToPatch: Iterable<Feed>,
  ): Promise<void> {
    const newLinesByRegistryAndField = new Map<string, string>();

    // Build a map with registry and feed with the updated line for value.
    for (var feedToPatch of feedsToPatch) {
      newLinesByRegistryAndField.set(
        this.toRegistryAndFunctionKey(feedToPatch.registry, "username"),
        `//${feedToPatch.registry}:username=${feedToPatch.userName || defaultUser}`,
      );
      newLinesByRegistryAndField.set(
        this.toRegistryAndFunctionKey(feedToPatch.registry, "email"),
        `//${feedToPatch.registry}:email=${feedToPatch.email || defaultEmail}`,
      );
      newLinesByRegistryAndField.set(
        this.toRegistryAndFunctionKey(feedToPatch.registry, "_password"),
        `//${feedToPatch.registry}:_password=${toBase64(feedToPatch.authToken)}`,
      );
    }

    const npmrcLines = await this.patchUserNpmRcFile(
      newLinesByRegistryAndField,
    );

    await fs.writeFile(this.userFilePath, npmrcLines.join(EOL), {
      encoding: "utf-8",
    });
  }

  async processNpmRcFile(
    npmrcFilePath: string,
    handleFeedConfig: (
      line: string,
      registry: string,
      field: string,
      value: string,
    ) => string | void,
    handleOtherLine?: (line: string) => string | void,
  ): Promise<string[]> {
    const npmrc = await fs.readFile(npmrcFilePath, {
      encoding: "utf8",
    });
    const npmrcLines = npmrc.split("\n").map((line: string) => line.trim());

    const resultLines: string[] = [];
    for (const line of npmrcLines) {
      const slashColonIndex = line.indexOf("/:");
      if (line.startsWith("//") && slashColonIndex >= 2) {
        const registry = line.substring(2, slashColonIndex + 1);
        const remainder = line.substring(slashColonIndex + 2);
        const field = remainder.substring(0, remainder.indexOf("="));
        const value = remainder.substring(remainder.indexOf("=") + 1);

        const newLine = handleFeedConfig(line, registry, field, value);
        if (newLine) {
          resultLines.push(newLine);
        }
      } else if (handleOtherLine) {
        const newLine = handleOtherLine(line);
        if (newLine) {
          resultLines.push(newLine);
        }
      }
    }

    return resultLines;
  }
}
