// IO Services CMS API configuration
export const API_SERVICES_CMS_URL = process.env
  .NEXT_PUBLIC_API_SERVICES_CMS_URL as string;
export const API_SERVICES_CMS_MOCKING =
  process.env.NEXT_PUBLIC_API_SERVICES_CMS_MOCKING === "true";

// BackOffice backend for frontend API configuration
export const API_BACKEND_BASE_URL = process.env
  .NEXT_PUBLIC_API_BACKEND_BASE_URL as string;
export const API_BACKEND_BASE_PATH = process.env
  .NEXT_PUBLIC_API_BACKEND_BASE_PATH as string;
export const API_BACKEND_MOCKING =
  process.env.NEXT_PUBLIC_API_BACKEND_MOCKING === "true";

// BackOffice URLs
export const SELFCARE_URL = process.env.NEXT_PUBLIC_SELFCARE_URL as string;

// NodeJS Environment mode
export const IS_DEVELOPMENT = process.env.NODE_ENV === "development";
export const IS_TEST = process.env.NODE_ENV === "test";
export const IS_PRODUCTION = process.env.NODE_ENV === "production";

// window guards (useful to configure MSW to work in the browser or in Node environment)
export const IS_BROWSER = typeof window !== "undefined";
export const IS_SERVER = typeof window === "undefined";
