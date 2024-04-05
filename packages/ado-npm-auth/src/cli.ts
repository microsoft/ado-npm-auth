import { isSupportedPlatformAndArchitecture } from "./azureauth/is-supported-platform-and-architecture.js";
import { isCodespaces } from "./utils/is-codespaces.js";
import { logTelemetry } from "./telemetry/index.js";
import { arch, platform } from "os";
import { isValidPat } from "./npmrc/is-valid-pat.js";
import { setNpmrcPat } from "./npmrc/set-npmrc-pat.js";

export const run = async (): Promise<null | boolean> => {
  const doValidCheck = !process.argv.includes("--skip-check");
  const skipAuth = process.argv.includes("--skip-auth");
  
  if (doValidCheck && (await isValidPat())) {
    return null;
  }

  if (skipAuth && !(await isValidPat())) {
    logTelemetry(
      { success: false, automaticSuccess: false, error: "invalid token" },
      true
    );
    console.log(
      "❌ Your token is invalid."
    );
    return false;
  }

  try {
    console.log("🔑 Authenticating to package feed...")
    await setNpmrcPat();
    return true;
  } catch (error) {
    logTelemetry(
      {
        success: false,
        automaticSuccess: false,
        error: (error as Error).message,
      },
      true
    );
    console.log("Encountered error while performing auth", error);
    return false;
  }
};

if (isCodespaces()) {
  // ignore codespaces setups
  process.exit(0);
}

if (!isSupportedPlatformAndArchitecture()) {
  const errorMessage = `Platform ${platform()} and architecture ${arch()} not supported for automatic authentication.`;
  console.log(errorMessage);
  logTelemetry({ success: false, error: errorMessage }, true);
  process.exit(0);
}

const result = await run();

if (result === null) {
  // current auth is valid, do nothing
  logTelemetry({ success: true });
  console.log("✅ Current authentication is valid");
} else if (result) {
  // automatic auth was performed
  // advertise success
  logTelemetry({ success: true, automaticSuccess: true });
  console.log("✅ Automatic authentication successful");
} else {
  // automatic auth failed (for some reason)
  // advertise failure and link wiki to fix
  console.log(
    "❌ Authentication to package feed failed."
  );

  process.exitCode = 1;
}
