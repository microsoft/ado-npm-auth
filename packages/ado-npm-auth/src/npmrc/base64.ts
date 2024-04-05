/**
 * Decode a base64 encoded string
 * @param {string} base64string
 * @returns
 */
export const decode = (base64string: string) =>
  Buffer.from(base64string, "base64").toString("utf8").trim();
