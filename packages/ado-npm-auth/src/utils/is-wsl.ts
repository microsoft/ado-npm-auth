import { release, platform } from "os";

/**
 * Determine if the current machine's platform is WSL
 * @returns { boolean } if the current platform is WSL
 */
export const isWsl = () => {
  return platform() === "linux" && release().toLowerCase().includes("wsl");
};
