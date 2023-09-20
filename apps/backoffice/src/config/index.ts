export function getConfiguration() {
  return {
    // IO Services CMS API configuration
    API_SERVICES_CMS_URL: process.env
      .NEXT_PUBLIC_API_SERVICES_CMS_URL as string,
    API_SERVICES_CMS_BASE_PATH: process.env
      .NEXT_PUBLIC_API_SERVICES_CMS_BASE_PATH as string,
    API_SERVICES_CMS_MOCKING:
      process.env.NEXT_PUBLIC_API_SERVICES_CMS_MOCKING === "true",

    // BackOffice backend for frontend API configuration
    API_BACKEND_BASE_URL: process.env
      .NEXT_PUBLIC_API_BACKEND_BASE_URL as string,
    API_BACKEND_BASE_PATH: process.env
      .NEXT_PUBLIC_API_BACKEND_BASE_PATH as string,
    API_BACKEND_MOCKING: process.env.NEXT_PUBLIC_API_BACKEND_MOCKING === "true",

    // BackOffice settings
    BACK_OFFICE_ID: process.env.NEXT_PUBLIC_BACK_OFFICE_ID as string,
    BACK_OFFICE_TITLE: process.env.NEXT_PUBLIC_BACK_OFFICE_TITLE as string,

    // URLs
    SELFCARE_URL: process.env.NEXT_PUBLIC_SELFCARE_URL as string,
    SELFCARE_TOKEN_EXCHANGE_URL: process.env
      .NEXT_PUBLIC_SELFCARE_TOKEN_EXCHANGE_URL as string,

    // NodeJS Environment mode
    IS_DEVELOPMENT: process.env.NODE_ENV === "development",
    IS_TEST: process.env.NODE_ENV === "test",
    IS_PRODUCTION: process.env.NODE_ENV === "production",

    // window guards (useful to configure MSW to work in the browser or in Node environment)
    IS_BROWSER: typeof window !== "undefined",
    IS_SERVER: typeof window === "undefined"
  };
}
