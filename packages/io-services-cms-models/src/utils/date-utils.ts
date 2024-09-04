/**
 * Returns the UNIX timestamp in seconds for the given `date`. Defaults to `Date.now()`
 * when not providing the `date` argument to the method call.
 *
 * @returns {Number}
 */
const unixSeconds = (date = Date.now()): number => {
  return Math.floor(date / 1000);
};

/**
 * Returns the ISOString rapresentation for a given UNIX timestamp in seconds.
 *
 * @returns {Number}
 */
const isoStringfromUnixSeconds = (unixSeconds: number): string => {
  return new Date(unixSeconds * 1000).toISOString();
};

export { isoStringfromUnixSeconds, unixSeconds };
