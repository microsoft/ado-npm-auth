#!/usr/bin/env node
import path from "node:path";
import process from "node:process";
import { execa } from "execa";

let azureauth = path.join(__dirname, "..", "bin", "azureauth", "azureauth");

if (process.platform === "win32") {
  azureauth = azureauth + ".exe";
}

execa(azureauth, process.argv.slice(2), { stdio: "inherit" });
