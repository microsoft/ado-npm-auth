import { arch, platform } from "os";
import { isWsl } from "../utils/is-wsl.js";

/**
 * Determines if the currently running platform is supported by azureauth. Currently, supported platforms are Windows, Mac & WSL
 * @returns { boolean } if the current platform is supported by azureauth
 */
export const isSupportedPlatformAndArchitecture = (): boolean => {
  const supportedPlatformsAndArchitectures: Record<string, string[]> = {
    win32: ["x64"],
    linux: ["x64", "arm64"],
    darwin: ["x64", "arm64"],
  };

  return (
    isWsl() ||
    (supportedPlatformsAndArchitectures[platform()] &&
      supportedPlatformsAndArchitectures[platform()].includes(arch()))
  );
};
