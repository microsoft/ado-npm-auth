/**
 * Given the feed url, get the name of the feed without the protocol ("https") at the beginning
 * @param {string} feed
 * @returns {string}
 */
export const getFeedWithoutProtocol = (feed: string) => {
  const feedUrl = new URL(feed);
  const protocol = feedUrl.protocol;
  const feedWithoutProtocol = feedUrl.toString().slice(protocol.length + 2);
  return feedWithoutProtocol;
};
