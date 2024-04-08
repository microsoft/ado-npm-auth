import { execa } from "execa";
import { azureAuthCommand } from "./azureAuthCommand.js";

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

export const args = (options: AdoPatOptions) => {
  const args = [
    "ado",
    "pat",
    `--prompt-hint "${options.promptHint}"`,
    `--organization "${options.organization}"`,
    `--display-name "${options.displayName}"`,
    ...options.scope.map((scope) => `--scope ${scope}`),
  ];

  if (options.output) {
    args.push(`--output ${options.output}`);
  } else {
    args.push(`--output json`);
  }

  if (options.mode) {
    args.push(`--mode "${options.mode}"`);
  }

  if (options.domain) {
    args.push(`--domain "${options.domain}"`);
  }

  if (options.timeout) {
    args.push(`--timeout ${options.timeout}`);
  }

  return args;
};

/**
 * Wrapper for `azureauth ado pat`. Please run `azureauth ado pat --help` for full command options and description
 * @param options Options for PAT generation
 * @returns ADO PAT details
 */
export const run = async (
  options: AdoPatOptions,
): Promise<AdoPatResponse | string> => {
  const commandArgs = args(options);

  try {
    const result = await execa(azureAuthCommand(), commandArgs);

    if (options.output === "json") {
      return JSON.parse(result.stdout) as AdoPatResponse;
    }

    return result.stdout;
  } catch (error: any) {
    throw new Error("Failed to get Ado Pat: " + error.message);
  }
};
