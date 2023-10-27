import { faker } from "@faker-js/faker/locale/it";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getMockInstitution } from "../../../../../../mocks/data/selfcare-data";
import { Configuration } from "../../../../../config";
import { InstitutionResources } from "../../../../../types/selfcare/InstitutionResource";
import { IdentityTokenPayload } from "../../types";
import { authorize } from "../auth";

const mockConfig = ({
  SELFCARE_BASE_URL: "http://localhost:7075",
  SELFCARE_JWKS_PATH: "/.well-known/jwks.json",
  AZURE_SUBSCRIPTION_ID: faker.string.uuid(),
  AZURE_CLIENT_SECRET_CREDENTIAL_CLIENT_ID: faker.string.uuid(),
  AZURE_CLIENT_SECRET_CREDENTIAL_SECRET: faker.internet.password(),
  AZURE_CLIENT_SECRET_CREDENTIAL_TENANT_ID: faker.string.uuid(),
  AZURE_APIM_RESOURCE_GROUP: faker.string.alpha(),
  AZURE_APIM: faker.string.alpha(),
  APIM_USER_GROUPS: faker.helpers.multiple(faker.string.alpha).join(","),
  AZURE_APIM_PRODUCT_NAME: faker.string.alpha()
} as unknown) as Configuration;

const aValidJwtPayload = {
  exp: faker.number.int(),
  iat: faker.number.int(),
  aud: faker.string.alphanumeric(),
  iss: faker.string.alphanumeric(),
  jti: faker.string.alphanumeric(),
  family_name: faker.person.lastName(),
  name: faker.person.firstName(),
  email: faker.internet.email(),
  uid: faker.string.uuid(),
  fiscal_number: faker.string.alphanumeric(),
  desired_exp: faker.number.int(),
  organization: {
    id: faker.string.uuid(),
    fiscal_code: faker.string.numeric(),
    name: faker.company.name(),
    roles: [
      {
        partyRole: faker.string.alpha(),
        role: faker.string.alpha()
      }
    ],
    groups: [faker.string.alpha()]
  }
};

const aValidApimUser = {
  name: faker.string.uuid(),
  email: `org.${aValidJwtPayload.organization.id}@selfcare.io.pagopa.it`,
  groups: [
    {
      type: "custom",
      name: faker.string.alpha()
    },
    {
      type: "custom",
      name: "ApiServiceWrite"
    }
  ]
};

const aValidSubscription = {
  name: `MANAGE-${aValidApimUser.name}`
};

const getExpectedCreateUserReqParam = (
  organization: IdentityTokenPayload["organization"]
) => ({
  email: `org.${organization.id}@selfcare.io.pagopa.it`,
  firstName: organization.name,
  lastName: organization.id,
  note: organization.fiscal_code
});

const getExpectedUserEmailReqParam = (
  organization: IdentityTokenPayload["organization"]
) => `org.${organization.id}@selfcare.io.pagopa.it`;

const getExpectedUser = (
  jwtPayload: IdentityTokenPayload,
  apimUser: typeof aValidApimUser,
  manageSubscription: typeof aValidSubscription,
  authorizedInstitutions: InstitutionResources
) => ({
  id: jwtPayload.uid,
  name: `${jwtPayload.name} ${jwtPayload.family_name}`,
  email: jwtPayload.email,
  institution: {
    id: jwtPayload.organization.id,
    name: jwtPayload.organization.name,
    role: jwtPayload.organization.roles[0].role,
    logo_url: "url"
  },
  authorizedInstitutions: authorizedInstitutions.map(institution => ({
    id: institution.id,
    name: institution.description,
    role: institution.userProductRoles?.[0],
    logo_url: institution.logo
  })),
  permissions: apimUser.groups
    .filter(group => group.type === "custom")
    .map(group => group.name),
  parameters: {
    userId: apimUser.name,
    userEmail: apimUser.email,
    subscriptionId: manageSubscription.name
  }
});

const aValidInstitutions: InstitutionResources = faker.helpers.arrayElements(
  Array(5).fill(getMockInstitution())
);

