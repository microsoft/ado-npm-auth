import { exec as _exec, spawn as _spawn } from "node:child_process";
import { promisify } from "node:util";

export const exec = promisify(_exec);
export const spawn = (
  cmd: string,
  args: ReadonlyArray<string>,
  opts: Object,
): Promise<{ stdout: string }> => {
  let result = _spawn(cmd, args, opts);
  return new Promise((resolve, reject) => {
    let stdout = "";
    result.stdout.on("data", (data) => {
      stdout += data;
    });
    result.on("close", (code) => {
      if (code == 0) {
        resolve({ stdout });
      } else {
        reject(new Error(`process exited with error code: ${code}`));
      }
    });
    result.on("error", (err) => {
      reject(err);
    });
  });
};
