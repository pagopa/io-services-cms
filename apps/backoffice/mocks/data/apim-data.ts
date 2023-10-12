import { Configuration, getConfiguration } from "@/config";

export const getOpenIdConfig = (configuration: Configuration) => ({
  token_endpoint: `https://login.microsoftonline.com/${configuration.AZURE_CLIENT_SECRET_CREDENTIAL_TENANT_ID}/oauth2/v2.0/token`,
  token_endpoint_auth_methods_supported: [
    "client_secret_post",
    "private_key_jwt",
    "client_secret_basic"
  ],
  jwks_uri: `https://login.microsoftonline.com/${configuration.AZURE_CLIENT_SECRET_CREDENTIAL_TENANT_ID}/discovery/v2.0/keys`,
  response_modes_supported: ["query", "fragment", "form_post"],
  subject_types_supported: ["pairwise"],
  id_token_signing_alg_values_supported: ["RS256"],
  response_types_supported: [
    "code",
    "id_token",
    "code id_token",
    "id_token token"
  ],
  scopes_supported: ["openid", "profile", "email", "offline_access"],
  issuer: `https://login.microsoftonline.com/${configuration.AZURE_CLIENT_SECRET_CREDENTIAL_TENANT_ID}/v2.0`,
  request_uri_parameter_supported: false,
  userinfo_endpoint: "https://graph.microsoft.com/oidc/userinfo",
  authorization_endpoint: `https://login.microsoftonline.com/${configuration.AZURE_CLIENT_SECRET_CREDENTIAL_TENANT_ID}/oauth2/v2.0/authorize`,
  device_authorization_endpoint: `https://login.microsoftonline.com/${configuration.AZURE_CLIENT_SECRET_CREDENTIAL_TENANT_ID}/oauth2/v2.0/devicecode`,
  http_logout_supported: true,
  frontchannel_logout_supported: true,
  end_session_endpoint: `https://login.microsoftonline.com/${configuration.AZURE_CLIENT_SECRET_CREDENTIAL_TENANT_ID}/oauth2/v2.0/logout`,
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
    "email"
  ],
  kerberos_endpoint: `https://login.microsoftonline.com/${configuration.AZURE_CLIENT_SECRET_CREDENTIAL_TENANT_ID}/kerberos`,
  tenant_region_scope: "EU",
  cloud_instance_name: "microsoftonline.com",
  cloud_graph_host_name: "graph.windows.net",
  msgraph_host: "graph.microsoft.com",
  rbac_url: "https://pas.windows.net"
});

export const anOauth2TokenResponse = {
  access_token: "MTQ0NjJkZmQ5OTM2NDE1ZTZjNGZmZjI3",
  token_type: "Bearer",
  expires_in: 3600,
  refresh_token: "IwOGYzYTlmM2YxOTQ5MGE3YmNmMDFkNTVk",
  scope: "create"
};

export const getListByServiceResponse = (configuration: Configuration) => ({
  value: [
    {
      id: `/subscriptions/${configuration.AZURE_SUBSCRIPTION_ID}/resourceGroups/${configuration.AZURE_APIM_RESOURCE_GROUP}/providers/Microsoft.ApiManagement/service/${configuration.AZURE_APIM}/users/1`,
      type: "Microsoft.ApiManagement/service/users",
      name: "1",
      email: "admin@live.com",
      firstName: "Administrator",
      lastName: "",
      state: "active",
      registrationDate: "2015-09-22T01:57:39.677Z",
      identities: [
        {
          provider: "Azure",
          id: "admin@live.com"
        }
      ],
      groups: [
        {
          type: "custom",
          name: "ApiServiceRead"
        },
        {
          type: "custom",
          name: "ApiServiceWrite"
        },
        {
          type: "system",
          name: "Developer"
        }
      ]
    },
    {
      id: `/subscriptions/${configuration.AZURE_SUBSCRIPTION_ID}/resourceGroups/${configuration.AZURE_APIM_RESOURCE_GROUP}/providers/Microsoft.ApiManagement/service/${configuration.AZURE_APIM}/users/56eaec62baf08b06e46d27fd`,
      type: "Microsoft.ApiManagement/service/users",
      name: "56eaec62baf08b06e46d27fd",
      properties: {
        firstName: "foo",
        lastName: "bar",
        email: "foo.bar.83@gmail.com",
        state: "active",
        registrationDate: "2016-03-17T17:41:56.327Z",
        identities: [
          {
            provider: "Basic",
            id: "foo.bar.83@gmail.com"
          }
        ]
      }
    },
    {
      id: `/subscriptions/${configuration.AZURE_SUBSCRIPTION_ID}/resourceGroups/${configuration.AZURE_APIM_RESOURCE_GROUP}/providers/Microsoft.ApiManagement/service/${configuration.AZURE_APIM}/users/5931a75ae4bbd512a88c680b`,
      type: "Microsoft.ApiManagement/service/users",
      name: "5931a75ae4bbd512a88c680b",
      properties: {
        firstName: "foo",
        lastName: "bar",
        email: "foobar@outlook.com",
        state: "active",
        registrationDate: "2017-06-02T17:58:50.357Z",
        identities: [
          {
            provider: "Microsoft",
            id: "*************"
          }
        ]
      }
    }
  ],
  count: 3,
  nextLink: ""
});

export const getDiscoveryInstanceResponse = (configuration: Configuration) => ({
  tenant_discovery_endpoint: `https://login.microsoftonline.com/${configuration.AZURE_CLIENT_SECRET_CREDENTIAL_TENANT_ID}/v2.0/.well-known/openid-configuration`,
  "api-version": "1.1",
  metadata: [
    {
      preferred_network: "login.microsoftonline.com",
      preferred_cache: "login.windows.net",
      aliases: [
        "login.microsoftonline.com",
        "login.windows.net",
        "login.microsoft.com",
        "sts.windows.net"
      ]
    },
    {
      preferred_network: "login.partner.microsoftonline.cn",
      preferred_cache: "login.partner.microsoftonline.cn",
      aliases: ["login.partner.microsoftonline.cn", "login.chinacloudapi.cn"]
    },
    {
      preferred_network: "login.microsoftonline.de",
      preferred_cache: "login.microsoftonline.de",
      aliases: ["login.microsoftonline.de"]
    },
    {
      preferred_network: "login.microsoftonline.us",
      preferred_cache: "login.microsoftonline.us",
      aliases: ["login.microsoftonline.us", "login.usgovcloudapi.net"]
    },
    {
      preferred_network: "login-us.microsoftonline.com",
      preferred_cache: "login-us.microsoftonline.com",
      aliases: ["login-us.microsoftonline.com"]
    }
  ]
});