const mockApimClient = vi.hoisted(() => ({
  groupUser: {
    create: vi.fn()
  }
}));

const {
  getUserByEmail,
  getSubscription,
  getProductByName,
  upsertSubscription,
  createOrUpdateUser
} = vi.hoisted(() => ({
  getUserByEmail: vi.fn(),
  getSubscription: vi.fn(),
  getProductByName: vi.fn(),
  upsertSubscription: vi.fn(),
  createOrUpdateUser: vi.fn()
}));

const { getApimClient, getApimService } = vi.hoisted(() => ({
  getApimClient: vi.fn().mockReturnValue(mockApimClient),
  getApimService: vi.fn().mockReturnValue({
    getUserByEmail,
    getSubscription,
    getProductByName,
    upsertSubscription,
    createOrUpdateUser
  })
}));

vi.mock("@io-services-cms/external-clients", () => ({
  ApimUtils: { getApimClient }
}));

vi.mock("@/lib/be/apim-service", () => ({
  getApimService
}));

const { jwtVerify } = vi.hoisted(() => ({
  jwtVerify: vi.fn()
}));

vi.mock("jose", async importOriginal => {
  const mod = await importOriginal();

  return {
    ...(mod as any),
    jwtVerify
  };
});

const { getUserAuthorizedInstitutions } = vi.hoisted(() => ({
  getUserAuthorizedInstitutions: vi.fn()
}));

