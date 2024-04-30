import { isWsl } from "../utils/is-wsl.js";

let memo: string[] | undefined = undefined;

export const clearMemo = () => {
  memo = void 0;
};

/**
 * Get the executable path of azureauth command
 * @returns { string } the string of the executable command to run azureauth
 */
export const npxAzureAuthCommand: string[] = [
  "npm",
  "exec",
  "--silent",
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
