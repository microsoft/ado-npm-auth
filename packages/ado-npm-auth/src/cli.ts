import { isSupportedPlatformAndArchitecture } from "./azureauth/is-supported-platform-and-architecture.js";
import { isCodespaces } from "./utils/is-codespaces.js";
import { logTelemetry } from "./telemetry/index.js";
import { arch, platform } from "os";
import { Args, parseArgs, printHelp } from "./args.js";
import { NpmrcFileProvider } from "./npmrc/npmrcFileProvider.js";
import { defaultEmail, defaultUser, ValidatedFeed } from "./fileProvider.js";
import { generateNpmrcPat } from "./npmrc/generate-npmrc-pat.js";
import { partition } from "./utils/partition.js";
import { YarnRcFileProvider } from "./yarnrc/yarnrcFileProvider.js";

const fileProviders = [new NpmrcFileProvider(), new YarnRcFileProvider()];

export const run = async (args: Args): Promise<null | boolean> => {
  const validatedFeeds: ValidatedFeed[] = [];
  if (args.doValidCheck || args.skipAuth) {
    for (const fileProvider of fileProviders) {
      if (await fileProvider.isSupportedInRepo()) {
        validatedFeeds.push(...(await fileProvider.validateAllUsedFeeds()));
      }
    }
  }

  const invalidFeeds = validatedFeeds.filter((feed) => !feed.isValid);
  const invalidFeedCount = invalidFeeds.length;

  if (args.doValidCheck && invalidFeedCount == 0) {
    return null;
  }

  if (args.skipAuth && invalidFeedCount != 0) {
    logTelemetry(
      { success: false, automaticSuccess: false, error: "invalid token(s)" },
      true,
    );
    console.log(
      invalidFeedCount == 1
        ? "❌ Your token is invalid."
        : `❌ ${invalidFeedCount} tokens are invalid.`,
    );
    return false;
  }

  try {
    console.log("🔑 Authenticating to package feed...");

    const adoOrgs = new Set<string>();
    for (const adoOrg of invalidFeeds.map(
      (feed) => feed.feed.adoOrganization,
    )) {
      adoOrgs.add(adoOrg);
    }

    // get a token for each feed
    const organizationPatMap: Record<string, string> = {};
    for (const adoOrg of adoOrgs) {
      organizationPatMap[adoOrg] = await generateNpmrcPat(adoOrg, false, args.deviceCode);
    }

    // Update the pat in the invalid feeds.
    for (const invalidFeed of invalidFeeds) {
      const feed = invalidFeed.feed;

      const authToken = organizationPatMap[feed.adoOrganization];
      if (!authToken) {
        console.log(
          `❌ Failed to obtain pat for ${feed.registry} via ${invalidFeed.fileProvider.id}`,
        );
        return false;
      }
      feed.authToken = authToken;
      if (!feed.email) {
        feed.email = defaultEmail;
      }
      if (!feed.userName) {
        feed.userName = defaultUser;
      }
    }

    const invalidFeedsByProvider = partition(
      invalidFeeds,
      (feed) => feed.fileProvider,
    );
    for (const [fileProvider, updatedFeeds] of invalidFeedsByProvider) {
      await fileProvider.writeWorspaceRegistries(
        updatedFeeds.map((updatedFeed) => updatedFeed.feed),
      );
    }

    return true;
  } catch (error) {
    logTelemetry(
      {
        success: false,
        automaticSuccess: false,
        error: (error as Error).message,
      },
      true,
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

const args = parseArgs(process.argv);
if (args.help) {
  printHelp();
  process.exit(0)
}

const result = await run(args);

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
  console.log("❌ Authentication to package feed failed.");

  process.exitCode = 1;
}
