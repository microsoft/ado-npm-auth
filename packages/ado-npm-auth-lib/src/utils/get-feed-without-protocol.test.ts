import { expect, test } from "vitest";
import { getFeedWithoutProtocol } from "./get-feed-without-protocol.js";

test("getFeedWithoutProtocol with a normal feed", () => {
  const feedWithoutProtocol = getFeedWithoutProtocol(
    "https://foo.bar.baz/org/proj/_packaging/repo/npm/registry/",
  );
  expect(feedWithoutProtocol).toBe(
    "foo.bar.baz/org/proj/_packaging/repo/npm/registry/",
  );
});

test("getFeedWithoutProtocol throws error with an empty feed", () => {
  expect(() => getFeedWithoutProtocol("")).toThrowError("Invalid URL");
});

test("getFeedWithoutProtocol with a port specified", () => {
  // hint: if you use the default port for the protocol (ex https/443) then it will be stripped as it is not necessary
  const feedHasPortWithoutProtocol = getFeedWithoutProtocol(
    "https://foo.bar:444/baz",
  );
  expect(feedHasPortWithoutProtocol).toBe("foo.bar:444/baz");
});

test("getFeedWithoutProtocol with a query argument specified", () => {
  const feedHasQueryArgWithoutProtocol = getFeedWithoutProtocol(
    "https://foo.bar/baz?qux=qaz",
  );
  expect(feedHasQueryArgWithoutProtocol).toBe("foo.bar/baz?qux=qaz");
});

test("getFeedWithoutProtocol with many query arguments specified", () => {
  const feedHasQueryArgsWithoutProtocol = getFeedWithoutProtocol(
    "https://foo.bar/baz?qux=qaz&type=multi&env=test",
  );
  expect(feedHasQueryArgsWithoutProtocol).toBe(
    "foo.bar/baz?qux=qaz&type=multi&env=test",
  );
});

test("getFeedWithoutProtocol with a fragment specified", () => {
  const feedHasFragmentWithoutProtocol = getFeedWithoutProtocol(
    "https://foo.bar/baz#frag",
  );
  expect(feedHasFragmentWithoutProtocol).toBe("foo.bar/baz#frag");
});

test("getFeedWithoutProtocol with a port, many query arguments and fragment specified", () => {
  const feedHasQueryArgsWithoutProtocol = getFeedWithoutProtocol(
    "https://foo.bar.com:440/baz/pop?qux=qaz&type=multi&env=test#frag",
  );
  expect(feedHasQueryArgsWithoutProtocol).toBe(
    "foo.bar.com:440/baz/pop?qux=qaz&type=multi&env=test#frag",
  );
});
