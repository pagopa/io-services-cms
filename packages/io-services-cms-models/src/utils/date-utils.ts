/**
 * Returns the ISOString rapresentation for a given UNIX timestamp in **milliseconds**.
 *
 * @param {Number} unixTimestamp - UNIX timestamp in **milliseconds** to be converted to ISOString
 * @returns {String} the ISO string representation of the given UNIX timestamp in **milliseconds**
 */
const isoStringfromUnixMillis = (unixTimestamp: number): string =>
  new Date(unixTimestamp).toISOString();

/**
 * Returns the ISOString rapresentation for a given UNIX timestamp in **seconds**.
 *
 * @param {Number} unixSeconds - UNIX timestamp in **seconds** to be converted to ISOString
 * @returns {String} the ISO string representation of the given UNIX timestamp in **seconds**
 */
const isoStringfromUnixSeconds = (unixSeconds: number): string =>
  isoStringfromUnixMillis(unixSecondsToMillis(unixSeconds));

/**
 * Convert a given UNIX timestamp in **milliseconds** to an UNIX timestemp in **seconds**.
 *
 * @param {Number} unixMillis - UNIX timestamp in **milliseconds**
 * @returns {Number}  the timestamp expressed in **seconds**
 */
const unixMillisToSeconds = (unixMillis: number): number =>
  Math.floor(unixMillis / 1000);

/**
 * Convert a given UNIX timestamp in **seconds** to an UNIX timestemp in **milliseconds**.
 *
 * @param {Number} unixSeconds - UNIX timestamp in **seconds**
 * @returns {Number}  the timestamp expressed in **milliseconds**
 */
const unixSecondsToMillis = (unixSeconds: number): number => unixSeconds * 1000;

/**
 * Returns the UNIX timestamp in **milliseconds** for the given `date`. Defaults to `new Date()`
 * when not providing the `date` argument to the method call.
 *
 * @param {Date} date - The date to convert to UNIX timestamp
 * @returns {Number} the timestamp expressed in **milliseconds**
 */
const unixTimestamp = (date: Date = new Date()): number => date.getTime();

/**
 * Returns the UNIX timestamp in **seconds** for the given `date`. Defaults to `Date.now()`
 * when not providing the `date` argument to the method call.
 *
 * @param {Date} date - The date to convert to UNIX timestamp in **seconds**
 * @returns {Number} the timestamp expressed in **seconds**
 */
const unixTimestampInSeconds = (date: Date = new Date()): number =>
  unixMillisToSeconds(unixTimestamp(date));

export {
  isoStringfromUnixMillis,
  isoStringfromUnixSeconds,
  unixMillisToSeconds,
  unixSecondsToMillis,
  unixTimestamp,
  unixTimestampInSeconds,
};
