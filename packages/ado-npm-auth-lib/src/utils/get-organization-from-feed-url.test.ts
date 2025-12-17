import { getOrganizationFromFeedUrl } from "./get-organization-from-feed-url.js";
import { expect, test } from "vitest";

test("should get the correct projects from the feed url", () => {
  const stuff = getOrganizationFromFeedUrl(
    "https://pkgs.dev.azure.com/org/proj/_packaging/feedname/npm/registry/",
  );

  expect(stuff).toBe("org");
});

test("should get the correct projects from the feed url with only a project name", () => {
  const stuff = getOrganizationFromFeedUrl(
    "https://pkgs.dev.azure.com/org/proj/_packaging/feedname/npm/registry/",
  );

  expect(stuff).toBe("org");
});

test("should get the correct projects from the feed url with only a project name but without _packaging", () => {
  const stuff = getOrganizationFromFeedUrl(
    "https://org.dev.azure.com/org/proj/feedname/npm/registry/",
  );

  expect(stuff).toBe("org");
});

test("should work for legacy vs urls", () => {
  const stuff = getOrganizationFromFeedUrl(
    "https://org.pkgs.visualstudio.com/proj/_packaging/feed/npm/registry/",
  );

  expect(stuff).toBe("org");
});
