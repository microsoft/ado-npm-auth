export interface Args {
  doValidCheck: boolean;
  skipAuth: boolean;
  configFile?: string;
}

export function parseArgs(args: string[]): Args {
  const doValidCheck = !args.includes("--skip-check");
  const skipAuth = args.includes("--skip-auth");

  return {
    doValidCheck,
    skipAuth,
  };
}
