import yargs from "yargs";
import { hideBin } from "yargs/helpers";

export interface Args {
  doValidCheck: boolean;
  skipAuth: boolean;
  configFile?: string;
  azureAuthLocation?: string;
  writeAccess?: boolean;
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
        description: "Allow specifying alternate location to azureauth",
      },
      writeAccess: {
        alias: "w",
        type: "boolean",
        description: "Create a PAT with write access",
      },
    })
    .help()
    .parseSync();

  return {
    skipAuth: argv.skipAuth || false,
    doValidCheck: !argv.skipCheck,
    configFile: argv.configFile,
    azureAuthLocation: argv.azureAuthLocation,
    writeAccess: argv.writeAccess,
  };
}
