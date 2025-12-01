export const AZURE_AUTH_VERSION = "0.8.4";

export const PLATFORM_PACKAGES: Record<string, Record<string, string>> = {
  darwin: {
    arm64: "@azureauth/darwin-arm64",
    x64: "@azureauth/darwin-x64",
  },
  win32: {
    x64: "@azureauth/win32-x64",
  },
};
