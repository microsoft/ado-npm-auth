import { exec } from "../utils/exec.js";
import { azureAuthCommand } from "./azureauth-command.js";

let memo: boolean | undefined = undefined;

export const clearMemo = () => {
  memo = void 0;
};

/**
 * Determine if a valid version (>=0.8.0.0) is installed
 * @returns { boolean } Whether a valid version of azureauth is installed
 */
export const isAzureAuthInstalled = async (): Promise<boolean> => {
  if (memo === undefined) {
    const { command: authCommand, env } = azureAuthCommand();
    const command = `${authCommand.join(" ")} --version`;

    try {
      const result = await exec(command, { env });
      // version must be >=0.8.0.0
      const [, minor] = result.stdout.split(".");
      memo = parseInt(minor) >= 8;
    } catch {
      // azureauth not installed
      memo = false;
    }
  }

  return memo;
};
