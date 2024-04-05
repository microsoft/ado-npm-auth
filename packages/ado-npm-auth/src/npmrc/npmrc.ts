import fs from "fs";
import path from "path";

/**
 * Cross platform way to find the users' .npmrc file
 * @returns The user's npmrc from home or user profile
 */
export const getUserNPMRC = () => {
  const userHome = process.env["HOME"] || process.env["USERPROFILE"] || "";
  const userNpmRc = path.join(userHome, ".npmrc");

  return userNpmRc;
};

/**
 * Read the an .npmrc file
 * @param {Object} options
 * @param {string} options.npmrc Path to the users' .npmrc file
 * @returns
 */
export const readNpmRC = async ({ npmrc }: { npmrc: string; }) => {
  const contents = await fs.promises.readFile(npmrc, "utf8");

  return contents;
};
