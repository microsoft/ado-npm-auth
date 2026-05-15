import os from "node:os";
import fs from "node:fs";
import path from "node:path";
import { downloadFile } from "../utils/request.js";
import { execProcess } from "../utils/exec.js";

const CredentialProviderVersion = "1.4.1";
const OutputDir = path.resolve(
  "..",
  ".bin",
  "CredentialProvider.Microsoft",
  "v" + CredentialProviderVersion,
);

type CredentialProviderResponse = {
  Username: string;
  Password: string;
};

export async function credentialProviderPat(
  registry: string,
): Promise<CredentialProviderResponse> {
  const nugetFeedUrl = toNugetUrl(registry);
  const toolPath = await getCredentialProvider();
  return await invokeCredentialProvider(toolPath, nugetFeedUrl);
}

function toNugetUrl(registry: string): string {
  // Yarn 4 normalizes registry URLs by stripping the trailing slash before
  // invoking auth hooks, so accept the URL with or without it.
  const normalized = registry.endsWith("/") ? registry : registry + "/";
  if (!normalized.endsWith("/npm/registry/")) {
    throw new Error(
      `Registry URL ${registry} is not a valid Azure Artifacts npm registry URL. Expected it to end with '/npm/registry/'`,
    );
  }
  const nugetPath = normalized.replace(
    "/npm/registry/",
    "/nuget/v3/index.json",
  );
  // Tolerate scheme-less inputs (e.g. older callers) by prepending https://
  // when no scheme is present. Yarn 4 always supplies a scheme, but the
  // function signature accepts any string.
  return /^[a-z]+:\/\//i.test(nugetPath) ? nugetPath : "https://" + nugetPath;
}

async function invokeCredentialProvider(
  toolPath: string,
  nugetFeedUrl: string,
): Promise<CredentialProviderResponse> {
  let response = "";
  await execProcess(toolPath, ["-U", nugetFeedUrl, "-I", "-F", "Json"], {
    stdio: "pipe",
    processStdOut: (data: string) => {
      response += data;
    },
    processStdErr: (data: string) => {
      console.error(data);
    },
  });
  try {
    const value = JSON.parse(response);
    return value as CredentialProviderResponse;
  } catch {
    throw new Error(`Failed to parse CredentialProvider output: ${response}`);
  }
}

function tryFileExists(executable: string): string | undefined {
  if (fs.existsSync(executable)) {
    return executable;
  } else if (fs.existsSync(executable + ".exe")) {
    return executable + ".exe";
  }
  return undefined;
}

async function getCredentialProvider(): Promise<string> {
  let toolPath = tryFileExists(
    path.join(
      os.homedir(),
      ".nuget",
      "plugins",
      "netcore",
      "CredentialProvider.Microsoft",
      "CredentialProvider.Microsoft",
    ),
  );
  if (toolPath) {
    return toolPath;
  }

  const downloadedFilePath = path.join(
    OutputDir,
    "plugins",
    "netcore",
    "CredentialProvider.Microsoft",
    "CredentialProvider.Microsoft",
  );
  toolPath = tryFileExists(downloadedFilePath);
  if (toolPath) {
    return toolPath;
  }

  await downloadCredentialProvider();
  toolPath = tryFileExists(downloadedFilePath);
  if (toolPath) {
    fs.chmodSync(toolPath, 0o755);
  } else {
    throw new Error(
      `CredentialProvider was not found at expected path after download: ${toolPath}`,
    );
  }

  return toolPath;
}

async function downloadCredentialProvider(): Promise<void> {
  const downloadUrl = `https://github.com/microsoft/artifacts-credprovider/releases/download/v${CredentialProviderVersion}/Microsoft.Net8.${os.platform()}-${os.arch()}.NuGet.CredentialProvider.tar.gz`;
  const downloadPath = path.join(
    OutputDir,
    "CredentialProvider.Microsoft.tar.gz",
  );

  console.log(`🌐 Downloading ${downloadUrl}`);
  await downloadFile(downloadUrl, downloadPath);
  await execProcess("tar", ["-xzf", downloadPath, "-C", OutputDir], {
    stdio: "inherit",
  });
}
