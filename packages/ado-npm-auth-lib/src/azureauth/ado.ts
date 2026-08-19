import { arch, platform } from "node:os";
import { spawnSync } from "node:child_process";
import { isSupportedPlatformAndArchitecture } from "./is-supported-platform-and-architecture.js";
import { azureAuthCommand } from "./azureauth-command.js";
import { isAzureAuthInstalled } from "./is-azureauth-installed.js";

export type AdoPatOptions = {
  promptHint: string;
  organization: string;
  displayName: string;
  scope: string[];
  output?: string;
  mode?: string;
  domain?: string;
  tenant?: string;
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

const quoteWindowsShellArg = (arg: string): string => {
  if (arg.length === 0) {
    return '""';
  }

  return `"${arg.replace(/(\\*)"/g, '$1$1\\"').replace(/(\\+)$/g, "$1$1")}"`;
};

const buildWindowsShellCommand = (executable: string, args: string[]): string =>
  [executable, ...args].map(quoteWindowsShellArg).join(" ");

/**
 * Wrapper for `azureauth ado pat`. Please run `azureauth ado pat --help` for full command options and description
 * @param options Options for PAT generation
 * @returns ADO PAT details
 */
export const adoPat = async (
  options: AdoPatOptions,
  azureAuthLocation?: string,
): Promise<AdoPatResponse | string> => {
  const currentPlatform = platform();

  if (!isSupportedPlatformAndArchitecture()) {
    throw new Error(
      `AzureAuth is not supported for platform ${currentPlatform} and architecture ${arch()}`,
    );
  }

  const { command: authCommand, env } = azureAuthLocation
    ? {
        command: [azureAuthLocation],
        env: process.env,
      }
    : azureAuthCommand();

  const argv: string[] = [
    ...authCommand,
    "ado",
    "pat",
    "--prompt-hint",
    options.promptHint,
    "--organization",
    options.organization,
    "--display-name",
    options.displayName,
    ...options.scope.flatMap((s) => ["--scope", s]),
  ];

  if (options.output) {
    argv.push("--output", options.output);
  }
  if (options.mode) {
    argv.push("--mode", options.mode);
  }
  if (options.tenant) {
    argv.push("--tenant", options.tenant);
  }
  if (options.domain) {
    argv.push("--domain", options.domain);
  }
  if (options.timeout) {
    argv.push("--timeout", options.timeout);
  }

  let executable = argv[0];
  if (currentPlatform === "win32" && executable === "npm") {
    executable = "npm.cmd";
  }
  const args = argv.slice(1);
  const requiresShell = currentPlatform === "win32" && /\.(cmd|bat)$/i.test(executable);

  const wrapperMessage = "Failed to get Ado Pat from AzureAuth";

  try {
    let result;
    try {
      // The Windows shell fallback only applies to the internally constructed
      // `npm.cmd` launcher path. Keep the argv-based path everywhere else.
      result = requiresShell
        ? spawnSync(buildWindowsShellCommand(executable, args), {
            encoding: "utf-8",
            env,
            shell: true,
          })
        : spawnSync(executable, args, {
            encoding: "utf-8",
            env,
            shell: false,
          });

      if (result.error) {
        throw result.error;
      }

      if (result.status !== 0 || (result.stderr && !result.stdout)) {
        throw new Error(
          `Azure Auth failed with exit code ${result.status}: ${result.stderr}`,
        );
      }
    } catch (error: any) {
      throw new Error(`${wrapperMessage}: ${error.message}`);
    }

    if (options.output === "json") {
      try {
        return JSON.parse(result.stdout) as AdoPatResponse;
      } catch {
        throw new Error(`Failed to parse JSON output: ${result.stdout}`);
      }
    }

    return result.stdout;
  } catch (error: any) {
    if (!(await isAzureAuthInstalled())) {
      throw new Error(`AzureAuth is not installed: ${error}`);
    }

    throw new Error(error.message);
  }
};
