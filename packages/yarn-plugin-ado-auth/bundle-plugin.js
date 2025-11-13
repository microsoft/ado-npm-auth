import { getDynamicLibs } from "@yarnpkg/cli";
import esbuild from "esbuild";
import fs from "node:fs";

const name = "yarn-plugin-ado-auth";
const bundleName = `${name}.cjs`;

/**
 * Options to configure the esbuild bundler to produce a yarn4 compatible plugin bundle
 * @type {import('esbuild').BuildOptions}
 */
const bundleOptions = {
  entryPoints: ["src/plugin.ts"],
  outfile: `dist/${bundleName}`,
  bundle: true,
  sourcemap: true,
  minify: false,
  tsconfig: "./tsconfig.json",
  charset: "utf8",
  legalComments: "linked", // Separate file .LEGAL.txt is generated
  target: "node22",
  resolveExtensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
  globalName: "plugin",
  platform: "node",
  format: "iife",
  banner: {
    js: [
      "/* eslint-disable */",
      "//prettier-ignore",
      "module.exports = {",
      `name: ${JSON.stringify(name)},`,
      "factory: function (require) {",
    ].join("\n"),
  },
  footer: {
    js: ["return plugin;", "}", "};"].join("\n"),
  },
  external: [...getDynamicLibs().keys()],
  supported: {
    /*
    Yarn plugin-runtime did not support builtin modules prefixed with "node:".
    See https://github.com/yarnpkg/berry/pull/5997
    As a solution, and for backwards compatibility, esbuild should strip these prefixes.
    */
    "node-colon-prefix-import": false,
    "node-colon-prefix-require": false,
  },
};

const startTime = performance.now();
await esbuild.build(bundleOptions).then((result) => {
  const timeTaken = ((performance.now() - startTime) / 1000).toFixed(2);
  const sizeKb = Math.round(fs.statSync(`dist/${bundleName}`).size / 1024);
  console.log(
    `Bundled: dist/${bundleName} (size ${sizeKb} kb) in ${timeTaken}s)`,
  );
});
