import { adoPat } from "../lib/index.js";

const name = "feed-name";

const pat = await adoPat({
  promptHint: `${name} .npmrc PAT`,
  organization: "your-organization-name-here",
  displayName: `${name}-npmrc-pat`,
  scope: ["vso.packaging"],
  timeout: "30",
  output: "json",
});

console.log(pat);