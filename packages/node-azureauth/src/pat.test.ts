import { run, args } from "./pat.js";
import { expect, test, vi } from "vitest";

test("adoPat", async () => {
  vi.mock("execa", () => {
    return {
      execa: () => {
        return Promise.resolve({
          stdout: "test123",
        });
      },
    };
  });

  const pat = await run({
    displayName: "test",
    organization: "test",
    promptHint: "test",
    scope: ["test"],
  });

  expect(pat).toBe("test123");
});

test("adoPat args", () => {
  const commandArgs = args({
    displayName: "test",
    organization: "test",
    promptHint: "test",
    scope: ["test"],
  });

  expect(commandArgs).toEqual([
    "ado",
    "pat",
    `--prompt-hint "test"`,
    `--organization "test"`,
    `--display-name "test"`,
    `--scope "test"`,
    `--output json`,
  ]);
});
