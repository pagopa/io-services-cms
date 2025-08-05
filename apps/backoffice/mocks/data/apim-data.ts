import { Configuration } from "@/config";
import { faker } from "@faker-js/faker/locale/it";

export const getOpenIdConfig = (configuration: Configuration) => ({
  authorization_endpoint: `https://login.microsoftonline.com/${configuration.AZURE_CLIENT_SECRET_CREDENTIAL_TENANT_ID}/oauth2/v2.0/authorize`,
  claims_supported: [
    "sub",
    "iss",
    "cloud_instance_name",
    "cloud_instance_host_name",
    "cloud_graph_host_name",
    "msgraph_host",
    "aud",
    "exp",
    "iat",
    "auth_time",
    "acr",
    "nonce",
    "preferred_username",
    "name",
    "tid",
    "ver",
    "at_hash",
    "c_hash",
    "email",
  ],
  cloud_graph_host_name: "graph.windows.net",
  cloud_instance_name: "microsoftonline.com",
  device_authorization_endpoint: `https://login.microsoftonline.com/${configuration.AZURE_CLIENT_SECRET_CREDENTIAL_TENANT_ID}/oauth2/v2.0/devicecode`,
  end_session_endpoint: `https://login.microsoftonline.com/${configuration.AZURE_CLIENT_SECRET_CREDENTIAL_TENANT_ID}/oauth2/v2.0/logout`,
  frontchannel_logout_supported: true,
  http_logout_supported: true,
  id_token_signing_alg_values_supported: ["RS256"],
  issuer: `https://login.microsoftonline.com/${configuration.AZURE_CLIENT_SECRET_CREDENTIAL_TENANT_ID}/v2.0`,
  jwks_uri: `https://login.microsoftonline.com/${configuration.AZURE_CLIENT_SECRET_CREDENTIAL_TENANT_ID}/discovery/v2.0/keys`,
  kerberos_endpoint: `https://login.microsoftonline.com/${configuration.AZURE_CLIENT_SECRET_CREDENTIAL_TENANT_ID}/kerberos`,
  msgraph_host: "graph.microsoft.com",
  rbac_url: "https://pas.windows.net",
  request_uri_parameter_supported: false,
  response_modes_supported: ["query", "fragment", "form_post"],
  response_types_supported: [
    "code",
    "id_token",
    "code id_token",
    "id_token token",
  ],
  scopes_supported: ["openid", "profile", "email", "offline_access"],
  subject_types_supported: ["pairwise"],
  tenant_region_scope: "EU",
  token_endpoint: `https://login.microsoftonline.com/${configuration.AZURE_CLIENT_SECRET_CREDENTIAL_TENANT_ID}/oauth2/v2.0/token`,
  token_endpoint_auth_methods_supported: [
    "client_secret_post",
    "private_key_jwt",
    "client_secret_basic",
  ],
  userinfo_endpoint: "https://graph.microsoft.com/oidc/userinfo",
});

export const anOauth2TokenResponse = {
  access_token: "MTQ0NjJkZmQ5OTM2NDE1ZTZjNGZmZjI3",
  expires_in: 3600,
  refresh_token: "IwOGYzYTlmM2YxOTQ5MGE3YmNmMDFkNTVk",
  scope: "create",
  token_type: "Bearer",
};

export const aListSecretsResponse = {
  primaryKey: faker.string.alphanumeric(32),
  secondaryKey: faker.string.alphanumeric(32),
};

export const anEmptyListByServiceResponse = {
  count: 0,
  nextLink: "",
  value: [],
};

export const getProductListByServiceResponse = ({
  AZURE_APIM,
  AZURE_APIM_RESOURCE_GROUP,
  AZURE_SUBSCRIPTION_ID,
  productName = faker.string.uuid(),
}: {
  AZURE_APIM: string;
  AZURE_APIM_RESOURCE_GROUP: string;
  AZURE_SUBSCRIPTION_ID: string;
  productName?: string;
}) => ({
  count: 1,
  nextLink: "",
  value: [
    {
      id: `/subscriptions/${AZURE_SUBSCRIPTION_ID}/resourceGroups/${AZURE_APIM_RESOURCE_GROUP}/providers/Microsoft.ApiManagement/service/${AZURE_APIM}/products/${productName}`,
      name: productName,
    },
  ],
});

