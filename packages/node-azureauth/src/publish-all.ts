#!/usr/bin/env node

/**
 * Publish script for azureauth packages.
 *
 * Usage:
 *   node dist/publish-all.cjs [--dry-run]
 *
 * This script:
 * 1. Downloads and packages platform-specific binaries
 * 2. Publishes platform packages to npm
 * 3. Adds optionalDependencies to main package
 * 4. Publishes main package to npm
 *
 * Prerequisites:
 * - Must be logged in to npm (`npm login`)
 * - Must have publish access to @azureauth scope
 */

import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { createWriteStream } from "node:fs";
import { execSync } from "node:child_process";

import { AZURE_AUTH_VERSION } from "./install.js";

// When bundled to CJS, __dirname is available
const PACKAGES_DIR = path.resolve(__dirname, "..", "..");
const MAIN_PACKAGE_DIR = path.resolve(__dirname, "..");

const DRY_RUN = process.argv.includes("--dry-run");

const GITHUB_RELEASE_URL = `https://github.com/AzureAD/microsoft-authentication-cli/releases/download/${AZURE_AUTH_VERSION}`;

interface PlatformConfig {
  package: string;
  archive: string;
  binary: string;
}

const PLATFORMS: PlatformConfig[] = [
  {
    package: "azureauth-darwin-arm64",
    archive: `azureauth-${AZURE_AUTH_VERSION}-osx-arm64.tar.gz`,
    binary: "azureauth",
  },
  {
    package: "azureauth-darwin-x64",
    archive: `azureauth-${AZURE_AUTH_VERSION}-osx-x64.tar.gz`,
    binary: "azureauth",
  },
  {
    package: "azureauth-win32-x64",
    archive: `azureauth-${AZURE_AUTH_VERSION}-win10-x64.zip`,
    binary: "azureauth.exe",
  },
];

async function downloadFile(url: string, destPath: string): Promise<void> {
  console.log(`  Downloading ${url}...`);
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok) {
    throw new Error(
      `Failed to download ${url}: ${response.status} ${response.statusText}`,
    );
  }
  // Convert web stream to Node.js stream
  const nodeStream = Readable.fromWeb(response.body as any);
  await pipeline(nodeStream, createWriteStream(destPath));
}

function extractArchive(archivePath: string, destDir: string): void {
  if (archivePath.endsWith(".tar.gz")) {
    execSync(`tar -xzf "${archivePath}" -C "${destDir}"`, { stdio: "inherit" });
  } else if (archivePath.endsWith(".zip")) {
    execSync(`unzip -o "${archivePath}" -d "${destDir}"`, { stdio: "inherit" });
  }
}

async function packagePlatform(platformConfig: PlatformConfig): Promise<void> {
  const { package: packageName, archive, binary } = platformConfig;
  const packageDir = path.join(PACKAGES_DIR, packageName);
  const binDir = path.join(packageDir, "bin");
  const archivePath = path.join(packageDir, archive);
  const binaryPath = path.join(binDir, binary);

  // Skip if binary already exists
  if (fs.existsSync(binaryPath)) {
    console.log(`  Binary already exists at ${binaryPath}`);
    return;
  }

  // Create bin directory
  if (!fs.existsSync(binDir)) {
    fs.mkdirSync(binDir, { recursive: true });
  }

  // Download and extract
  const url = `${GITHUB_RELEASE_URL}/${archive}`;
  await downloadFile(url, archivePath);
  extractArchive(archivePath, binDir);

  // Set permissions and cleanup
  if (binary === "azureauth") {
    fs.chmodSync(binaryPath, 0o755);
  }
  fs.unlinkSync(archivePath);

  if (!fs.existsSync(binaryPath)) {
    throw new Error(`Binary not found at ${binaryPath}`);
  }
}

function npmPublish(packageDir: string, isScoped: boolean = false): void {
  const args = ["publish"];
  if (isScoped) args.push("--access", "public");
  if (DRY_RUN) args.push("--dry-run");

  console.log(`  Running: npm ${args.join(" ")} in ${packageDir}`);
  execSync(`npm ${args.join(" ")}`, { cwd: packageDir, stdio: "inherit" });
}

async function main(): Promise<void> {
  console.log("=".repeat(60));
  console.log("Azureauth Publish Script");
  console.log("=".repeat(60));
  console.log(`Binary version: ${AZURE_AUTH_VERSION}`);
  console.log(`Dry run: ${DRY_RUN}`);
  console.log();

  // Step 1: Package binaries
  console.log("Step 1: Packaging platform binaries...");
  for (const platform of PLATFORMS) {
    console.log(`\n[${platform.package}]`);
    await packagePlatform(platform);
  }

  // Step 2: Publish platform packages
  console.log("\n" + "=".repeat(60));
  console.log("Step 2: Publishing platform packages...");
  for (const platform of PLATFORMS) {
    const packageDir = path.join(PACKAGES_DIR, platform.package);
    console.log(`\n[${platform.package}]`);
    npmPublish(packageDir, true);
  }

  // Step 3: Update main package with optionalDependencies
  console.log("\n" + "=".repeat(60));
  console.log("Step 3: Updating main package...");
  const mainPkgPath = path.join(MAIN_PACKAGE_DIR, "package.json");
  const mainPkg = JSON.parse(fs.readFileSync(mainPkgPath, "utf-8"));

  mainPkg.optionalDependencies = {
    "@azureauth/darwin-arm64": AZURE_AUTH_VERSION,
    "@azureauth/darwin-x64": AZURE_AUTH_VERSION,
    "@azureauth/win32-x64": AZURE_AUTH_VERSION,
  };

  fs.writeFileSync(mainPkgPath, JSON.stringify(mainPkg, null, 2) + "\n");
  console.log("  Added optionalDependencies to package.json");

  // Step 4: Publish main package
  console.log("\n" + "=".repeat(60));
  console.log("Step 4: Publishing main package...");
  npmPublish(MAIN_PACKAGE_DIR, false);

  // Step 5: Cleanup (remove optionalDependencies for development)
  console.log("\n" + "=".repeat(60));
  console.log("Step 5: Cleaning up...");
  delete mainPkg.optionalDependencies;
  fs.writeFileSync(mainPkgPath, JSON.stringify(mainPkg, null, 2) + "\n");
  console.log(
    "  Removed optionalDependencies from package.json (for development)",
  );

  console.log("\n" + "=".repeat(60));
  console.log("Done!");
  if (DRY_RUN) {
    console.log(
      "\nThis was a dry run. Run without --dry-run to actually publish.",
    );
  }
}

main().catch((err) => {
  console.error("\nError:", err.message);
  process.exit(1);
});
