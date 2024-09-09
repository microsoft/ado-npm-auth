import path from "node:path";
import process from "node:process";

export const azureAuthCommand = () => {
  let azureauth = path.join(__dirname, "..", "bin", "azureauth", "azureauth");

  if (process.platform === "win32") {
    azureauth = azureauth + ".exe";
  }

  return azureauth;
};
