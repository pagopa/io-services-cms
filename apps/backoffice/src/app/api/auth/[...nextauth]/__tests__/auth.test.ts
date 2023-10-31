import { faker } from "@faker-js/faker/locale/it";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getMockInstitution } from "../../../../../../mocks/data/selfcare-data";
import { Configuration } from "../../../../../config";
import { Institution } from "../../../../../types/selfcare/Institution";
import { InstitutionResources } from "../../../../../types/selfcare/InstitutionResource";
import { IdentityTokenPayload } from "../../types";
import { authorize } from "../auth";

const mockConfig = ({
  SELFCARE_BASE_URL: "http://localhost:7075",
  SELFCARE_JWKS_PATH: "/.well-known/jwks.json",
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
  authorizedInstitutions: InstitutionResources,
  institution: Institution
) => ({
  id: jwtPayload.uid,
  name: `${jwtPayload.name} ${jwtPayload.family_name}`,
  email: jwtPayload.email,
  institution: {
    id: jwtPayload.organization.id,
    name: jwtPayload.organization.name,
    role: jwtPayload.organization.roles[0].role,
    logo_url: institution.logo
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

const aValidInstitution = (getMockInstitution() as unknown) as Institution;

const {
  getUserByEmail,
  getSubscription,
  getProductByName,
  upsertSubscription,
  createOrUpdateUser,
  createGroupUser
} = vi.hoisted(() => ({
  getUserByEmail: vi.fn(),
  getSubscription: vi.fn(),
  getProductByName: vi.fn(),
  upsertSubscription: vi.fn(),
  createOrUpdateUser: vi.fn(),
  createGroupUser: vi.fn()
}));

const { getApimService } = vi.hoisted(() => ({
  getApimService: vi.fn().mockReturnValue({
    getUserByEmail,
    getSubscription,
    getProductByName,
    upsertSubscription,
    createOrUpdateUser,
    createGroupUser
  })
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

const { getUserAuthorizedInstitutions, getInstitutionById } = vi.hoisted(
  () => ({
    getUserAuthorizedInstitutions: vi.fn(),
    getInstitutionById: vi.fn()
  })
);

vi.mock("@/lib/be/institutions/selfcare", () => ({
  getUserAuthorizedInstitutions,
  getInstitutionById
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
    expect(getApimService).not.toHaveBeenCalled();
    expect(createOrUpdateUser).not.toHaveBeenCalled();
    expect(createGroupUser).not.toHaveBeenCalled();
    expect(getSubscription).not.toHaveBeenCalled();
    expect(getProductByName).not.toHaveBeenCalled();
    expect(upsertSubscription).not.toHaveBeenCalled();
    expect(getUserAuthorizedInstitutions).not.toHaveBeenCalled();
    expect(getInstitutionById).not.toHaveBeenCalled();
  });

  it("should fail when token is not a JWT", async () => {
    jwtVerify.mockRejectedValueOnce("Invalid Compact JWS");

    await expect(() =>
      authorize(mockConfig)({ identity_token: "identity_token" }, {})
    ).rejects.toThrowError("Invalid Compact JWS");

    expect(jwtVerify).toHaveBeenCalledOnce();
    expect(getApimService).not.toHaveBeenCalled();
    expect(createOrUpdateUser).not.toHaveBeenCalled();
    expect(createGroupUser).not.toHaveBeenCalled();
    expect(getSubscription).not.toHaveBeenCalled();
    expect(getProductByName).not.toHaveBeenCalled();
    expect(upsertSubscription).not.toHaveBeenCalled();
    expect(getUserAuthorizedInstitutions).not.toHaveBeenCalled();
    expect(getInstitutionById).not.toHaveBeenCalled();
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
    expect(getApimService).not.toHaveBeenCalled();
    expect(createOrUpdateUser).not.toHaveBeenCalled();
    expect(createGroupUser).not.toHaveBeenCalled();
    expect(getSubscription).not.toHaveBeenCalled();
    expect(getProductByName).not.toHaveBeenCalled();
    expect(upsertSubscription).not.toHaveBeenCalled();
    expect(getUserAuthorizedInstitutions).not.toHaveBeenCalled();
    expect(getInstitutionById).not.toHaveBeenCalled();
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
    ).rejects.toThrowError(`Failed to create apim user, code: ${statusCode}`);

    expect(jwtVerify).toHaveBeenCalledOnce();
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
    expect(createGroupUser).not.toHaveBeenCalled();
    expect(getSubscription).not.toHaveBeenCalled();
    expect(getProductByName).not.toHaveBeenCalled();
    expect(upsertSubscription).not.toHaveBeenCalled();
    expect(getUserAuthorizedInstitutions).not.toHaveBeenCalled();
    expect(getInstitutionById).not.toHaveBeenCalled();
  });

  it("should fail when adding a gruop to newly created user and user-group association fail", async () => {
    const statusCode = 500;
    jwtVerify.mockResolvedValueOnce({
      payload: aValidJwtPayload
    });
    getUserByEmail.mockReturnValueOnce(TE.right(O.none));
    createOrUpdateUser.mockReturnValueOnce(TE.right(aValidApimUser));
    createGroupUser.mockReturnValueOnce(TE.left({ statusCode }));

    await expect(() =>
      authorize(mockConfig)({ identity_token: "identity_token" }, {})
    ).rejects.toThrowError(
      `Failed to create relationship between group (id = ${
        mockConfig.APIM_USER_GROUPS.split(",")[0]
      }) and user (id = ${aValidApimUser.name}), code: ${statusCode}`
    );

    const apimUserGroupsLength = mockConfig.APIM_USER_GROUPS.split(",").length;
    expect(jwtVerify).toHaveBeenCalledOnce();
    expect(getApimService).toHaveBeenCalledTimes(5);
    expect(getUserByEmail).toHaveBeenCalledOnce();
    expect(getUserByEmail).toHaveBeenCalledWith(
      getExpectedUserEmailReqParam(aValidJwtPayload.organization),
      true
    );
    expect(createOrUpdateUser).toHaveBeenCalledOnce();
    expect(createOrUpdateUser).toHaveBeenCalledWith(
      getExpectedCreateUserReqParam(aValidJwtPayload.organization)
    );
    expect(createGroupUser).toHaveBeenCalledTimes(
      mockConfig.APIM_USER_GROUPS.split(",").length
    );
    mockConfig.APIM_USER_GROUPS.split(",").forEach((groupId, index) =>
      expect(createGroupUser).toHaveBeenNthCalledWith(
        index + 1, // The count starts at 1 (https://vitest.dev/api/expect.html#tohavebeennthcalledwith)
        groupId,
        aValidApimUser.name
      )
    );
    expect(getSubscription).not.toHaveBeenCalled();
    expect(getProductByName).not.toHaveBeenCalled();
    expect(upsertSubscription).not.toHaveBeenCalled();
    expect(getUserAuthorizedInstitutions).not.toHaveBeenCalled();
    expect(getInstitutionById).not.toHaveBeenCalled();
  });

  it("should fail when fetching the newly created user and fetch fail", async () => {
    const statusCode = 500;
    jwtVerify.mockResolvedValueOnce({
      payload: aValidJwtPayload
    });
    getUserByEmail.mockReturnValueOnce(TE.right(O.none));
    createOrUpdateUser.mockReturnValueOnce(TE.right(aValidApimUser));
    createGroupUser.mockReturnValue(TE.right(aValidApimUser));
    getUserByEmail.mockReturnValueOnce(TE.left({ statusCode }));

    await expect(() =>
      authorize(mockConfig)({ identity_token: "identity_token" }, {})
    ).rejects.toThrowError(
      `Failed to fetch user by its email, code: ${statusCode}`
    );

    const apimUserGroupsLength = mockConfig.APIM_USER_GROUPS.split(",").length;
    expect(jwtVerify).toHaveBeenCalledOnce();
    expect(getApimService).toHaveBeenCalledTimes(3 + apimUserGroupsLength);
    expect(getUserByEmail).toHaveBeenCalledTimes(2);
    expect(getUserByEmail).toHaveBeenCalledWith(
      getExpectedUserEmailReqParam(aValidJwtPayload.organization),
      true
    );
    expect(createOrUpdateUser).toHaveBeenCalledOnce();
    expect(createOrUpdateUser).toHaveBeenCalledWith(
      getExpectedCreateUserReqParam(aValidJwtPayload.organization)
    );
    expect(createGroupUser).toHaveBeenCalledTimes(apimUserGroupsLength);
    mockConfig.APIM_USER_GROUPS.split(",").forEach((groupId, index) =>
      expect(createGroupUser).toHaveBeenNthCalledWith(
        index + 1, // The count starts at 1 (https://vitest.dev/api/expect.html#tohavebeennthcalledwith)
        groupId,
        aValidApimUser.name
      )
    );
    expect(getSubscription).not.toHaveBeenCalled();
    expect(getProductByName).not.toHaveBeenCalled();
    expect(upsertSubscription).not.toHaveBeenCalled();
    expect(getUserAuthorizedInstitutions).not.toHaveBeenCalled();
    expect(getInstitutionById).not.toHaveBeenCalled();
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
    expect(getApimService).toHaveBeenCalledOnce();
    expect(getUserByEmail).toHaveBeenCalledOnce();
    expect(getUserByEmail).toHaveBeenCalledWith(
      getExpectedUserEmailReqParam(aValidJwtPayload.organization),
      true
    );
    expect(createOrUpdateUser).not.toHaveBeenCalled();
    expect(createGroupUser).not.toHaveBeenCalled();
    expect(getSubscription).not.toHaveBeenCalled();
    expect(getProductByName).not.toHaveBeenCalled();
    expect(upsertSubscription).not.toHaveBeenCalled();
    expect(getUserAuthorizedInstitutions).not.toHaveBeenCalled();
    expect(getInstitutionById).not.toHaveBeenCalled();
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
    expect(getApimService).toHaveBeenCalledOnce();
    expect(getUserByEmail).toHaveBeenCalledOnce();
    expect(getUserByEmail).toHaveBeenCalledWith(
      getExpectedUserEmailReqParam(aValidJwtPayload.organization),
      true
    );
    expect(createOrUpdateUser).not.toHaveBeenCalled();
    expect(createGroupUser).not.toHaveBeenCalled();
    expect(getSubscription).not.toHaveBeenCalled();
    expect(getProductByName).not.toHaveBeenCalled();
    expect(upsertSubscription).not.toHaveBeenCalled();
    expect(getUserAuthorizedInstitutions).not.toHaveBeenCalled();
    expect(getInstitutionById).not.toHaveBeenCalled();
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
    expect(createGroupUser).not.toHaveBeenCalled();
    expect(getProductByName).not.toHaveBeenCalled();
    expect(upsertSubscription).not.toHaveBeenCalled();
    expect(getUserAuthorizedInstitutions).not.toHaveBeenCalled();
    expect(getInstitutionById).not.toHaveBeenCalled();
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
    expect(createGroupUser).not.toHaveBeenCalled();
    expect(upsertSubscription).not.toHaveBeenCalled();
    expect(getUserAuthorizedInstitutions).not.toHaveBeenCalled();
    expect(getInstitutionById).not.toHaveBeenCalled();
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
    expect(createGroupUser).not.toHaveBeenCalled();
    expect(getUserAuthorizedInstitutions).not.toHaveBeenCalled();
    expect(getInstitutionById).not.toHaveBeenCalled();
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
    expect(createGroupUser).not.toHaveBeenCalled();
    expect(getUserAuthorizedInstitutions).not.toHaveBeenCalled();
    expect(getInstitutionById).not.toHaveBeenCalled();
  });

  it("should fail when retrieve user authorized institutions fail", async () => {
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
    expect(createGroupUser).not.toHaveBeenCalled();
    expect(getProductByName).not.toHaveBeenCalled();
    expect(upsertSubscription).not.toHaveBeenCalled();
    expect(getInstitutionById).not.toHaveBeenCalled();
  });

  it("should fail when retrieve logged institution details", async () => {
    const errorMessage = "Rejected getInstitutionById";
    jwtVerify.mockResolvedValueOnce({
      payload: aValidJwtPayload
    });
    getUserByEmail.mockImplementation(() => TE.right(O.some(aValidApimUser)));
    getSubscription.mockReturnValueOnce(TE.right(aValidSubscription));
    getUserAuthorizedInstitutions.mockResolvedValueOnce(aValidInstitutions);
    getInstitutionById.mockRejectedValueOnce(errorMessage);

    await expect(() =>
      authorize(mockConfig)({ identity_token: "identity_token" }, {})
    ).rejects.toThrowError(errorMessage);

    expect(jwtVerify).toHaveBeenCalledOnce();
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
    expect(getInstitutionById).toHaveBeenCalledOnce();
    expect(getInstitutionById).toHaveBeenCalledWith(
      aValidJwtPayload.organization.id
    );
    expect(createOrUpdateUser).not.toHaveBeenCalled();
    expect(createGroupUser).not.toHaveBeenCalled();
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
    getInstitutionById.mockResolvedValueOnce(aValidInstitution);

    const user = await authorize(mockConfig)(
      { identity_token: "identity_token" },
      {}
    );

    expect(user).toEqual(
      getExpectedUser(
        aValidJwtPayload,
        aValidApimUser,
        aValidSubscription,
        aValidInstitutions,
        aValidInstitution
      )
    );
    expect(jwtVerify).toHaveBeenCalledOnce();
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
    expect(getInstitutionById).toHaveBeenCalledOnce();
    expect(getInstitutionById).toHaveBeenCalledWith(
      aValidJwtPayload.organization.id
    );
    expect(createOrUpdateUser).not.toHaveBeenCalled();
    expect(createGroupUser).not.toHaveBeenCalled();
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
    createGroupUser.mockReturnValue(TE.right(aValidApimUser));
    getUserByEmail.mockReturnValueOnce(TE.right(O.some(aValidApimUser)));
    getSubscription.mockReturnValueOnce(TE.left({ statusCode: 404 }));
    getProductByName.mockReturnValueOnce(TE.right(O.some({ id: productId })));
    upsertSubscription.mockReturnValueOnce(TE.right(aValidSubscription));
    getUserAuthorizedInstitutions.mockResolvedValueOnce(aValidInstitutions);
    getInstitutionById.mockResolvedValueOnce(aValidInstitution);

    const user = await authorize(mockConfig)(
      { identity_token: "identity_token" },
      {}
    );

    expect(user).toEqual(
      getExpectedUser(
        aValidJwtPayload,
        aValidApimUser,
        aValidSubscription,
        aValidInstitutions,
        aValidInstitution
      )
    );

    const apimUserGroupsLength = mockConfig.APIM_USER_GROUPS.split(",").length;
    expect(jwtVerify).toHaveBeenCalledOnce();
    expect(getApimService).toHaveBeenCalledTimes(6 + apimUserGroupsLength);
    expect(getUserByEmail).toHaveBeenCalledTimes(2);
    expect(getUserByEmail).toHaveBeenCalledWith(
      getExpectedUserEmailReqParam(aValidJwtPayload.organization),
      true
    );
    expect(createOrUpdateUser).toHaveBeenCalledOnce();
    expect(createOrUpdateUser).toHaveBeenCalledWith(
      getExpectedCreateUserReqParam(aValidJwtPayload.organization)
    );
    expect(createGroupUser).toHaveBeenCalledTimes(apimUserGroupsLength);
    mockConfig.APIM_USER_GROUPS.split(",").forEach((groupId, index) =>
      expect(createGroupUser).toHaveBeenNthCalledWith(
        index + 1, // The count starts at 1 (https://vitest.dev/api/expect.html#tohavebeennthcalledwith)
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
    expect(getInstitutionById).toHaveBeenCalledOnce();
    expect(getInstitutionById).toHaveBeenCalledWith(
      aValidJwtPayload.organization.id
    );
  });
});
