/**
 * Extracts the organization and project details from a given Azure DevOps URL.
 * The function differentiates between the "new style" URLs that use 'dev.azure.com'
 * and "old style" URLs that use a subdomain of 'visualstudio.com'.
 *
 * @param {string} url - The Azure DevOps URL from which to extract details.
 * @returns {Object} An object containing the `organization` and `project` extracted from the URL.
 * @throws {Error} Throws an error if the URL is invalid, not in the expected format,
 *                 or does not contain the necessary information for extraction.
 *
 * @example
 * // New style URL
 * extractAdoDetails("https://dev.azure.com/contoso/WebsiteRedesign");
 * // returns { organization: "contoso", project: "WebsiteRedesign" }
 *
 * // Old style URL
 * extractAdoDetails("https://contoso.visualstudio.com/WebsiteRedesign");
 * // returns { organization: "contoso", project: "WebsiteRedesign" }
 *
 * // Invalid URL
 * extractAdoDetails("https://invalid.url.com");
 * // throws Error
 */
const extractAdoDetails = (url: string) => {
  try {
    if (!url.startsWith("https://")) {
      url = "https://" + url;
    }
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname;
    const pathname = parsedUrl.pathname;

    // Check for new style URLs (dev.azure.com)
    if (hostname.endsWith("dev.azure.com")) {
      const pathSegments = pathname.split("/").filter(Boolean); // Remove empty strings from the split result
      if (pathSegments.length >= 2) {
        return {
          organization: pathSegments[0],
          project: pathSegments[1],
        };
      } else {
        throw new Error(
          "Not enough segments in path for a valid organization and project extraction.",
        );
      }
    }

    // Check for old style URLs (visualstudio.com)
    if (hostname.endsWith("visualstudio.com")) {
      const subdomain = hostname.split(".")[0];
      const pathSegments = pathname.split("/").filter(Boolean);
      if (subdomain && pathSegments.length >= 1) {
        return {
          organization: subdomain,
          project: pathSegments[0],
        };
      } else {
        throw new Error(
          "Not enough segments in path or missing subdomain for a valid organization and project extraction.",
        );
      }
    }

    // If the URL does not match expected formats
    throw new Error(
      "URL format not recognized or does not contain enough information.",
    );
  } catch {
    throw new Error("Invalid URL or unsupported format");
  }
};

/**
 * Get the ADO Org for a npm feed
 * @param {string} feedUrl URL of the feed to get the ADO organization from
 * @param {string} [defaultOrg] Backup org in case it cannot be determined from the feed url
 * @returns ADO Organization for the feed
 */
export const getOrganizationFromFeedUrl = (
  feedUrl: string,
  defaultOrg = "",
) => {
  try {
    const { organization } = extractAdoDetails(feedUrl);
    return organization;
  } catch {
    return defaultOrg;
  }
};
