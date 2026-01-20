import { faker } from "@faker-js/faker/locale/it";

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
  // eslint-disable-next-line perfectionist/sort-objects
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

export const getMockManageSubscriptionGroup = (id?: string) => ({
  id: id ?? faker.string.uuid(),
  name: faker.word.words({ count: { max: 3, min: 1 } }),
  state: faker.helpers.arrayElement(["ACTIVE", "SUSPENDED", "DELETED"]),
});
