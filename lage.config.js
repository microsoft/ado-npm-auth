// @ts-check

/** @typedef {import('lage').ConfigOptions} ConfigOptions */
/** @typedef {import('lage').CacheOptions} CacheOptions */

/**
 * Lage config (the types are slightly incorrect about what's required/optional)
 * @type {Partial<Omit<ConfigOptions, 'cacheOptions'>> & { cacheOptions?: Partial<CacheOptions> }}
 */
const config = {
  npmClient: "yarn",
  pipeline: {
    build: {
      dependsOn: ["^build"],
      outputs: ["lib/**/*"],
    },
    bundle: {
      dependsOn: ["build"],
      outputs: ["dist/**/*"],
    },
    test: ["build"],
    // This task only exists at the repo root. Remap it to format:check in remote builds.
    "@microsoft/ado-npm-auth-repo#format": {
      cache: false,
      type: "npmScript",
      options: {
        script:
          process.env.CI || process.env.TF_BUILD ? "format:check" : "format",
      },
    },
    // The root @microsoft/ado-npm-auth-repo can only be referenced in the lage graph because
    // package.json "workspaces" includes ".". However, this means that to prevent cycles,
    // it's necessary to mark root scripts (like "build": "lage build") as noops.
    lint: ["build", "@microsoft/ado-npm-auth-repo#format"],
    "@microsoft/ado-npm-auth-repo#build": { type: "noop" },
    "@microsoft/ado-npm-auth-repo#bundle": { type: "noop" },
    "@microsoft/ado-npm-auth-repo#lint": { type: "noop" },
    "@microsoft/ado-npm-auth-repo#test": { type: "noop" },
  },

  cacheOptions: {
    // These are relative to the git root, and affects the hash of the cache
    // Any of these file changes will invalidate cache
    environmentGlob: [
      // Folder globs MUST end with **/* to include all files!
      "!.yarn/**/*",
      "!node_modules/**/*",
      "!**/node_modules/**/*",
      "lage.config.js",
      "*.json",
      ".yarnrc.yml",
      "yarn.lock",
    ],

    // Subset of files in package directories that will be saved into the cache.
    // (set per target instead)
    outputGlob: [],
  },
};

module.exports = config;
