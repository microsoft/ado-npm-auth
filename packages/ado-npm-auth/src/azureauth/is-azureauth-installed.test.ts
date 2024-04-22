import { expect, test, vi, beforeEach } from "vitest";
import { isAzureAuthInstalled, clearMemo } from "./is-azureauth-installed.js";
import { clearMemo as clearAuthMemo } from "./azureauth-command.js";
import { exec } from "../utils/exec.js";
import * as utils from "../utils/is-wsl.js";
import { } from "node:test";

vi.mock("../utils/is-wsl.js", async () => {
  return {
    isWsl: vi.fn(),
  }
});


vi.mock('../utils/exec.js', async () => {
  return {
    exec: vi.fn(),
  }
});

beforeEach(() => {
  clearAuthMemo();
  clearMemo();
});

test("when azure auth is not installed", async () => {
    vi.mocked(exec).mockReturnValue(Promise.resolve({
      stdout: "",
      stderr: "",
    }) as any);
    vi.mocked(utils.isWsl).mockReturnValue(false);

    const azureAuthInstalled = await isAzureAuthInstalled();

    expect(vi.mocked(exec)).toBeCalled();

    expect(azureAuthInstalled).toBe(false);
});

test("when azure auth is installed", async () => {
  vi.mocked(exec).mockReturnValue(Promise.resolve({
    stdout: "0.8.5",
    stderr: "",
  }) as any);
  vi.mocked(utils.isWsl).mockReturnValue(false);

  const azureAuthInstalled = await isAzureAuthInstalled();  

  expect(vi.mocked(exec)).toBeCalled();

  expect(azureAuthInstalled).toBe(true);
});

test("when azure auth is installed on windows", async () => {
  vi.mocked(exec).mockReturnValue(Promise.resolve({
    stdout: "0.8.5",
    stderr: "",
  }) as any);
  vi.mocked(utils.isWsl).mockReturnValue(true);

  const azureAuthInstalled = await isAzureAuthInstalled();  

  expect(vi.mocked(exec)).toBeCalled();
  expect(vi.mocked(exec)).toBeCalledWith("azureauth.exe --version");

  expect(azureAuthInstalled).toBe(true);
});