import sdl from "@microsoft/eslint-plugin-sdl";
import rnx from "@rnx-kit/eslint-plugin";

// eslint-disable-next-line no-restricted-exports
export default [
  {
    ignores: ["lib/**", "dist/**", "node_modules/**"],
  },
  ...sdl.configs.common,
  ...sdl.configs.node,
  ...rnx.configs.strict,
  ...rnx.configs.stylistic,
  {
    rules: {
      // types are a preferred way to define object shapes
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
    },
  },
];
