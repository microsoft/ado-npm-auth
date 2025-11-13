import { isSupportedPlatformAndArchitecture } from "./azureauth/is-supported-platform-and-architecture.js";
import { isCodespaces } from "./utils/is-codespaces.js";
import { logTelemetry } from "./telemetry/index.js";
import { arch, platform } from "os";
import type { Args } from "./args.js";
import { parseArgs } from "./args.js";
import { NpmrcFileProvider } from "./npmrc/npmrcFileProvider.js";
import type { ValidatedFeed } from "./fileProvider.js";
import { defaultEmail, defaultUser } from "./fileProvider.js";
import { generateNpmrcPat } from "./npmrc/generate-npmrc-pat.js";
import { partition } from "./utils/partition.js";
import { YarnRcFileProvider } from "./yarnrc/yarnrcFileProvider.js";

export const run = async (args: Args): Promise<null | boolean> => {
  const fileProviders = [
    new NpmrcFileProvider(args.configFile),
    new YarnRcFileProvider(args.configFile),
  ];

  const validatedFeeds: ValidatedFeed[] = [];
  if (args.doValidCheck || args.skipAuth) {
    for (const fileProvider of fileProviders) {
      if (await fileProvider.isSupportedInRepo()) {
        validatedFeeds.push(...(await fileProvider.validateAllUsedFeeds()));
      }
    }
  }

  // Filter to feeds to only feeds that were not authenticated and are actually
  // azure devops feeds by checking if we discovered the adoOrganization for it.
  const invalidFeeds = validatedFeeds.filter(
    (feed) => !feed.isValid && feed.feed.adoOrganization,
  );
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

    const feedsToGetTokenFor = new Map<string, string>();
    for (const feed of invalidFeeds.map((feed) => feed.feed)) {
      feedsToGetTokenFor.set(feed.adoOrganization, feed.registry);
    }

    // get a token for each feed
    const organizationPatMap: Record<string, string> = {};
    for (const [org, feed] of feedsToGetTokenFor) {
      organizationPatMap[org] = await generateNpmrcPat(
        org,
        feed,
        false,
        args.azureAuthLocation,
      );
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
      await fileProvider.writeWorkspaceRegistries(
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

run(args)
  .then((result) => {
    if (result === null) {
      // current auth is valid, do nothing
      logTelemetry({ success: true });
      console.log("✅ Current authentication is valid");
    } else if (result) {
      // automatic auth was performed
      // advertise success
      logTelemetry({ success: true, automaticSuccess: true });
      console.log("✅ Automatic authentication successful");
      // if the user specified an exit code for reauthenticate, exit
      if (args.exitCodeOnReAuthenticate !== undefined) {
        process.exit(args.exitCodeOnReAuthenticate);
      }
    } else {
      // automatic auth failed (for some reason)
      // advertise failure and link wiki to fix
      console.log("❌ Authentication to package feed failed.");

      process.exitCode = 1;
    }
  })
  .catch((error) => {
    console.error(error);
    console.log("❌ Authentication to package feed failed.");

    process.exitCode = 1;
  });
