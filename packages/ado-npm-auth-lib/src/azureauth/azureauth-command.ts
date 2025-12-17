import { isWsl } from "../utils/is-wsl.js";

let memo: string[] | undefined = undefined;

export const clearMemo = () => {
  memo = void 0;
};

const npxAzureAuthCommand: string[] = [
  "npm",
  "exec",
  "--silent",
  "--yes",
  "azureauth",
  "--",
];
const npxEnv = {
  ...process.env,
  // Use the version from the public registry to avoid a cycle
  npm_config_registry: "https://registry.npmjs.org",
};

/**
 * Get the executable path of azureauth command
 * @returns the string of the executable command to run azureauth, and any
 * necessary environment variables if using npx
 */
export const azureAuthCommand = (): {
  command: string[];
  env: Record<string, string>;
} => {
  if (!memo) {
    memo = isWsl() ? ["azureauth.exe"] : npxAzureAuthCommand;
  }

  return { command: memo, env: npxEnv };
};
