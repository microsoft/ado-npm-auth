/**
 * Given the feed url, get the name of the feed without the protocol ("https") at the beginning
 */
export const getFeedWithoutProtocol = (feed: string): string => {
  const feedUrl = new URL(feed);
  const protocol = feedUrl.protocol; // will be something like "http:"
  const protocolLength = protocol.length + 2; // we want to strip out the protocol, colon, and double slash
  const feedWithoutProtocol = feedUrl.toString().slice(protocolLength);
  return feedWithoutProtocol;
};
