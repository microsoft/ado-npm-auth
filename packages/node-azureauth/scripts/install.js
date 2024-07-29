import path from "path";
import fs from "fs";
import { DownloaderHelper } from "node-downloader-helper";
import decompress from "decompress";
import { fileURLToPath } from "url";
import { promisify } from "node:util";
import { execFile as _execFile } from "node:child_process";
const execFile = promisify(_execFile);

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const AZURE_AUTH_VERSION = "0.8.4";

async function download(url, saveDirectory) {
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

const AZUREAUTH_NAME_MAP = {
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
  const fileExist = (path) => {
    try {
      return fs.existsSync(path);
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
  const DOWNLOAD_MAP = {
    win32: {
      x64: `azureauth-${AZUREAUTH_INFO.version}-win10-x64.zip`,
    },
    darwin: {
      x64: `azureauth-${AZUREAUTH_INFO.version}-osx-x64.tar.gz`,
      arm64: `azureauth-${AZUREAUTH_INFO.version}-osx-arm64.tar.gz`,
    },
    // TODO: support linux when the binaries are available
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
    } catch (err) {
      throw new Error(`Download failed: ${err.message}`);
    }
    console.log(`Downloaded in ${OUTPUT_DIR}`);

    // Make a dir to uncompress the zip or tar into
    fs.mkdirSync(distPath, {
      recursive: true,
    });

    const binaryPath = path.join(distPath, AZUREAUTH_NAME);

    if (platform == "linux") {
      try {
        await execFile("dpkg-deb", ["--extract", archivePath, distPath])
      } catch (err) {
        fs.unlinkSync(archivePath);
        throw err;
      }
      fs.symlinkSync("usr/lib/azureauth/azureauth", binaryPath)
    } else {
      await decompress(archivePath, distPath);
    }

    if (fileExist(binaryPath)) {
      fs.chmodSync(binaryPath, fs.constants.S_IXUSR || 0o100);
      // Huan(202111): we need the read permission so that the build system can pack the node_modules/ folder,
      // i.e. build with Heroku CI/CD, docker build, etc.
      fs.chmodSync(binaryPath, 0o755);
    }

    console.log(`Unzipped in ${archivePath}`);
    fs.unlinkSync(archivePath);
  }
};

const MAX_RETRIES = 3;
for (let i = 0; i < MAX_RETRIES; i++) {
  try {
    await install();
    break; // success, so exit the loop
  } catch (err) {
    console.log(`Install failed: ${err.message}`);
  }
  if (i === MAX_RETRIES - 1) {
    throw new Error(`Install failed after ${MAX_RETRIES} attempts`);
  }
}