export const getSubscriptionResponse = ({
  AZURE_APIM,
  AZURE_APIM_RESOURCE_GROUP,
  AZURE_SUBSCRIPTION_ID,
  subscriptionId = faker.string.uuid(),
}: {
  AZURE_APIM: string;
  AZURE_APIM_RESOURCE_GROUP: string;
  AZURE_SUBSCRIPTION_ID: string;
  subscriptionId?: string;
}) => ({
  id: `/subscriptions/${AZURE_SUBSCRIPTION_ID}/resourceGroups/${AZURE_APIM_RESOURCE_GROUP}/providers/Microsoft.ApiManagement/service/${AZURE_APIM}/subscriptions/${subscriptionId}`,
  name: subscriptionId,
});

export const getListByServiceResponse = (
  params: Parameters<typeof getUser>[0],
) => {
  const users = [getUser(params)];
  return {
    count: users.length,
    nextLink: "",
    value: users,
  };
};
export const getUserResponse = (params: Parameters<typeof getUser>[0]) =>
  getUser(params);

const getUser = ({
  AZURE_APIM,
  AZURE_APIM_RESOURCE_GROUP,
  AZURE_SUBSCRIPTION_ID,
  groups = ["Developer", "ApiServiceWrite"],
  userId = faker.string.uuid(),
  userEmail = `org.${userId}@selfcare.io.pagopa.com`,
}: {
  AZURE_APIM: string;
  AZURE_APIM_RESOURCE_GROUP: string;
  AZURE_SUBSCRIPTION_ID: string;
  groups?: string[];
  userEmail?: string;
  userId?: string;
}) => ({
  email: userEmail,
  firstName: faker.person.firstName(),
  groups: groups.map((groupName) => ({
    name: groupName,
    type: "custom",
  })),
  id: `/subscriptions/${AZURE_SUBSCRIPTION_ID}/resourceGroups/${AZURE_APIM_RESOURCE_GROUP}/providers/Microsoft.ApiManagement/service/${AZURE_APIM}/users/${userId}`,
  identities: [
    {
      id: "admin@live.com",
      provider: "Azure",
    },
  ],
  lastName: faker.person.lastName(),
  name: userId,
  registrationDate: "2015-09-22T01:57:39.677Z",
  state: "active",
  type: "Microsoft.ApiManagement/service/users",
});

export const getDiscoveryInstanceResponse = (configuration: Configuration) => ({
  "api-version": "1.1",
  metadata: [
    {
      aliases: [
        "login.microsoftonline.com",
        "login.windows.net",
        "login.microsoft.com",
        "sts.windows.net",
      ],
      preferred_cache: "login.windows.net",
      preferred_network: "login.microsoftonline.com",
    },
    {
      aliases: ["login.partner.microsoftonline.cn", "login.chinacloudapi.cn"],
      preferred_cache: "login.partner.microsoftonline.cn",
      preferred_network: "login.partner.microsoftonline.cn",
    },
    {
      aliases: ["login.microsoftonline.de"],
      preferred_cache: "login.microsoftonline.de",
      preferred_network: "login.microsoftonline.de",
    },
    {
      aliases: ["login.microsoftonline.us", "login.usgovcloudapi.net"],
      preferred_cache: "login.microsoftonline.us",
      preferred_network: "login.microsoftonline.us",
    },
    {
      aliases: ["login-us.microsoftonline.com"],
      preferred_cache: "login-us.microsoftonline.com",
      preferred_network: "login-us.microsoftonline.com",
    },
  ],
  tenant_discovery_endpoint: `https://login.microsoftonline.com/${configuration.AZURE_CLIENT_SECRET_CREDENTIAL_TENANT_ID}/v2.0/.well-known/openid-configuration`,
});

export const getMockManageSubscriptionGroup = (id?: string) => ({
  id: id ?? faker.string.uuid(),
  name: faker.word.words({ count: { max: 3, min: 1 } }),
  state: faker.helpers.arrayElement(["ACTIVE", "SUSPENDED", "DELETED"]),
});
