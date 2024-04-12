/**
 * Get the ADO Org for a npm feed
 * @param {string} feedUrl URL of the feed to get the ADO organization from
 * @param {string} [defaultOrg] Backup org in case it cannot be determined from the feed url
 * @returns ADO Organization for the feed
 */
export const getOrganizationFromFeedUrl = (feedUrl: string, defaultOrg = "") => {
  try {
    const url = new URL(feedUrl);
    const packagingIndex = url.pathname.indexOf("/_packaging");

    if (packagingIndex > 0) {
      // sometimes org is included in the path as the first item in the path
      // after the initial "/"
      // ex. "https://pkgs.dev.azure.com/foo/bar/_packaging/baz/npm/registry/" -> "foo"
      // these are project-scoped feeds
      return url.pathname.split("/")[1];
    }

    // otherwise feed is the first item in the host
    // ex. "https://foo.pkgs.visualstudio.com/_packaging/npm-mirror/npm/registry" -> "foo"
    // these are org-wide feeds
    return url.host.split(".")[0];
  } catch (error) {
    return defaultOrg;
  }
};
