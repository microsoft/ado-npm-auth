import { exec as _exec, spawn } from "node:child_process";
import { promisify } from "node:util";

export const exec = promisify(_exec);

/**
 * Executes a command as a child process.
 * @param tool The command to run.
 * @param args The arguments to pass to the command.
 * @param options Options for the child process.
 * @returns A promise that resolves when the process exits.
 */
export function execProcess(
  tool: string,
  args: string[],
  options?: {
    cwd?: string;
    env?: Record<string, string>;
    stdio?: "pipe" | "inherit" | "ignore";
    shell?: boolean | string;
    processStdOut?: (data: string) => void;
    processStdErr?: (data: string) => void;
  },
): Promise<void> {
  return new Promise((resolve, reject) => {
    const cwd = options?.cwd || process.cwd();
    console.log(`🚀 Launching  [${tool} ${args.join(" ")}] in ${cwd}`);
    const result = spawn(tool, args, {
      cwd: cwd,
      env: options?.env || process.env,
      stdio: options?.stdio || "inherit",
      shell: options?.shell || false,
    });

    if (options?.stdio === "pipe") {
      result.stdout?.setEncoding("utf8");
      result.stdout?.on("data", function (data: Buffer) {
        const strData = data.toString("utf8");
        options?.processStdOut?.(strData);
      });

      result.stderr?.setEncoding("utf8");
      result.stderr?.on("data", function (data: Buffer) {
        const strData = data.toString("utf8");
        options?.processStdErr?.(strData);
      });
    }
    result.on("exit", (code) => {
      if (code == 0) {
        resolve();
      } else {
        reject(new Error(`Process ${tool} exited with code ${code}`));
      }
    });
  });
}
