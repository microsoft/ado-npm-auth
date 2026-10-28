import { beforeEach, expect, test, vi } from "vitest";
import * as ado from "../azureauth/ado.js";
import * as wsl from "../utils/is-wsl.js";
import { generateNpmrcPat } from "./generate-npmrc-pat.js";
import * as nuget from "./nugetCredentialProvider.js";

vi.mock("../azureauth/ado.js", async () => {
  return {
    adoPat: vi.fn(),
  };
});

vi.mock("./nugetCredentialProvider.js", async () => {
  return {
    credentialProviderPat: vi.fn(),
  };
});

vi.mock("../utils/is-wsl.js", async () => {
  return {
    isWsl: vi.fn(() => false),
  };
});

let mockedPlatform: NodeJS.Platform = "darwin";

vi.mock("node:os", async () => {
  const actual = await vi.importActual<typeof import("node:os")>("node:os");
  return {
    ...actual,
    hostname: () => "test-host",
    platform: () => mockedPlatform,
  };
});

beforeEach(() => {
  vi.clearAllMocks();
  mockedPlatform = "darwin";
  vi.mocked(wsl.isWsl).mockReturnValue(false);
});

test("forwards tenant and domain options to adoPat", async () => {
  vi.mocked(ado.adoPat).mockResolvedValue({ token: "abc" } as any);

  await generateNpmrcPat("myorg", "https://feed.example", false, undefined, {
    tenant: "00000000-0000-0000-0000-000000000001",
    domain: "contoso.com",
  });

  expect(ado.adoPat).toHaveBeenCalledWith(
    expect.objectContaining({
      organization: "myorg",
      tenant: "00000000-0000-0000-0000-000000000001",
      domain: "contoso.com",
    }),
    undefined,
  );
});

test("passes undefined tenant/domain when options are omitted", async () => {
  vi.mocked(ado.adoPat).mockResolvedValue({ token: "abc" } as any);

  await generateNpmrcPat("myorg", "https://feed.example");

  expect(ado.adoPat).toHaveBeenCalledWith(
    expect.objectContaining({
      organization: "myorg",
      tenant: undefined,
      domain: undefined,
    }),
    undefined,
  );
});

test("uses the credential provider on linux when tenant/domain overrides are unset", async () => {
  mockedPlatform = "linux";
  vi.mocked(nuget.credentialProviderPat).mockResolvedValue({
    Username: "user",
    Password: "cp-token",
  });

  const token = await generateNpmrcPat("myorg", "https://feed.example");

  expect(token).toBe("cp-token");
  expect(nuget.credentialProviderPat).toHaveBeenCalledWith(
    "https://feed.example",
  );
  expect(ado.adoPat).not.toHaveBeenCalled();
});

test("throws on linux when tenant/domain overrides are set", async () => {
  mockedPlatform = "linux";

  await expect(
    generateNpmrcPat("myorg", "https://feed.example", false, undefined, {
      tenant: "00000000-0000-0000-0000-000000000001",
      domain: "contoso.com",
    }),
  ).rejects.toThrow(
    "tenant/domain overrides are not supported on Linux with CredentialProvider.Microsoft",
  );

  expect(nuget.credentialProviderPat).not.toHaveBeenCalled();
  expect(ado.adoPat).not.toHaveBeenCalled();
});

test("routes WSL through azureauth and forwards tenant/domain", async () => {
  mockedPlatform = "linux";
  vi.mocked(wsl.isWsl).mockReturnValue(true);
  vi.mocked(ado.adoPat).mockResolvedValue({ token: "wsl-token" } as any);

  const token = await generateNpmrcPat(
    "myorg",
    "https://feed.example",
    false,
    undefined,
    {
      tenant: "00000000-0000-0000-0000-000000000001",
      domain: "contoso.com",
    },
  );

  expect(token).toBe("wsl-token");
  expect(ado.adoPat).toHaveBeenCalledWith(
    expect.objectContaining({
      organization: "myorg",
      tenant: "00000000-0000-0000-0000-000000000001",
      domain: "contoso.com",
    }),
    undefined,
  );
  expect(nuget.credentialProviderPat).not.toHaveBeenCalled();
});
