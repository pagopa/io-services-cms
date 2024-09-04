/**
 * Returns the UNIX timestamp in seconds for the given `date`. Defaults to `Date.now()`
 * when not providing the `date` argument to the method call.
 *
 * @returns {Number}
 */
const unixTimestamp = (date = Date.now()): number => Math.floor(date / 1000);

/**
 * Returns the ISOString rapresentation for a given UNIX timestamp in seconds.
 *
 * @returns {String}
 */
const isoStringfromUnixTimestamp = (unixSeconds: number): string =>
  new Date(unixSeconds * 1000).toISOString();

export { isoStringfromUnixTimestamp, unixTimestamp };
