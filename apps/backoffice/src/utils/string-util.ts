/** Utility to check if a string is null, undefined or empty */
export const isNullUndefinedOrEmpty = (value: string | null | undefined) =>
  !value || value.trim().length === 0;
