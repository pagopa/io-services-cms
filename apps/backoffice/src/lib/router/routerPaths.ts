import { UrlObject } from "url";

export const ROUTER_PATHS = {
  AUTH_ERROR: "/auth/error",
  CREATE_SERVICE: "/services/new-service",
  DELEGATED_INSTITUTIONS: "/delegated-institutions",
  EDIT_SERVICE: (serviceId: string) => `/services/${serviceId}/edit-service`,
  HOME: "/",
  KEYS: "/keys",
  KEYS_ID: (keyId: string) => `/keys?id=${keyId}`,
  LOGOUT: "/auth/logout",
  NEW_GROUP_API_KEY: "/keys/new-group-api-key",
  REDIRECT_TO_LOGIN_PAGE_WITH_RETURN: (
    loginPath: string,
    returnUrl: string,
  ): UrlObject => ({
    pathname: loginPath,
    query: { returnUrl },
  }),
  SERVICE_ID: (serviceId: string) => `/services/${serviceId}`,
  SERVICE_ID_RELEASE_TRUE: (serviceId: string) =>
    `/services/${serviceId}?release=true`,
  SERVICES: "/services",
  TOKEN_EXCHANGE: (loginPath: string, token: string) =>
    `${loginPath}#token=${token}`,
} as const;
