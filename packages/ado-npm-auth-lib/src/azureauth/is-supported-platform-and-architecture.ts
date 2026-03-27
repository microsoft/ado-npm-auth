import { arch, platform } from "node:os";

/**
 * Determines if the currently running platform is supported by azureauth. Currently, supported platforms are Windows, Mac & Linux (includes WSL)
 * @returns { boolean } if the current platform is supported by azureauth
 */
export const isSupportedPlatformAndArchitecture = (): boolean => {
  const supportedPlatformsAndArchitectures: Record<string, string[]> = {
    win32: ["x64"],
    darwin: ["x64", "arm64"],
    linux: ["x64", "arm64"],
  };

  return (
    supportedPlatformsAndArchitectures[platform()] !== undefined &&
    supportedPlatformsAndArchitectures[platform()].includes(arch())
  );
};
