/**
 * Create a base64 encoded string from a string
 * @param {string} input
 * @returns {string}
 */
export function toBase64(input: string | undefined): string {
  return Buffer.from(input || "").toString("base64");
}

/**
 * Decode a base64 encoded string
 * @param {string} base64string
 * @returns
 */
export const fromBase64 = (base64string: string) =>
  Buffer.from(base64string, "base64").toString("utf8");
