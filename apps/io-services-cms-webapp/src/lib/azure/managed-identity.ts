export const requireManagedIdentitySetting = (
  value: string | undefined,
  name: string,
): string => {
  if (!value) {
    throw new Error(`Missing managed identity setting: ${name}`);
  }

  return value;
};

export const requireFallbackSetting = (
  value: string | undefined,
  name: string,
): string => {
  if (!value) {
    throw new Error(`Missing fallback setting: ${name}`);
  }

  return value;
};