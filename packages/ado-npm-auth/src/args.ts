import yargs from "yargs";
import { hideBin } from "yargs/helpers";

export interface Args {
  doValidCheck: boolean;
  skipAuth: boolean;
  configFile?: string;
  azureAuthLocation?: string;
}

export function parseArgs(args: string[]): Args {
  const argv = yargs(hideBin(args))
    .option({
      skipCheck: {
        type: "boolean",
        description: "Skip checking the validity of the feeds",
      },
      skipAuth: {
        type: "boolean",
        description: "Skip authenticating the feeds",
      },
      configFile: {
        alias: "c",
        type: "string",
        description: "Skip checking the validity of the feeds",
      },
      azureAuthLocation: {
        type: "string",
        description: "Allow specifying alternate location to azureauth"
      }
    })
    .help()
    .parseSync();

  return {
    skipAuth: argv.skipAuth || false,
    doValidCheck: !argv.skipCheck,
    configFile: argv.configFile,
    azureAuthLocation: argv.azureAuthLocation,
  };
}
