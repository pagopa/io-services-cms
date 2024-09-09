/**
 * Returns the ISOString rapresentation for a given UNIX timestamp.
 *
 * @param {Number} unixTimestamp - UNIX timestamp to be converted to ISOString
 * @returns {String}
 */
const isoStringfromUnixTimestamp = (unixTimestamp: number): string =>
  new Date(unixTimestamp).toISOString();

/**
 * Returns the ISOString rapresentation for a given UNIX timestamp in seconds.
 *
 * @param {Number} unixSeconds - UNIX timestamp in seconds to be converted to ISOString
 * @returns {String}
 */
const isoStringfromUnixSeconds = (unixSeconds: number): string =>
  isoStringfromUnixTimestamp(unixSecondsToMillis(unixSeconds));

/**
 * Convert a given UNIX timestamp in seconds to an UNIX timestemp in milliseconds.
 *
 * @param {Number} unixMillis - UNIX timestamp in seconds
 * @returns {Number}
 */
const unixMillisToSeconds = (unixMillis: number): number =>
  Math.floor(unixMillis / 1000);

/**
 * Convert a given UNIX timestamp in seconds to an UNIX timestemp in milliseconds.
 *
 * @param {Number} unixSeconds - UNIX timestamp in seconds
 * @returns {Number}
 */
const unixSecondsToMillis = (unixSeconds: number): number => unixSeconds * 1000;

/**
 * Returns the UNIX timestamp for the given `date`. Defaults to `new Date()`
 * when not providing the `date` argument to the method call.
 *
 * @param {Date} date - The date to convert to UNIX timestamp
 * @returns {Number} the timestamp expressed in milliseconds
 */
const unixTimestamp = (date: Date = new Date()): number => date.getTime();

/**
 * Returns the UNIX timestamp in **seconds** for the given `date`. Defaults to `Date.now()`
 * when not providing the `date` argument to the method call.
 *
 * @param {Date} date - The date to convert to UNIX timestamp in seconds
 * @returns {Number}
 */
const unixTimestampInSeconds = (date: Date = new Date()): number =>
  unixMillisToSeconds(unixTimestamp(date));

export {
  isoStringfromUnixSeconds,
  isoStringfromUnixTimestamp,
  unixMillisToSeconds,
  unixSecondsToMillis,
  unixTimestamp,
  unixTimestampInSeconds,
};
