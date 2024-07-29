import { arch, platform } from "os";
import { spawn } from "../utils/exec.js";
import { isSupportedPlatformAndArchitecture } from "./is-supported-platform-and-architecture.js";
import { azureAuthCommand } from "./azureauth-command.js";
import { isWsl } from "../utils/is-wsl.js";
import { spawnSync } from "child_process";
import { isAzureAuthInstalled } from "./is-azureauth-installed.js";

export type AdoPatOptions = {
  promptHint: string;
  organization: string;
  displayName: string;
  scope: string[];
  output?: string;
  mode?: string;
  domain?: string;
  timeout?: string;
};

export type AdoPatResponse = {
  displayName: string;
  validTo: string;
  scope: string[];
  targetAccounts: string[];
  validFrom: string;
  authorizationId: string;
  token: string;
};

/**
 * Wrapper for `azureauth ado pat`. Please run `azureauth ado pat --help` for full command options and description
 * @param options Options for PAT generation
 * @returns ADO PAT details
 */
export const adoPat = async (
  options: AdoPatOptions,
): Promise<AdoPatResponse | string> => {
  if (!isSupportedPlatformAndArchitecture()) {
    throw new Error(
      `AzureAuth is not supported for platform ${platform()} and architecture ${arch()}`,
    );
  }

  const { command: authCommand, env } = azureAuthCommand();

  const command = [
    ...authCommand,
    `ado`,
    `pat`,
    `--prompt-hint ${isWsl() ? options.promptHint : `"${options.promptHint}"`}`, // Prompt hint may contain spaces so wrap in quotes.
    `--organization ${options.organization}`,
    `--display-name ${options.displayName}`,
    ...options.scope.map((scope) => `--scope ${scope}`),
  ];

  if (options.output) {
    command.push(`--output ${options.output}`);
  }

  if (options.mode) {
    command.push(`--mode ${options.mode}`);
  }

  if (options.domain) {
    command.push(`--domain ${options.domain}`);
  }

  if (options.timeout) {
    command.push(`--timeout ${options.timeout}`);
  }

  try {
    let result;
    if (isWsl()) {
      try {
        result = spawnSync(command[0], command.slice(1), { encoding: "utf-8" });

        if (result.error) {
          throw new Error(result.error.message);
        }
      } catch (error: any) {
        throw new Error(
          `Failed to get Ado Pat from system AzureAuth: ${error.message}`,
        );
      }
    } else {
      try {
        result = await spawn(command[0], command.slice(1), {
          shell: false,
          env,
          stdio: ["ignore", "pipe", "inherit"],
        });
      } catch (error: any) {
        throw new Error(
          `Failed to get Ado Pat from npx AzureAuth: ${error.message}`,
        );
      }
    }

    if (options.output === "json") {
      try {
        return JSON.parse(result.stdout) as AdoPatResponse;
      } catch (error: any) {
        throw new Error(`Failed to parse JSON output: ${result.stdout}`);
      }
    }

    return result.stdout;
  } catch (error: any) {
    if (!(await isAzureAuthInstalled())) {
      throw new Error(`AzureAuth is not installed.`);
    }

    throw new Error(error.message);
  }
};
