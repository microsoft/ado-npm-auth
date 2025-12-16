export const AZURE_AUTH_VERSION = "0.8.4";

export const PLATFORM_PACKAGES: Record<string, Record<string, string>> = {
  darwin: {
    arm64: "@microsoft/azureauth-darwin-arm64",
    x64: "@microsoft/azureauth-darwin-x64",
  },
  win32: {
    x64: "@microsoft/azureauth-win32-x64",
  },
};
