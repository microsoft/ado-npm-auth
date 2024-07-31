export interface Args {
  doValidCheck: boolean;
  skipAuth: boolean;
  configFile?: string;
  help: boolean;
  deviceCode: boolean;
}

export function printHelp() {
  console.log(`
Usage:

  -h --help      Show this
  --skip-auth    Don't authenticate
  --skip-check   Don't check whether auth is still valid
  --device-code  Use device code flow for authentication
`)
}

export function parseArgs(args: string[]): Args {
  const doValidCheck = !args.includes("--skip-check");
  const skipAuth = args.includes("--skip-auth");
  const help = args.includes('--help') || args.includes('-h');
  const deviceCode = args.includes('--device-code');

  return {
    doValidCheck,
    skipAuth,
    help,
    deviceCode,
  };
}
