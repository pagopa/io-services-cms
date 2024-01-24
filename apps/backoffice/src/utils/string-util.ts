/** Utility to check if a string is null, undefined or empty */
export const isNullUndefinedOrEmpty = (value: string | null | undefined) =>
  !value || value.trim().length === 0;

/** Utility to obscure string */
export const obscure = (value: string) => "•".repeat(value.length);

/**
 * path sanitization utility
 * @param asPath nextjs `router.asPath()` value
 * @returns sanitized path or empty string in case of invalid result
 */
export const sanitizePath = (asPath: string) => {
  // Remove dangerous characters and check the path for validity
  const sanitizedPath = asPath.replace(/[^a-zA-Z0-9\-_/]/g, "");
  // Check if the sanitized path is still valid
  return isValidPath(sanitizedPath) ? sanitizedPath : "";
};

/**
 * path validation utility
 * @param asPath nextjs `router.asPath()` value
 * @returns
 */
export const isValidPath = (asPath: string) => {
  // Implement path validation logic, i.e. check that it does not contain dangerous characters
  return /^[a-zA-Z0-9\-_\/]+$/.test(asPath);
};
