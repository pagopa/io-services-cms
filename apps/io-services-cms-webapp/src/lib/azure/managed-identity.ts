export const requireManagedIdentitySetting = (
  value: string | undefined,
  name: string,
): string => {
  if (!value) {
    throw new Error(`Missing managed identity setting: ${name}`);
  }

  return value;
};