import { spawnSync } from "node:child_process";
import { beforeEach, expect, test, vi } from "vitest";
import * as utils from "../utils/is-wsl.js";
import type { AdoPatResponse } from "./ado.js";
import { adoPat } from "./ado.js";
import { clearMemo } from "./azureauth-command.js";

vi.mock("child_process", async () => {
  return {
    spawnSync: vi.fn(),
  };
});

vi.mock("./is-azureauth-installed.js", async () => {
  return {
    isAzureAuthInstalled: vi.fn(() => true),
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

let mockedPlatform: NodeJS.Platform = "darwin";

vi.mock("node:os", async () => {
  const actual = await vi.importActual<typeof import("node:os")>("node:os");
  return {
    ...actual,
    platform: () => mockedPlatform,
  };
});

const expectedLauncher = () => (mockedPlatform === "win32" ? "npm.cmd" : "npm");

beforeEach(() => {
  vi.clearAllMocks();
  clearMemo();
  mockedPlatform = "darwin";
});

test("it should spawnSync azureauth", async () => {
  vi.mocked(utils.isWsl).mockReturnValue(false);
  vi.mocked(spawnSync).mockReturnValue({
    status: 0,
    stdout: '{ "token": "foobarabc123" }',
    stderr: "",
  } as any);

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
    expectedLauncher(),
    [
      "exec",
      "--silent",
      "--yes",
      "azureauth",
      "--",
      "ado",
      "pat",
      "--prompt-hint",
      "hint",
      "--organization",
      "org",
      "--display-name",
      "test display",
      "--scope",
      "foobar",
      "--output",
      "json",
      "--domain",
      "baz.com",
      "--timeout",
      "200",
    ],
    expect.objectContaining({ shell: false }),
  );
  expect(results.token).toBe("foobarabc123");
});

test("it should quote the native Windows npm.cmd fallback command line", async () => {
  mockedPlatform = "win32";
  vi.mocked(utils.isWsl).mockReturnValue(false);
  vi.mocked(spawnSync).mockReturnValue({
    status: 0,
    stdout: '{ "token": "foobarabc123" }',
    stderr: "",
  } as any);

  await adoPat({
    promptHint: "hint with spaces",
    organization: "org",
    displayName: "test display",
    scope: ["foobar"],
    output: "json",
  });

  expect(spawnSync).toHaveBeenCalledWith(
    expect.stringContaining('"hint with spaces"'),
    expect.objectContaining({ shell: true }),
  );
});

test("it should surface spawnSync launch failures", async () => {
  vi.mocked(utils.isWsl).mockReturnValue(false);
  vi.mocked(spawnSync).mockReturnValue({
    status: null,
    stdout: "",
    stderr: "",
    error: new Error("spawn ENOENT"),
  } as any);

  await expect(
    adoPat({
      promptHint: "hint",
      organization: "org",
      displayName: "test display",
      scope: ["foobar"],
      output: "json",
    }),
  ).rejects.toThrowError("Failed to get Ado Pat from AzureAuth: spawn ENOENT");
});

test("it should spawnSync azureauth on wsl", async () => {
  vi.mocked(spawnSync).mockReturnValue({
    status: 0,
    stdout: '{ "token": "foobarabc123" }',
    stderr: "",
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
    "azureauth.exe",
    [
      "ado",
      "pat",
      "--prompt-hint",
      "hint",
      "--organization",
      "org",
      "--display-name",
      "test display",
      "--scope",
      "foobar",
      "--output",
      "json",
      "--domain",
      "baz.com",
      "--timeout",
      "200",
    ],
    expect.objectContaining({ shell: false }),
  );
  expect(results.token).toBe("foobarabc123");
});

test("it should handle errors on wsl if azureauth exit code is not 0", async () => {
  vi.mocked(utils.isWsl).mockReturnValue(true);
  vi.mocked(spawnSync).mockReturnValue({
    status: 1,
    stdout: "",
    stderr: "an error",
  } as any);

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
  ).rejects.toThrowError(
    "Failed to get Ado Pat from AzureAuth: Azure Auth failed with exit code 1: an error",
  );
});

test("it should handle errors on wsl if azureauth has stderr output", async () => {
  vi.mocked(utils.isWsl).mockReturnValue(true);
  vi.mocked(spawnSync).mockReturnValue({
    status: 0,
    stdout: "",
    stderr: "an error",
  } as any);

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
  ).rejects.toThrowError(
    "Failed to get Ado Pat from AzureAuth: Azure Auth failed with exit code 0: an error",
  );
});

test("it should handle json errors", async () => {
  vi.mocked(utils.isWsl).mockReturnValue(false);
  vi.mocked(spawnSync).mockReturnValue({
    status: 0,
    stdout: "an error",
    stderr: "",
  } as any);

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

test("it should forward --tenant when options.tenant is set", async () => {
  vi.mocked(utils.isWsl).mockReturnValue(false);
  vi.mocked(spawnSync).mockReturnValue({
    status: 0,
    stdout: '{ "token": "foobarabc123" }',
    stderr: "",
  } as any);

  await adoPat({
    promptHint: "hint",
    organization: "org",
    displayName: "test display",
    scope: ["foobar"],
    output: "json",
    tenant: "00000000-0000-0000-0000-000000000001",
    domain: "contoso.com",
    timeout: "200",
  });

  const [, calledArgs] = vi.mocked(spawnSync).mock.calls[0];
  const tenantIdx = (calledArgs as string[]).indexOf("--tenant");
  expect(tenantIdx).toBeGreaterThanOrEqual(0);
  expect((calledArgs as string[])[tenantIdx + 1]).toBe(
    "00000000-0000-0000-0000-000000000001",
  );
  const domainIdx = (calledArgs as string[]).indexOf("--domain");
  expect(domainIdx).toBeGreaterThanOrEqual(0);
  expect((calledArgs as string[])[domainIdx + 1]).toBe("contoso.com");
});

test("it should omit --tenant when options.tenant is unset", async () => {
  vi.mocked(utils.isWsl).mockReturnValue(false);
  vi.mocked(spawnSync).mockReturnValue({
    status: 0,
    stdout: '{ "token": "foobarabc123" }',
    stderr: "",
  } as any);

  await adoPat({
    promptHint: "hint",
    organization: "org",
    displayName: "test display",
    scope: ["foobar"],
    output: "json",
    timeout: "200",
  });

  const [, calledArgs] = vi.mocked(spawnSync).mock.calls[0];
  expect(calledArgs).not.toContain("--tenant");
});

test("it should pass shell metacharacters in tenant/domain verbatim without shell interpretation", async () => {
  vi.mocked(utils.isWsl).mockReturnValue(false);
  vi.mocked(spawnSync).mockReturnValue({
    status: 0,
    stdout: '{ "token": "safe" }',
    stderr: "",
  } as any);

  const maliciousTenant = "abc$(touch /tmp/pwned)";
  const maliciousDomain = "evil;rm -rf /";

  await adoPat({
    promptHint: "hint",
    organization: "org",
    displayName: "test display",
    scope: ["foobar"],
    output: "json",
    tenant: maliciousTenant,
    domain: maliciousDomain,
  });

  const [launcher, calledArgs, opts] = vi.mocked(spawnSync).mock.calls[0];
  expect(launcher).toBe(expectedLauncher());

  const argv = calledArgs as string[];
  const tenantIdx = argv.indexOf("--tenant");
  expect(tenantIdx).toBeGreaterThanOrEqual(0);
  expect(argv[tenantIdx + 1]).toBe(maliciousTenant);

  const domainIdx = argv.indexOf("--domain");
  expect(domainIdx).toBeGreaterThanOrEqual(0);
  expect(argv[domainIdx + 1]).toBe(maliciousDomain);

  expect(opts).toEqual(expect.objectContaining({ shell: false }));
});

test("it should handle errors from azureauth-cli", async () => {
  vi.mocked(utils.isWsl).mockReturnValue(false);
  vi.mocked(spawnSync).mockReturnValue({
    status: 0,
    stdout: "",
    stderr: "an error",
  } as any);

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
  ).rejects.toThrowError(
    "Failed to get Ado Pat from AzureAuth: Azure Auth failed with exit code 0: an error",
  );
});
