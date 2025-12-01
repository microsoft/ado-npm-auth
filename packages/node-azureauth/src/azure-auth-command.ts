import path from "node:path";
import process from "node:process";
import fs from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const PLATFORM_PACKAGES: Record<string, Record<string, string>> = {
  darwin: {
    arm64: "@azureauth/darwin-arm64",
    x64: "@azureauth/darwin-x64",
  },
  win32: {
    x64: "@azureauth/win32-x64",
  },
};

/**
 * Try to find the binary from the platform-specific optional dependency.
 * Returns the path to the binary if found, null otherwise.
 */
function getBinaryFromOptionalDep(): string | null {
  const platform = process.platform;
  const arch = process.arch;

  const packageName = PLATFORM_PACKAGES[platform]?.[arch];
  if (!packageName) {
    return null;
  }

  const binaryName = platform === "win32" ? "azureauth.exe" : "azureauth";

  try {
    // Resolve the package directory
    const packageJson = require.resolve(`${packageName}/package.json`);
    const packageDir = path.dirname(packageJson);
    const binaryPath = path.join(packageDir, "bin", binaryName);

    if (fs.existsSync(binaryPath)) {
      return binaryPath;
    }
  } catch {
    // Package not installed, fall through to return null
  }

  return null;
}

/**
 * Get the path to the azureauth binary.
 * First checks for platform-specific optional dependency,
 * then falls back to the postinstall-downloaded binary.
 */
export const azureAuthCommand = () => {
  // First, try the platform-specific optional dependency
  const optionalDepBinary = getBinaryFromOptionalDep();
  if (optionalDepBinary) {
    return optionalDepBinary;
  }

  // Fall back to the postinstall-downloaded binary
  let azureauth = path.join(__dirname, "..", "bin", "azureauth", "azureauth");

  if (process.platform === "win32") {
    azureauth = azureauth + ".exe";
  }

  return azureauth;
};

// Export for use by install.ts
export { getBinaryFromOptionalDep };
