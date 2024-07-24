import https, { RequestOptions } from "https";

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
      let ok = res.statusCode === 200;

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
