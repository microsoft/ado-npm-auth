import type { RequestOptions } from "https";
import https from "https";
import fs from "fs";
import path from "path";

const defaultOptions: RequestOptions = {
  port: 443,
  method: "GET",
};

/**
 *
 * @param {import("http").RequestOptions} options
 * @returns
 */
export const makeRequest = async (options: RequestOptions) => {
  return new Promise((resolve, reject) => {
    const mergedOptions = {
      ...defaultOptions,
      ...options,
    };

    const req = https.request(mergedOptions, (res) => {
      let data = "";
      let dataJson = {};
      const ok = res.statusCode === 200;

      res.on("data", (d) => {
        data += d;
      });

      res.on("end", () => {
        if (data && mergedOptions?.headers?.Accept === "application/json") {
          dataJson = JSON.parse(data.toString().trim());
        }

        if (ok) {
          resolve(dataJson || data);
        } else {
          if (dataJson) {
            dataJson = { ...dataJson, statusCode: res.statusCode };
          }
          reject(
            dataJson || data || new Error(`Error code: ${res.statusCode}.`),
          );
        }
      });

      res.on("error", (/** @type {string} */ error) => {
        reject(new Error(error as any));
      });
    });

    req.end();
  });
};

/**
 * Downloads a file from a URL to a local path.
 * @param url The URL of the file to download.
 * @param downloadPath The local path to save the downloaded file.
 * @returns A promise that resolves when the download is complete.
 */
export async function downloadFile(
  url: string,
  downloadPath: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        // Handle redirects
        if (response.statusCode === 301 || response.statusCode === 302) {
          const redirectUrl = response.headers.location;
          if (redirectUrl) {
            downloadFile(redirectUrl, downloadPath).then(resolve).catch(reject);
            return;
          } else {
            reject(new Error("Redirect without location header"));
            return;
          }
        }

        // Check for successful response
        if (response.statusCode !== 200) {
          reject(
            new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`),
          );
          return;
        }

        let downloadStream: fs.WriteStream;
        try {
          const downloadDir = path.dirname(downloadPath);
          if (!fs.existsSync(downloadDir)) {
            fs.mkdirSync(downloadDir, { recursive: true });
          }

          downloadStream = fs.createWriteStream(downloadPath);
        } catch (error) {
          reject(error);
          return;
        }

        // Handle stream errors
        downloadStream.on("error", (error) => {
          reject(error);
        });

        // Pipe the response to the file stream
        response.pipe(downloadStream);

        // The whole response has been received and written
        downloadStream.on("finish", () => {
          resolve();
        });
      })
      .on("error", (error) => {
        reject(error); // Reject on request error
      });
  });
}
