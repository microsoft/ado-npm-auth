import { isWsl } from "../utils/is-wsl.js";

let memo: string[] | undefined = undefined;

/**
 * Get the executable path of azureauth command
 * @returns { string } the string of the executable command to run azureauth
 */
export const npxAzureAuthCommand: string[] = [
  "npm",
  "exec",
  "--yes",
  "azureauth",
  "--",
];
export const azureAuthCommand = () => {
  if (!memo) {
    memo = isWsl() ? ["azureauth.exe"] : npxAzureAuthCommand;
  }

  return memo;
};
