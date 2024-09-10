const path = require("node:path");
const fs = require("node:fs");

const installScript = path.join(__dirname, "dist", "install.js");
if (fs.existsSync(installScript)) {
  require(installScript);
} else {
  console.log(`Skipping downloading of azureauth tool. This package is incomplete.`);
}