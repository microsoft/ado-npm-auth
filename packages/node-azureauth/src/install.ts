import path from "node:path";
import fs from "node:fs";
import { execSync } from "node:child_process";

import { DownloaderHelper } from "node-downloader-helper";
import decompress from "decompress";

const AZURE_AUTH_VERSION = "0.8.4";

async function download(url: string, saveDirectory: string): Promise<void> {
  const downloader = new DownloaderHelper(url, saveDirectory);
  return new Promise((resolve, reject) => {
    downloader.on("end", () => resolve());
    downloader.on("error", (err) => reject(err));
    downloader.on("progress.throttled", (downloadEvents) => {
      const percentageComplete =
        downloadEvents.progress < 100
          ? downloadEvents.progress.toPrecision(2)
          : 100;
      console.info(`Downloaded: ${percentageComplete}%`);
    });
    downloader.start();
  });
}

async function extractDeb(debPath: string, outputDir: string): Promise<void> {
  const tempDir = path.join(outputDir, "temp_deb_extract");
  fs.mkdirSync(tempDir, { recursive: true });

  try {
    // Copy .deb to temp directory
    const debInTemp = path.join(tempDir, path.basename(debPath));
    fs.copyFileSync(debPath, debInTemp);

    // Extract the .deb file (which is an ar archive) in temp directory
    execSync(`ar x ${path.basename(debPath)}`, {
      cwd: tempDir,
      stdio: "inherit",
    });

    // Find and extract the data.tar.* file
    const files = fs.readdirSync(tempDir);
    const dataTar = files.find((f) => f.startsWith("data.tar"));

    if (!dataTar) {
      throw new Error("data.tar.* not found in .deb archive");
    }

    // Extract data.tar.* to a temp extract directory
    const extractDir = path.join(tempDir, "extract");
    fs.mkdirSync(extractDir, { recursive: true });

    execSync(`tar -xf ${dataTar} -C ${extractDir}`, {
      cwd: tempDir,
      stdio: "inherit",
    });

    // Move all files from usr/lib/azureauth to the root of outputDir
    const sourceDir = path.join(extractDir, "usr", "lib", "azureauth");

    if (fs.existsSync(sourceDir)) {
      // Recursively copy all files and directories
      const copyRecursive = (src: string, dest: string) => {
        const stats = fs.statSync(src);
        if (stats.isDirectory()) {
          if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
          }
          const entries = fs.readdirSync(src);
          for (const entry of entries) {
            copyRecursive(path.join(src, entry), path.join(dest, entry));
          }
        } else {
          fs.copyFileSync(src, dest);
          // Make executable files executable
          if (path.basename(src) === "azureauth" || stats.mode & fs.constants.S_IXUSR) {
            fs.chmodSync(dest, 0o755);
          }
        }
      };

      const entries = fs.readdirSync(sourceDir);
      for (const entry of entries) {
        copyRecursive(path.join(sourceDir, entry), path.join(outputDir, entry));
      }
    }
  } finally {
    // Clean up temp directory
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

const platform = process.platform;
const arch = process.arch;

const AZUREAUTH_INFO = {
  name: "azureauth",
  // https://github.com/AzureAD/microsoft-authentication-cli/releases/download/${AZUREAUTH_INFO.version}/azureauth-${AZUREAUTH_INFO.version}-osx-arm64.tar.gz
  // https://github.com/AzureAD/microsoft-authentication-cli/releases/download/${AZUREAUTH_INFO.version}/azureauth-${AZUREAUTH_INFO.version}-osx-x64.tar.gz
  // https://github.com/AzureAD/microsoft-authentication-cli/releases/download/${AZUREAUTH_INFO.version}/azureauth-${AZUREAUTH_INFO.version}-win10-x64.zip
  url: "https://github.com/AzureAD/microsoft-authentication-cli/releases/download/",
  version: AZURE_AUTH_VERSION,
};

const AZUREAUTH_NAME_MAP: any = {
  def: "azureauth",
  win32: "azureauth.exe",
  linux: "azureauth",
};

export const AZUREAUTH_NAME =
  platform in AZUREAUTH_NAME_MAP
    ? AZUREAUTH_NAME_MAP[platform]
    : AZUREAUTH_NAME_MAP.def;

export const install = async () => {
  const OUTPUT_DIR = path.join(__dirname, "..", "bin");
  const fileExist = (pathToCheck: string) => {
    try {
      return fs.existsSync(pathToCheck);
    } catch (err) {
      return false;
    }
  };

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.info(`${OUTPUT_DIR} directory was created`);
  }

  if (fileExist(path.join(OUTPUT_DIR, "azureauth", AZUREAUTH_NAME))) {
    console.log("azureauth is already installed");
    return;
  }
  // if platform is missing, download source instead of executable
  const DOWNLOAD_MAP: any = {
    win32: {
      x64: `azureauth-${AZUREAUTH_INFO.version}-win10-x64.zip`,
    },
    darwin: {
      x64: `azureauth-${AZUREAUTH_INFO.version}-osx-x64.tar.gz`,
      arm64: `azureauth-${AZUREAUTH_INFO.version}-osx-arm64.tar.gz`,
    },
    linux: {
      x64: `azureauth-${AZUREAUTH_INFO.version}-linux-x64.deb`,
      arm64: `azureauth-${AZUREAUTH_INFO.version}-linux-arm64.deb`,
    },
  };
  if (platform in DOWNLOAD_MAP) {
    // download the executable
    let filename = "";
    if (arch in DOWNLOAD_MAP[platform]) {
      filename = DOWNLOAD_MAP[platform][arch];
    } else {
      throw new Error("Arch is not supported in azureauth");
    }
    const url = `${AZUREAUTH_INFO.url}${AZUREAUTH_INFO.version}/${filename}`;
    const distPath = path.join(OUTPUT_DIR, "azureauth");
    const archivePath = path.join(OUTPUT_DIR, filename);

    console.log(`Downloading azureauth from ${url}`);
    try {
      await download(url, OUTPUT_DIR);
    } catch (err: any) {
      throw new Error(`Download failed: ${err.message}`);
    }
    console.log(`Downloaded in ${OUTPUT_DIR}`);

    // Make a dir to uncompress the zip or tar into
    fs.mkdirSync(distPath, {
      recursive: true,
    });

    const binaryPath = path.join(distPath, AZUREAUTH_NAME);

    // Handle .deb files differently from .zip and .tar.gz
    if (filename.endsWith(".deb")) {
      await extractDeb(archivePath, distPath);
    } else {
      await decompress(archivePath, distPath);
    }

    if (fileExist(binaryPath)) {
      fs.chmodSync(binaryPath, fs.constants.S_IXUSR || 0o100);
      // Huan(202111): we need the read permission so that the build system can pack the node_modules/ folder,
      // i.e. build with Heroku CI/CD, docker build, etc.
      fs.chmodSync(binaryPath, 0o755);
    }

    console.log(`Extracted in ${archivePath}`);
    fs.unlinkSync(archivePath);
  }
};

async function retryLoop() {
  const MAX_RETRIES = 3;
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      await install();
      break; // success, so exit the loop
    } catch (err: any) {
      console.log(`Install failed: ${err.message}`);
    }
    if (i === MAX_RETRIES - 1) {
      throw new Error(`Install failed after ${MAX_RETRIES} attempts`);
    }
  }
}

retryLoop().catch((err) => {
  console.error(err);
  process.exit(1);
});
