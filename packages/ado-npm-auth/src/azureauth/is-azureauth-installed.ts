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
    const command = `${azureAuthCommand().join(" ")} --version`;

    try {
      const result = await exec(command);
      const lines = result.stdout.split('\n');
      let resultLine = null;
      for (let line of lines) {
        line = line.trim();
        if (line.length > 0 && line[0] !== '>') {
          resultLine = line;
          break;
        }
      }

      if (resultLine) {
        // version must be >=0.8.0.0
        const [, minor] = resultLine.split(".");
        memo = parseInt(minor) >= 8;
      } else {
        memo = false;
      }
    } catch (error) {
      // azureauth not installed
      memo = false;
    }
  }

  return memo;
};
