import yargs from "yargs";
import { hideBin } from "yargs/helpers";

export interface Args {
  doValidCheck: boolean;
  skipAuth: boolean;
  configFile?: string;
  userConfigFile?: string;
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
        description: "Custom workspace config file path",
      },
      userConfigFile: {
        alias: "u",
        type: "string",
        description: "Custom user config file path",
      }
    })
    .help()
    .parseSync();

  return {
    skipAuth: argv.skipAuth || false,
    doValidCheck: !argv.skipCheck,
    configFile: argv.configFile,
    userConfigFile: argv.userConfigFile
  };
}
