import path from "node:path";
import process from "node:process";

const __dirname = path.dirname(new URL(import.meta.url).pathname).substring(1);

export const azureAuthCommand = () => {
  let azureauth = path.join(__dirname, "..", "bin", "azureauth", "azureauth");

  if (process.platform === "win32") {
    azureauth = azureauth + ".exe";
  }

  return azureauth;
};