vi.mock("@/lib/be/institutions/selfcare", () => ({
  getUserAuthorizedInstitutions
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe("Authorize", () => {
  it("should fail when credentials is not valid", async () => {
    await expect(() =>
      authorize(mockConfig)({ invalidParam: "identity_token" }, {})
    ).rejects.toThrowError(/is not a valid/);

    expect(jwtVerify).not.toHaveBeenCalled();
    expect(getApimClient).not.toHaveBeenCalled();
    expect(getApimService).not.toHaveBeenCalled();
    expect(createOrUpdateUser).not.toHaveBeenCalled();
    expect(mockApimClient.groupUser.create).not.toHaveBeenCalled();
    expect(getSubscription).not.toHaveBeenCalled();
    expect(getProductByName).not.toHaveBeenCalled();
    expect(upsertSubscription).not.toHaveBeenCalled();
    expect(getUserAuthorizedInstitutions).not.toHaveBeenCalled();
  });

  it("should fail when token is not a JWT", async () => {
    jwtVerify.mockRejectedValueOnce("Invalid Compact JWS");

    await expect(() =>
      authorize(mockConfig)({ identity_token: "identity_token" }, {})
    ).rejects.toThrowError("Invalid Compact JWS");

    expect(jwtVerify).toHaveBeenCalledOnce();
    expect(getApimClient).not.toHaveBeenCalled();
    expect(getApimService).not.toHaveBeenCalled();
    expect(createOrUpdateUser).not.toHaveBeenCalled();
    expect(mockApimClient.groupUser.create).not.toHaveBeenCalled();
    expect(getSubscription).not.toHaveBeenCalled();
    expect(getProductByName).not.toHaveBeenCalled();
    expect(upsertSubscription).not.toHaveBeenCalled();
    expect(getUserAuthorizedInstitutions).not.toHaveBeenCalled();
  });

  it("should fail when JWT payload is not a valid IdentityToken", async () => {
    const { uid, ...anInvalidJwtPayload } = aValidJwtPayload;
    jwtVerify.mockResolvedValueOnce({
      payload: anInvalidJwtPayload
    });

    await expect(() =>
      authorize(mockConfig)(
        {
          identity_token: "identity_token"
        },
        {}
      )
    ).rejects.toThrowError(
      "value [undefined] at [root.uid] is not a valid [string]"
    );

    expect(jwtVerify).toHaveBeenCalledOnce();
    expect(getApimClient).not.toHaveBeenCalled();
    expect(getApimService).not.toHaveBeenCalled();
    expect(createOrUpdateUser).not.toHaveBeenCalled();
    expect(mockApimClient.groupUser.create).not.toHaveBeenCalled();
    expect(getSubscription).not.toHaveBeenCalled();
    expect(getProductByName).not.toHaveBeenCalled();
    expect(upsertSubscription).not.toHaveBeenCalled();
    expect(getUserAuthorizedInstitutions).not.toHaveBeenCalled();
  });

  it("should fail when creating a new Apim user and creation fail", async () => {
    const statusCode = 500;
    jwtVerify.mockResolvedValueOnce({
      payload: aValidJwtPayload
    });
    getUserByEmail.mockReturnValueOnce(TE.right(O.none));
    createOrUpdateUser.mockReturnValueOnce(TE.left({ statusCode }));

    await expect(() =>
      authorize(mockConfig)({ identity_token: "identity_token" }, {})
    ).rejects.toThrowError(
      `Failed to create subscription manage, code: ${statusCode}`
    );

    expect(jwtVerify).toHaveBeenCalledOnce();
    expect(getApimClient).toHaveBeenCalledOnce();
    expect(getApimClient).toHaveBeenCalledWith(
      mockConfig,
      mockConfig.AZURE_SUBSCRIPTION_ID
    );
    expect(getApimService).toHaveBeenCalledTimes(2);
    expect(getUserByEmail).toHaveBeenCalledOnce();
    expect(getUserByEmail).toHaveBeenCalledWith(
      getExpectedUserEmailReqParam(aValidJwtPayload.organization),
      true
    );
    expect(createOrUpdateUser).toHaveBeenCalledOnce();
    expect(createOrUpdateUser).toHaveBeenCalledWith(
      getExpectedCreateUserReqParam(aValidJwtPayload.organization)
    );
    expect(mockApimClient.groupUser.create).not.toHaveBeenCalled();
    expect(getSubscription).not.toHaveBeenCalled();
    expect(getProductByName).not.toHaveBeenCalled();
    expect(upsertSubscription).not.toHaveBeenCalled();
    expect(getUserAuthorizedInstitutions).not.toHaveBeenCalled();
  });

  it("should fail when adding a gruop to newly created user and user-group association fail", async () => {
    const errorMessage = "Reject groupUser.create";
    jwtVerify.mockResolvedValueOnce({
      payload: aValidJwtPayload
    });
    getUserByEmail.mockReturnValueOnce(TE.right(O.none));
    createOrUpdateUser.mockReturnValueOnce(TE.right(aValidApimUser));
    mockApimClient.groupUser.create.mockRejectedValueOnce(errorMessage);

    await expect(() =>
      authorize(mockConfig)({ identity_token: "identity_token" }, {})
    ).rejects.toThrowError(errorMessage);

    expect(jwtVerify).toHaveBeenCalledOnce();
    expect(getApimClient).toHaveBeenCalledOnce();
    expect(getApimClient).toHaveBeenCalledWith(
      mockConfig,
      mockConfig.AZURE_SUBSCRIPTION_ID
    );
    expect(getApimService).toHaveBeenCalledTimes(2);
    expect(getUserByEmail).toHaveBeenCalledOnce();
    expect(getUserByEmail).toHaveBeenCalledWith(
      getExpectedUserEmailReqParam(aValidJwtPayload.organization),
      true
    );
    expect(createOrUpdateUser).toHaveBeenCalledOnce();
    expect(createOrUpdateUser).toHaveBeenCalledWith(
      getExpectedCreateUserReqParam(aValidJwtPayload.organization)
    );
    expect(mockApimClient.groupUser.create).toHaveBeenCalledOnce();
    expect(getSubscription).not.toHaveBeenCalled();
    expect(getProductByName).not.toHaveBeenCalled();
    expect(upsertSubscription).not.toHaveBeenCalled();
    expect(getUserAuthorizedInstitutions).not.toHaveBeenCalled();
  });

  it("should fail when fetching the newly created user and fetch fail", async () => {
    const statusCode = 500;
    jwtVerify.mockResolvedValueOnce({
      payload: aValidJwtPayload
    });
    getUserByEmail.mockReturnValueOnce(TE.right(O.none));
    createOrUpdateUser.mockReturnValueOnce(TE.right(aValidApimUser));
    mockApimClient.groupUser.create.mockResolvedValue(aValidApimUser);
    getUserByEmail.mockReturnValueOnce(TE.left({ statusCode }));

    await expect(() =>
      authorize(mockConfig)({ identity_token: "identity_token" }, {})
    ).rejects.toThrowError(
      `Failed to fetch user by its email, code: ${statusCode}`
    );

    expect(jwtVerify).toHaveBeenCalledOnce();
    expect(getApimClient).toHaveBeenCalledOnce();
    expect(getApimClient).toHaveBeenCalledWith(
      mockConfig,
      mockConfig.AZURE_SUBSCRIPTION_ID
    );
    expect(getApimService).toHaveBeenCalledTimes(3);
    expect(getUserByEmail).toHaveBeenCalledTimes(2);
    expect(getUserByEmail).toHaveBeenCalledWith(
      getExpectedUserEmailReqParam(aValidJwtPayload.organization),
      true
    );
    expect(createOrUpdateUser).toHaveBeenCalledOnce();
    expect(createOrUpdateUser).toHaveBeenCalledWith(
      getExpectedCreateUserReqParam(aValidJwtPayload.organization)
    );
    expect(mockApimClient.groupUser.create).toHaveBeenCalledTimes(
      mockConfig.APIM_USER_GROUPS.split(",").length
    );
    mockConfig.APIM_USER_GROUPS.split(",").forEach((groupId, index) =>
      expect(mockApimClient.groupUser.create).toHaveBeenNthCalledWith(
        index + 1, // The count starts at 1 (https://vitest.dev/api/expect.html#tohavebeennthcalledwith)
        mockConfig.AZURE_APIM_RESOURCE_GROUP,
        mockConfig.AZURE_APIM,
        groupId,
        aValidApimUser.name
      )
    );
    expect(getSubscription).not.toHaveBeenCalled();
    expect(getProductByName).not.toHaveBeenCalled();
    expect(upsertSubscription).not.toHaveBeenCalled();
    expect(getUserAuthorizedInstitutions).not.toHaveBeenCalled();
  });

  it("should fail when retrieved Apim user is not valid", async () => {
    jwtVerify.mockResolvedValueOnce({
      payload: aValidJwtPayload
    });
    getUserByEmail.mockReturnValueOnce(TE.right(O.some({})));

    await expect(() =>
      authorize(mockConfig)({ identity_token: "identity_token" }, {})
    ).rejects.toThrowError(/is not a valid/);

    expect(jwtVerify).toHaveBeenCalledOnce();
    expect(getApimClient).toHaveBeenCalledOnce();
    expect(getApimClient).toHaveBeenCalledWith(
      mockConfig,
      mockConfig.AZURE_SUBSCRIPTION_ID
    );
    expect(getApimService).toHaveBeenCalledOnce();
    expect(getUserByEmail).toHaveBeenCalledOnce();
    expect(getUserByEmail).toHaveBeenCalledWith(
      getExpectedUserEmailReqParam(aValidJwtPayload.organization),
      true
    );
    expect(createOrUpdateUser).not.toHaveBeenCalled();
    expect(mockApimClient.groupUser.create).not.toHaveBeenCalled();
    expect(getSubscription).not.toHaveBeenCalled();
    expect(getProductByName).not.toHaveBeenCalled();
    expect(upsertSubscription).not.toHaveBeenCalled();
    expect(getUserAuthorizedInstitutions).not.toHaveBeenCalled();
  });

  it("should fail when retrieved Apim user has not ApiServiceWrite permission", async () => {
    jwtVerify.mockResolvedValueOnce({
      payload: aValidJwtPayload
    });
    getUserByEmail.mockReturnValueOnce(
      TE.right(
        O.some({
          ...aValidApimUser,
          groups: aValidApimUser.groups.filter(
            g => g.name !== "ApiServiceWrite"
          )
        })
      )
    );

    await expect(() =>
      authorize(mockConfig)({ identity_token: "identity_token" }, {})
    ).rejects.toThrowError("Forbidden not authorized");

    expect(jwtVerify).toHaveBeenCalledOnce();
    expect(getApimClient).toHaveBeenCalledOnce();
    expect(getApimClient).toHaveBeenCalledWith(
      mockConfig,
      mockConfig.AZURE_SUBSCRIPTION_ID
    );
    expect(getApimService).toHaveBeenCalledOnce();
    expect(getUserByEmail).toHaveBeenCalledOnce();
    expect(getUserByEmail).toHaveBeenCalledWith(
      getExpectedUserEmailReqParam(aValidJwtPayload.organization),
      true
    );
    expect(createOrUpdateUser).not.toHaveBeenCalled();
    expect(mockApimClient.groupUser.create).not.toHaveBeenCalled();
    expect(getSubscription).not.toHaveBeenCalled();
    expect(getProductByName).not.toHaveBeenCalled();
    expect(upsertSubscription).not.toHaveBeenCalled();
    expect(getUserAuthorizedInstitutions).not.toHaveBeenCalled();
  });

  it("should fail when retrieving user manage subscription fail", async () => {
    jwtVerify.mockResolvedValueOnce({
      payload: aValidJwtPayload
    });
    getUserByEmail.mockReturnValueOnce(TE.right(O.some(aValidApimUser)));
    const statusCode = 500;
    getSubscription.mockReturnValueOnce(TE.left({ statusCode }));

    await expect(() =>
      authorize(mockConfig)({ identity_token: "identity_token" }, {})
    ).rejects.toThrowError(
      `Failed to fetch user subscription manage, code: ${statusCode}`
    );

    expect(jwtVerify).toHaveBeenCalledOnce();
    expect(getApimClient).toHaveBeenCalledOnce();
    expect(getApimClient).toHaveBeenCalledWith(
      mockConfig,
      mockConfig.AZURE_SUBSCRIPTION_ID
    );
    expect(getApimService).toHaveBeenCalledTimes(2);
    expect(getUserByEmail).toHaveBeenCalledOnce();
    expect(getUserByEmail).toHaveBeenCalledWith(
      getExpectedUserEmailReqParam(aValidJwtPayload.organization),
      true
    );
    expect(getSubscription).toHaveBeenCalledOnce();
    expect(getSubscription).toHaveBeenCalledWith(
      `MANAGE-${aValidApimUser.name}`
    );
    expect(createOrUpdateUser).not.toHaveBeenCalled();
    expect(mockApimClient.groupUser.create).not.toHaveBeenCalled();
    expect(getProductByName).not.toHaveBeenCalled();
    expect(upsertSubscription).not.toHaveBeenCalled();
    expect(getUserAuthorizedInstitutions).not.toHaveBeenCalled();
  });

  it("should fail when manage subscription is not found and and fail to fetch APIM product", async () => {
    jwtVerify.mockResolvedValueOnce({
      payload: aValidJwtPayload
    });
    getUserByEmail.mockReturnValueOnce(TE.right(O.some(aValidApimUser)));
    const statusCode = 500;
    getSubscription.mockReturnValueOnce(TE.left({ statusCode: 404 }));
    getProductByName.mockReturnValueOnce(TE.left({ statusCode }));

    await expect(() =>
      authorize(mockConfig)({ identity_token: "identity_token" }, {})
    ).rejects.toThrowError(
      `Failed to fetch product by its name, code: ${statusCode}`
    );

    expect(jwtVerify).toHaveBeenCalledOnce();
    expect(getApimClient).toHaveBeenCalledOnce();
    expect(getApimClient).toHaveBeenCalledWith(
      mockConfig,
      mockConfig.AZURE_SUBSCRIPTION_ID
    );
    expect(getApimService).toHaveBeenCalledTimes(4);
    expect(getUserByEmail).toHaveBeenCalledOnce();
    expect(getUserByEmail).toHaveBeenCalledWith(
      getExpectedUserEmailReqParam(aValidJwtPayload.organization),
      true
    );
    expect(getSubscription).toHaveBeenCalledOnce();
    expect(getSubscription).toHaveBeenCalledWith(
      `MANAGE-${aValidApimUser.name}`
    );
    expect(getProductByName).toHaveBeenCalledOnce();
    expect(getProductByName).toHaveBeenCalledWith(
      mockConfig.AZURE_APIM_PRODUCT_NAME
    );
    expect(createOrUpdateUser).not.toHaveBeenCalled();
    expect(mockApimClient.groupUser.create).not.toHaveBeenCalled();
    expect(upsertSubscription).not.toHaveBeenCalled();
    expect(getUserAuthorizedInstitutions).not.toHaveBeenCalled();
  });

  it("should fail when manage subscription is not found and fail to create it", async () => {
    const statusCode = 500;
    const productId = faker.string.uuid();
    jwtVerify.mockResolvedValueOnce({
      payload: aValidJwtPayload
    });
    getUserByEmail.mockReturnValueOnce(TE.right(O.some(aValidApimUser)));
    getSubscription.mockReturnValueOnce(TE.left({ statusCode: 404 }));
    getProductByName.mockReturnValueOnce(TE.right(O.some({ id: productId })));
    upsertSubscription.mockReturnValueOnce(TE.left({ statusCode }));

    await expect(() =>
      authorize(mockConfig)({ identity_token: "identity_token" }, {})
    ).rejects.toThrowError(
      `Failed to create subscription manage, code: ${statusCode}`
    );

    expect(jwtVerify).toHaveBeenCalledOnce();
    expect(getApimClient).toHaveBeenCalledOnce();
    expect(getApimClient).toHaveBeenCalledWith(
      mockConfig,
      mockConfig.AZURE_SUBSCRIPTION_ID
    );
    expect(getApimService).toHaveBeenCalledTimes(4);
    expect(getUserByEmail).toHaveBeenCalledOnce();
    expect(getUserByEmail).toHaveBeenCalledWith(
      getExpectedUserEmailReqParam(aValidJwtPayload.organization),
      true
    );
    expect(getSubscription).toHaveBeenCalledOnce();
    expect(getSubscription).toHaveBeenCalledWith(
      `MANAGE-${aValidApimUser.name}`
    );
    expect(getProductByName).toHaveBeenCalledOnce();
    expect(getProductByName).toHaveBeenCalledWith(
      mockConfig.AZURE_APIM_PRODUCT_NAME
    );
    expect(upsertSubscription).toHaveBeenCalledOnce();
    expect(upsertSubscription).toHaveBeenCalledWith(
      productId,
      aValidApimUser.name,
      `MANAGE-${aValidApimUser.name}`
    );
    expect(createOrUpdateUser).not.toHaveBeenCalled();
    expect(mockApimClient.groupUser.create).not.toHaveBeenCalled();
    expect(getUserAuthorizedInstitutions).not.toHaveBeenCalled();
  });

  it("should fail when manage subscription is not found and fail the new one is not valid", async () => {
    const productId = faker.string.uuid();
    jwtVerify.mockResolvedValueOnce({
      payload: aValidJwtPayload
    });
    getUserByEmail.mockReturnValueOnce(TE.right(O.some(aValidApimUser)));
    getSubscription.mockReturnValueOnce(TE.left({ statusCode: 404 }));
    getProductByName.mockReturnValueOnce(TE.right(O.some({ id: productId })));
    upsertSubscription.mockReturnValueOnce(TE.right({}));

    await expect(() =>
      authorize(mockConfig)({ identity_token: "identity_token" }, {})
    ).rejects.toThrowError(/is not a valid/);

    expect(jwtVerify).toHaveBeenCalledOnce();
    expect(getApimClient).toHaveBeenCalledOnce();
    expect(getApimClient).toHaveBeenCalledWith(
      mockConfig,
      mockConfig.AZURE_SUBSCRIPTION_ID
    );
    expect(getApimService).toHaveBeenCalledTimes(4);
    expect(getUserByEmail).toHaveBeenCalledOnce();
    expect(getUserByEmail).toHaveBeenCalledWith(
      getExpectedUserEmailReqParam(aValidJwtPayload.organization),
      true
    );
    expect(getSubscription).toHaveBeenCalledOnce();
    expect(getSubscription).toHaveBeenCalledWith(
      `MANAGE-${aValidApimUser.name}`
    );
    expect(getProductByName).toHaveBeenCalledOnce();
    expect(getProductByName).toHaveBeenCalledWith(
      mockConfig.AZURE_APIM_PRODUCT_NAME
    );
    expect(upsertSubscription).toHaveBeenCalledOnce();
    expect(upsertSubscription).toHaveBeenCalledWith(
      productId,
      aValidApimUser.name,
      `MANAGE-${aValidApimUser.name}`
    );
    expect(createOrUpdateUser).not.toHaveBeenCalled();
    expect(mockApimClient.groupUser.create).not.toHaveBeenCalled();
    expect(getUserAuthorizedInstitutions).not.toHaveBeenCalled();
  });

  it("should fail when retrieve user authorized institutions fail", async () => {
    const productId = faker.string.uuid();
    const errorMessage = "Rejected getUserAuthorizedInstitutions";
    jwtVerify.mockResolvedValueOnce({
      payload: aValidJwtPayload
    });
    getUserByEmail.mockImplementation(() => TE.right(O.some(aValidApimUser)));
    getSubscription.mockReturnValueOnce(TE.right(aValidSubscription));
    getUserAuthorizedInstitutions.mockRejectedValueOnce(errorMessage);

    await expect(() =>
      authorize(mockConfig)({ identity_token: "identity_token" }, {})
    ).rejects.toThrowError(errorMessage);

    expect(jwtVerify).toHaveBeenCalledOnce();
    expect(getApimClient).toHaveBeenCalledOnce();
    expect(getApimClient).toHaveBeenCalledWith(
      mockConfig,
      mockConfig.AZURE_SUBSCRIPTION_ID
    );
    expect(getApimService).toHaveBeenCalledTimes(2);
    expect(getUserByEmail).toHaveBeenCalledOnce();
    expect(getUserByEmail).toHaveBeenCalledWith(
      getExpectedUserEmailReqParam(aValidJwtPayload.organization),
      true
    );
    expect(getSubscription).toHaveBeenCalledOnce();
    expect(getSubscription).toHaveBeenCalledWith(
      `MANAGE-${aValidApimUser.name}`
    );
    expect(getUserAuthorizedInstitutions).toHaveBeenCalledOnce();
    expect(getUserAuthorizedInstitutions).toHaveBeenCalledWith(
      aValidJwtPayload.uid
    );
    expect(createOrUpdateUser).not.toHaveBeenCalled();
    expect(mockApimClient.groupUser.create).not.toHaveBeenCalled();
    expect(getProductByName).not.toHaveBeenCalled();
    expect(upsertSubscription).not.toHaveBeenCalled();
  });

  it("should return a valid backoffice User when both APIM users and its manage subscription exists", async () => {
    jwtVerify.mockResolvedValueOnce({
      payload: aValidJwtPayload
    });
    getUserByEmail.mockImplementation(() => TE.right(O.some(aValidApimUser)));
    getSubscription.mockReturnValueOnce(TE.right(aValidSubscription));
    getUserAuthorizedInstitutions.mockResolvedValueOnce(aValidInstitutions);

    const user = await authorize(mockConfig)(
      { identity_token: "identity_token" },
      {}
    );

    expect(user).toEqual(
      getExpectedUser(
        aValidJwtPayload,
        aValidApimUser,
        aValidSubscription,
        aValidInstitutions
      )
    );
    expect(jwtVerify).toHaveBeenCalledOnce();
    expect(getApimClient).toHaveBeenCalledOnce();
    expect(getApimClient).toHaveBeenCalledWith(
      mockConfig,
      mockConfig.AZURE_SUBSCRIPTION_ID
    );
    expect(getApimService).toHaveBeenCalledTimes(2);
    expect(getUserByEmail).toHaveBeenCalledOnce();
    expect(getUserByEmail).toHaveBeenCalledWith(aValidApimUser.email, true);
    expect(getSubscription).toHaveBeenCalledOnce();
    expect(getSubscription).toHaveBeenCalledWith(
      `MANAGE-${aValidApimUser.name}`
    );
    expect(getUserAuthorizedInstitutions).toHaveBeenCalledOnce();
    expect(getUserAuthorizedInstitutions).toHaveBeenCalledWith(
      aValidJwtPayload.uid
    );
    expect(createOrUpdateUser).not.toHaveBeenCalled();
    expect(mockApimClient.groupUser.create).not.toHaveBeenCalled();
    expect(getProductByName).not.toHaveBeenCalled();
    expect(upsertSubscription).not.toHaveBeenCalled();
  });

  it("should return a valid backoffice User when both APIM users and its manage subscription does not exists", async () => {
    const productId = faker.string.uuid();
    jwtVerify.mockResolvedValueOnce({
      payload: aValidJwtPayload
    });
    getUserByEmail.mockReturnValueOnce(TE.right(O.none));
    createOrUpdateUser.mockReturnValueOnce(TE.right(aValidApimUser));
    mockApimClient.groupUser.create.mockResolvedValue(aValidApimUser);
    getUserByEmail.mockReturnValueOnce(TE.right(O.some(aValidApimUser)));
    getSubscription.mockReturnValueOnce(TE.left({ statusCode: 404 }));
    getProductByName.mockReturnValueOnce(TE.right(O.some({ id: productId })));
    upsertSubscription.mockReturnValueOnce(TE.right(aValidSubscription));
    getUserAuthorizedInstitutions.mockResolvedValueOnce(aValidInstitutions);

    const user = await authorize(mockConfig)(
      { identity_token: "identity_token" },
      {}
    );

    expect(user).toEqual(
      getExpectedUser(
        aValidJwtPayload,
        aValidApimUser,
        aValidSubscription,
        aValidInstitutions
      )
    );

    expect(jwtVerify).toHaveBeenCalledOnce();
    expect(getApimClient).toHaveBeenCalledOnce();
    expect(getApimClient).toHaveBeenCalledWith(
      mockConfig,
      mockConfig.AZURE_SUBSCRIPTION_ID
    );
    expect(getApimService).toHaveBeenCalledTimes(6);
    expect(getUserByEmail).toHaveBeenCalledTimes(2);
    expect(getUserByEmail).toHaveBeenCalledWith(
      getExpectedUserEmailReqParam(aValidJwtPayload.organization),
      true
    );
    expect(createOrUpdateUser).toHaveBeenCalledOnce();
    expect(createOrUpdateUser).toHaveBeenCalledWith(
      getExpectedCreateUserReqParam(aValidJwtPayload.organization)
    );
    expect(mockApimClient.groupUser.create).toHaveBeenCalledTimes(
      mockConfig.APIM_USER_GROUPS.split(",").length
    );
    mockConfig.APIM_USER_GROUPS.split(",").forEach((groupId, index) =>
      expect(mockApimClient.groupUser.create).toHaveBeenNthCalledWith(
        index + 1, // The count starts at 1 (https://vitest.dev/api/expect.html#tohavebeennthcalledwith)
        mockConfig.AZURE_APIM_RESOURCE_GROUP,
        mockConfig.AZURE_APIM,
        groupId,
        aValidApimUser.name
      )
    );
    expect(getSubscription).toHaveBeenCalledOnce();
    expect(getSubscription).toHaveBeenCalledWith(
      `MANAGE-${aValidApimUser.name}`
    );
    expect(getProductByName).toHaveBeenCalledOnce();
    expect(getProductByName).toHaveBeenCalledWith(
      mockConfig.AZURE_APIM_PRODUCT_NAME
    );
    expect(upsertSubscription).toHaveBeenCalledOnce();
    expect(upsertSubscription).toHaveBeenCalledWith(
      productId,
      aValidApimUser.name,
      `MANAGE-${aValidApimUser.name}`
    );
    expect(getUserAuthorizedInstitutions).toHaveBeenCalledOnce();
    expect(getUserAuthorizedInstitutions).toHaveBeenCalledWith(
      aValidJwtPayload.uid
    );
  });
});
