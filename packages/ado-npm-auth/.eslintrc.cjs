module.exports = {
  extends: [],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    tsconfigRootDir: __dirname,
    sourceType: "module",
    project: "./tsconfig.json",
  },
  overrides: [require("./overrides.json")],
};
