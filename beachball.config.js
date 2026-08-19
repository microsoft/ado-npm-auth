// @ts-check
/** @type {import("beachball").BeachballConfig} */
const config = {
  changehint: 'Run "yarn change" to generate a change file',
  branch: "main",
  // The current publishing setup skips the step that creates git tags, so make it explicit that they're not created
  gitTags: false,
  groupChanges: true,
  ignorePatterns: ["**/*.test.ts"],
  disallowedChangeTypes: [
    "prerelease",
    // If a major release is needed, temporarily remove this line.
    "major"
  ]
};
module.exports = config;