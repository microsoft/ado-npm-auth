import { expect, test, vi, beforeEach } from "vitest";
import { AdoPatResponse, adoPat } from "./ado.js";
import { spawn } from "../utils/exec.js";
import { spawnSync } from "child_process";
import * as utils from "../utils/is-wsl.js";

vi.mock("child_process", async () => {
  return {
    spawnSync: vi.fn(() => {
      error: {
      }
    }),
  };
});

vi.mock("./is-azureauth-installed.js", async () => {
  return {
    isAzureAuthInstalled: vi.fn(() => true),
  };
});

vi.mock("../utils/exec.js", async () => {
  return {
    spawn: vi.fn(),
  };
});

vi.mock("../utils/is-wsl.js", async () => {
  return {
    isWsl: vi.fn(),
  };
});

vi.mock("./is-supported-platform-and-architecture.js", async () => {
  return {
    isSupportedPlatformAndArchitecture: vi.fn(() => true),
  };
});

beforeEach(() => {
  vi.clearAllMocks();
});

test("it should spawn azureauth", async () => {
  vi.mocked(utils.isWsl).mockReturnValue(false);
  vi.mocked(spawn).mockReturnValue(
    Promise.resolve({
      stdout: '{ "token": "foobarabc123" }',
      stderr: "",
    }) as any,
  );

  const results = (await adoPat({
    promptHint: "hint",
    organization: "org",
    displayName: "test display",
    scope: ["foobar"],
    output: "json",
    domain: "baz.com",
    timeout: "200",
  })) as AdoPatResponse;

  expect(spawn).toHaveBeenCalledWith(
    "npm",
    [
      "exec",
      "--silent",
      "--yes",
      "azureauth",
      "--",
      "ado",
      "pat",
      '--prompt-hint "hint"',
      "--organization org",
      "--display-name test display",
      "--scope foobar",
      "--output json",
      "--domain baz.com",
      "--timeout 200",
    ],
    expect.anything(),
  );
  expect(results.token).toBe("foobarabc123");
});

test("it should spawnSync azureauth on wsl", async () => {
  vi.mocked(spawnSync).mockReturnValue({
    stdout: '{ "token": "foobarabc123" }',
  } as any);
  vi.mocked(utils.isWsl).mockReturnValue(true);

  const results = (await adoPat({
    promptHint: "hint",
    organization: "org",
    displayName: "test display",
    scope: ["foobar"],
    output: "json",
    domain: "baz.com",
    timeout: "200",
  })) as AdoPatResponse;

  expect(spawnSync).toHaveBeenCalledWith(
    "npm",
    [
      "exec",
      "--silent",
      "--yes",
      "azureauth",
      "--",
      "ado",
      "pat",
      "--prompt-hint hint",
      "--organization org",
      "--display-name test display",
      "--scope foobar",
      "--output json",
      "--domain baz.com",
      "--timeout 200",
    ],
    expect.anything(),
  );
  expect(results.token).toBe("foobarabc123");
});

test("it should handle json errors", async () => {
  vi.mocked(utils.isWsl).mockReturnValue(false);
  vi.mocked(spawn).mockReturnValue(
    Promise.resolve({
      stdout: "an error",
      stderr: "",
    }) as any,
  );

  await expect(
    adoPat({
      promptHint: "hint",
      organization: "org",
      displayName: "test display",
      scope: ["foobar"],
      output: "json",
      domain: "baz.com",
      timeout: "200",
    }),
  ).rejects.toThrowError("Failed to parse JSON output: an error");
});

test("it should handle errors from azureauth-cli", async () => {
  vi.mocked(utils.isWsl).mockReturnValue(false);
  vi.mocked(spawn).mockReturnValue(Promise.reject(new Error("an error")));

  await expect(
    adoPat({
      promptHint: "hint",
      organization: "org",
      displayName: "test display",
      scope: ["foobar"],
      output: "json",
      domain: "baz.com",
      timeout: "200",
    }),
  ).rejects.toThrowError("Failed to get Ado Pat from npx AzureAuth: an error");
});
