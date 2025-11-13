// @ts-check
/** @type {import("beachball").BeachballConfig} */
const config = {
  changehint: 'Run "yarn change" to generate a change file',
  branch: "main",
  groupChanges: true,
  ignorePatterns: ["**/*.test.ts"],
  disallowedChangeTypes: [
    "prerelease",
    // If a major release is needed, temporarily remove this line.
    "major"
  ]
};
module.exports = config;