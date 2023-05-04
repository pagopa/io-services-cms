const envOrThrow = (key: string, defValue?: string): string => {
  const value = process.env[key] || defValue;
  if (!value) {
    throw new Error(`Missing mandatory variable: '${key}'`);
  }
  return value;
};

export const DB_HOST = envOrThrow("DB_HOST", "localhost");
export const DB_PORT = envOrThrow("DB_PORT", "5432");
export const DB_USER = envOrThrow("DB_USER");
export const DB_PASSWORD = envOrThrow("DB_PASSWORD");
export const DB_NAME = envOrThrow("DB_NAME", "db");
export const DB_SCHEMA = envOrThrow("DB_SCHEMA");
export const DB_TABLE = envOrThrow("DB_TABLE", "services");
