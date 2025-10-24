import { UrlObject } from "url";

export const ROUTES = {
  ASSOCIATE_GROUP: "/groups/associate",
  AUTH: {
    ERROR: "/auth/error",
    LOGIN: (loginPath: string, returnUrl: string): UrlObject => ({
      pathname: loginPath,
      query: { returnUrl },
    }),
    LOGOUT: "/auth/logout",
  },
  DELEGATED_INSTITUTIONS: "/delegated-institutions",
  HOME: "/",
  KEYS: {
    DETAILS: (keyId: string) => `/keys?id=${keyId}`,
    LIST: "/keys",
    NEW_GROUP_API_KEY: "/keys/new-group-api-key",
  },
  SERVICES: {
    CREATE: "/services/new-service",
    DETAILS: (serviceId: string, releaseMode?: boolean) =>
      `/services/${serviceId}${releaseMode ? "?release=true" : ""}`,
    EDIT: (serviceId: string) => `/services/${serviceId}/edit-service`,
    LIST: "/services",
  },
  TOKEN_EXCHANGE: (loginPath: string, token: string) =>
    `${loginPath}#token=${token}`,
} as const;
