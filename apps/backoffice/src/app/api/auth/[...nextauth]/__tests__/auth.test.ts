import { faker } from "@faker-js/faker/locale/it";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getMockInstitution } from "../../../../../../mocks/data/selfcare-data";
import { Configuration } from "../../../../../config";
import { Institution } from "../../../../../generated/selfcare/Institution";
import { IdentityTokenPayload } from "../../types";
import { authorize } from "../auth";

vi.hoisted(() => {
  const originalEnv = process.env;
  process.env = {
    ...originalEnv,
    GROUP_AUTHZ_ENABLED: "true",
  };
});

const mockConfig = {
  SELFCARE_JWKS_URL: "http://localhost:7075/.well-known/jwks.json",
  APIM_USER_GROUPS: faker.helpers.multiple(faker.string.alpha).join(","),
  AZURE_APIM_PRODUCT_NAME: faker.string.alpha(),
} as unknown as Configuration;

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
  fiscal_number: faker.helpers.fromRegExp(
    /[A-Z]{6}[0-9LMNPQRSTUV]{2}[ABCDEHLMPRST][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z]/,
  ),
  desired_exp: faker.number.int(),
  organization: {
    id: faker.string.uuid(),
    fiscal_code: faker.helpers.fromRegExp(/[0-9]{11}/),
    name: faker.company.name(),
    roles: [
      {
        partyRole: faker.string.alpha(),
        role: faker.string.alpha(),
      },
    ],
    groups: [faker.string.alpha()],
  },
} as IdentityTokenPayload;

const aValidApimUser = {
  id: faker.string.uuid(),
  name: faker.string.uuid(),
  email: `org.${aValidJwtPayload.organization.id}@selfcare.io.pagopa.it`,
  groups: [
    {
      type: "custom",
      name: faker.string.alpha(),
    },
    {
      type: "custom",
      name: "ApiServiceWrite",
    },
  ],
};

const aValidSubscription = {
  name: `MANAGE-${aValidApimUser.name}`,
};

const getExpectedCreateUserReqParam = (
  organization: IdentityTokenPayload["organization"],
) => ({
  email: `org.${organization.id}@selfcare.io.pagopa.it`,
  firstName: organization.fiscal_code,
  lastName: organization.id,
  note: organization.name,
});

const getExpectedUserEmailReqParam = (
  organization: IdentityTokenPayload["organization"],
) => `org.${organization.id}@selfcare.io.pagopa.it`;

const getExpectedUser = (
  jwtPayload: IdentityTokenPayload,
  apimUser: typeof aValidApimUser,
  manageSubscription: typeof aValidSubscription,
  institution: Institution,
) => ({
  id: jwtPayload.uid,
  name: `${jwtPayload.name} ${jwtPayload.family_name}`,
  email: jwtPayload.email,
  institution: {
    id: jwtPayload.organization.id,
    name: jwtPayload.organization.name,
    fiscalCode: jwtPayload.organization.fiscal_code,
    role: jwtPayload.organization.roles[0].role,
    logo_url: institution.logo,
  },
  permissions: {
    apimGroups: apimUser.groups
      .filter((group) => group.type === "custom")
      .map((group) => group.name),
    selcGroups: jwtPayload.organization.groups,
  },
  parameters: {
    userId: apimUser.name,
    userEmail: apimUser.email,
    subscriptionId: manageSubscription.name,
  },
});

const aValidInstitution = getMockInstitution() as unknown as Institution;

const {
  getUserByEmail,
  getSubscription,
  upsertSubscription,
  createOrUpdateUser,
  createGroupUser,
} = vi.hoisted(() => ({
  getUserByEmail: vi.fn(),
  getSubscription: vi.fn(),
  upsertSubscription: vi.fn(),
  createOrUpdateUser: vi.fn(),
  createGroupUser: vi.fn(),
}));

const { getApimService } = vi.hoisted(() => ({
  getApimService: vi.fn().mockReturnValue({
    getUserByEmail,
    getSubscription,
    createOrUpdateUser,
    createGroupUser,
  }),
}));

vi.mock("@/lib/be/apim-service", () => ({
  getApimService,
  upsertSubscription,
}));

const { jwtVerify } = vi.hoisted(() => ({
  jwtVerify: vi.fn(),
}));

vi.mock("jose", async (importOriginal) => {
  const mod = await importOriginal();

  return {
    ...(mod as any),
    jwtVerify,
  };
});

const { getInstitutionById } = vi.hoisted(() => ({
  getInstitutionById: vi.fn(),
}));

vi.mock("@/lib/be/institutions/selfcare", () => ({
  getInstitutionById,
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe("Authorize", () => {
  it("should fail when credentials is not valid", async () => {
    await expect(() =>
      authorize(mockConfig)({ invalidParam: "identity_token" }, {}),
    ).rejects.toThrowError(/is not a valid/);

    expect(jwtVerify).not.toHaveBeenCalled();
    expect(getApimService).not.toHaveBeenCalled();
    expect(createOrUpdateUser).not.toHaveBeenCalled();
    expect(createGroupUser).not.toHaveBeenCalled();
    expect(getSubscription).not.toHaveBeenCalled();
    expect(upsertSubscription).not.toHaveBeenCalled();
    expect(getInstitutionById).not.toHaveBeenCalled();
  });

  it("should fail when token is not a JWT", async () => {
    jwtVerify.mockRejectedValueOnce("Invalid Compact JWS");

    await expect(() =>
      authorize(mockConfig)({ identity_token: "identity_token" }, {}),
    ).rejects.toThrowError("Invalid Compact JWS");

    expect(jwtVerify).toHaveBeenCalledOnce();
    expect(getApimService).not.toHaveBeenCalled();
    expect(createOrUpdateUser).not.toHaveBeenCalled();
    expect(createGroupUser).not.toHaveBeenCalled();
    expect(getSubscription).not.toHaveBeenCalled();
    expect(upsertSubscription).not.toHaveBeenCalled();
    expect(getInstitutionById).not.toHaveBeenCalled();
  });

  it("should fail when JWT payload is not a valid IdentityToken", async () => {
    const { uid, ...anInvalidJwtPayload } = aValidJwtPayload;
    jwtVerify.mockResolvedValueOnce({
      payload: anInvalidJwtPayload,
    });

    await expect(() =>
      authorize(mockConfig)(
        {
          identity_token: "identity_token",
        },
        {},
      ),
    ).rejects.toThrowError(/is not a valid/);

    expect(jwtVerify).toHaveBeenCalledOnce();
    expect(getApimService).not.toHaveBeenCalled();
    expect(createOrUpdateUser).not.toHaveBeenCalled();
    expect(createGroupUser).not.toHaveBeenCalled();
    expect(getSubscription).not.toHaveBeenCalled();
    expect(upsertSubscription).not.toHaveBeenCalled();
    expect(getInstitutionById).not.toHaveBeenCalled();
  });

  it("should fail when creating a new Apim user and creation fail", async () => {
    const statusCode = 500;
    jwtVerify.mockResolvedValueOnce({
      payload: aValidJwtPayload,
    });
    getUserByEmail.mockReturnValueOnce(TE.right(O.none));
    createOrUpdateUser.mockReturnValueOnce(TE.left({ statusCode }));

    await expect(() =>
      authorize(mockConfig)({ identity_token: "identity_token" }, {}),
    ).rejects.toThrowError(`Failed to create apim user`);

    expect(jwtVerify).toHaveBeenCalledOnce();
    expect(getApimService).toHaveBeenCalledTimes(2);
    expect(getUserByEmail).toHaveBeenCalledOnce();
    expect(getUserByEmail).toHaveBeenCalledWith(
      getExpectedUserEmailReqParam(aValidJwtPayload.organization),
      true,
    );
    expect(createOrUpdateUser).toHaveBeenCalledOnce();
    expect(createOrUpdateUser).toHaveBeenCalledWith(
      getExpectedCreateUserReqParam(aValidJwtPayload.organization),
    );
    expect(createGroupUser).not.toHaveBeenCalled();
    expect(getSubscription).not.toHaveBeenCalled();
    expect(upsertSubscription).not.toHaveBeenCalled();
    expect(getInstitutionById).not.toHaveBeenCalled();
  });

  it("should fail when adding a gruop to newly created user and user-group association fail", async () => {
    const statusCode = 500;
    jwtVerify.mockResolvedValueOnce({
      payload: aValidJwtPayload,
    });
    getUserByEmail.mockReturnValueOnce(TE.right(O.none));
    createOrUpdateUser.mockReturnValueOnce(TE.right(aValidApimUser));
    createGroupUser.mockReturnValueOnce(TE.left({ statusCode }));

    await expect(() =>
      authorize(mockConfig)({ identity_token: "identity_token" }, {}),
    ).rejects.toThrowError(
      `Failed to create relationship between group (id = ${
        mockConfig.APIM_USER_GROUPS.split(",")[0]
      }) and user (id = ${aValidApimUser.name})`,
    );

    const apimUserGroupsLength = mockConfig.APIM_USER_GROUPS.split(",").length;
    expect(jwtVerify).toHaveBeenCalledOnce();
    expect(getApimService).toHaveBeenCalledTimes(5);
    expect(getUserByEmail).toHaveBeenCalledOnce();
    expect(getUserByEmail).toHaveBeenCalledWith(
      getExpectedUserEmailReqParam(aValidJwtPayload.organization),
      true,
    );
    expect(createOrUpdateUser).toHaveBeenCalledOnce();
    expect(createOrUpdateUser).toHaveBeenCalledWith(
      getExpectedCreateUserReqParam(aValidJwtPayload.organization),
    );
    expect(createGroupUser).toHaveBeenCalledTimes(
      mockConfig.APIM_USER_GROUPS.split(",").length,
    );
    mockConfig.APIM_USER_GROUPS.split(",").forEach((groupId, index) =>
      expect(createGroupUser).toHaveBeenNthCalledWith(
        index + 1, // The count starts at 1 (https://vitest.dev/api/expect.html#tohavebeennthcalledwith)
        groupId,
        aValidApimUser.name,
      ),
    );
    expect(getSubscription).not.toHaveBeenCalled();
    expect(upsertSubscription).not.toHaveBeenCalled();
    expect(getInstitutionById).not.toHaveBeenCalled();
  });

  it("should fail when fetching the newly created user and fetch fail", async () => {
    const statusCode = 500;
    jwtVerify.mockResolvedValueOnce({
      payload: aValidJwtPayload,
    });
    getUserByEmail.mockReturnValueOnce(TE.right(O.none));
    createOrUpdateUser.mockReturnValueOnce(TE.right(aValidApimUser));
    createGroupUser.mockReturnValue(TE.right(aValidApimUser));
    getUserByEmail.mockReturnValueOnce(TE.left({ statusCode }));

    await expect(() =>
      authorize(mockConfig)({ identity_token: "identity_token" }, {}),
    ).rejects.toThrowError(`Failed to fetch user by its email`);

    const apimUserGroupsLength = mockConfig.APIM_USER_GROUPS.split(",").length;
    expect(jwtVerify).toHaveBeenCalledOnce();
    expect(getApimService).toHaveBeenCalledTimes(3 + apimUserGroupsLength);
    expect(getUserByEmail).toHaveBeenCalledTimes(2);
    expect(getUserByEmail).toHaveBeenCalledWith(
      getExpectedUserEmailReqParam(aValidJwtPayload.organization),
      true,
    );
    expect(createOrUpdateUser).toHaveBeenCalledOnce();
    expect(createOrUpdateUser).toHaveBeenCalledWith(
      getExpectedCreateUserReqParam(aValidJwtPayload.organization),
    );
    expect(createGroupUser).toHaveBeenCalledTimes(apimUserGroupsLength);
    mockConfig.APIM_USER_GROUPS.split(",").forEach((groupId, index) =>
      expect(createGroupUser).toHaveBeenNthCalledWith(
        index + 1, // The count starts at 1 (https://vitest.dev/api/expect.html#tohavebeennthcalledwith)
        groupId,
        aValidApimUser.name,
      ),
    );
    expect(getSubscription).not.toHaveBeenCalled();
    expect(upsertSubscription).not.toHaveBeenCalled();
    expect(getInstitutionById).not.toHaveBeenCalled();
  });

  it("should fail when adding missing ApiServiceWrite group to existing user", async () => {
    const statusCode = 500;
    const missingUserGroup = "apiservicewrite";
    jwtVerify.mockResolvedValueOnce({
      payload: aValidJwtPayload,
    });
    getUserByEmail.mockReturnValueOnce(
      TE.right(
        O.some({
          ...aValidApimUser,
          groups: aValidApimUser.groups.filter(
            (g) => g.name !== "ApiServiceWrite",
          ),
        }),
      ),
    );
    createGroupUser.mockReturnValueOnce(TE.left({ statusCode }));

    await expect(() =>
      authorize(mockConfig)({ identity_token: "identity_token" }, {}),
    ).rejects.toThrowError(
      `Failed to create relationship between group (id = ${missingUserGroup}) and user (id = ${aValidApimUser.name})`,
    );

    expect(jwtVerify).toHaveBeenCalledOnce();
    expect(getApimService).toHaveBeenCalledTimes(2);
    expect(getUserByEmail).toHaveBeenCalledOnce();
    expect(getUserByEmail).toHaveBeenCalledWith(
      getExpectedUserEmailReqParam(aValidJwtPayload.organization),
      true,
    );
    expect(createGroupUser).toHaveBeenCalledOnce();
    expect(createGroupUser).toHaveBeenCalledWith(
      missingUserGroup,
      aValidApimUser.name,
    );
    expect(createOrUpdateUser).not.toHaveBeenCalled();
    expect(getSubscription).not.toHaveBeenCalled();
    expect(upsertSubscription).not.toHaveBeenCalled();
    expect(getInstitutionById).not.toHaveBeenCalled();
  });

  it("should fail when fetching user after adding missing ApiServiceWrite group to existing user", async () => {
    const statusCode = 500;
    const missingUserGroup = "apiservicewrite";
    jwtVerify.mockResolvedValueOnce({
      payload: aValidJwtPayload,
    });
    getUserByEmail.mockReturnValueOnce(
      TE.right(
        O.some({
          ...aValidApimUser,
          groups: aValidApimUser.groups.filter(
            (g) => g.name !== "ApiServiceWrite",
          ),
        }),
      ),
    );
    createGroupUser.mockReturnValueOnce(TE.right(aValidApimUser));
    getUserByEmail.mockReturnValueOnce(TE.left({ statusCode }));

    await expect(() =>
      authorize(mockConfig)({ identity_token: "identity_token" }, {}),
    ).rejects.toThrowError(`Failed to fetch user by its email`);

    expect(jwtVerify).toHaveBeenCalledOnce();
    expect(getApimService).toHaveBeenCalledTimes(3);
    expect(getUserByEmail).toHaveBeenCalledTimes(2);
    expect(getUserByEmail).toHaveBeenCalledWith(
      getExpectedUserEmailReqParam(aValidJwtPayload.organization),
      true,
    );
    expect(createGroupUser).toHaveBeenCalledOnce();
    expect(createGroupUser).toHaveBeenCalledWith(
      missingUserGroup,
      aValidApimUser.name,
    );
    expect(createOrUpdateUser).not.toHaveBeenCalled();
    expect(getSubscription).not.toHaveBeenCalled();
    expect(upsertSubscription).not.toHaveBeenCalled();
    expect(getInstitutionById).not.toHaveBeenCalled();
  });

  it("should fail if no user is retrieved after adding missing ApiServiceWrite group to existing user", async () => {
    const missingUserGroup = "apiservicewrite";
    jwtVerify.mockResolvedValueOnce({
      payload: aValidJwtPayload,
    });
    getUserByEmail.mockReturnValueOnce(
      TE.right(
        O.some({
          ...aValidApimUser,
          groups: aValidApimUser.groups.filter(
            (g) => g.name !== "ApiServiceWrite",
          ),
        }),
      ),
    );
    createGroupUser.mockReturnValueOnce(TE.right(aValidApimUser));
    getUserByEmail.mockReturnValueOnce(TE.right(O.none));

    await expect(() =>
      authorize(mockConfig)({ identity_token: "identity_token" }, {}),
    ).rejects.toThrowError("Cannot find user");

    expect(jwtVerify).toHaveBeenCalledOnce();
    expect(getApimService).toHaveBeenCalledTimes(3);
    expect(getUserByEmail).toHaveBeenCalledTimes(2);
    expect(getUserByEmail).toHaveBeenCalledWith(
      getExpectedUserEmailReqParam(aValidJwtPayload.organization),
      true,
    );
    expect(createGroupUser).toHaveBeenCalledOnce();
    expect(createGroupUser).toHaveBeenCalledWith(
      missingUserGroup,
      aValidApimUser.name,
    );
    expect(createOrUpdateUser).not.toHaveBeenCalled();
    expect(getSubscription).not.toHaveBeenCalled();
    expect(upsertSubscription).not.toHaveBeenCalled();
    expect(getInstitutionById).not.toHaveBeenCalled();
  });

  it("should fail when retrieved Apim user is not valid", async () => {
    jwtVerify.mockResolvedValueOnce({
      payload: aValidJwtPayload,
    });
    getUserByEmail.mockReturnValueOnce(
      TE.right(O.some({ ...aValidApimUser, name: undefined })),
    );

    await expect(() =>
      authorize(mockConfig)({ identity_token: "identity_token" }, {}),
    ).rejects.toThrowError(/is not a valid/);

    expect(jwtVerify).toHaveBeenCalledOnce();
    expect(getApimService).toHaveBeenCalledOnce();
    expect(getUserByEmail).toHaveBeenCalledOnce();
    expect(getUserByEmail).toHaveBeenCalledWith(
      getExpectedUserEmailReqParam(aValidJwtPayload.organization),
      true,
    );
    expect(createOrUpdateUser).not.toHaveBeenCalled();
    expect(createGroupUser).not.toHaveBeenCalled();
    expect(getSubscription).not.toHaveBeenCalled();
    expect(upsertSubscription).not.toHaveBeenCalled();
    expect(getInstitutionById).not.toHaveBeenCalled();
  });

  it("should fail when retrieving user manage subscription fail", async () => {
    jwtVerify.mockResolvedValueOnce({
      payload: aValidJwtPayload,
    });
    getUserByEmail.mockReturnValueOnce(TE.right(O.some(aValidApimUser)));
    const statusCode = 500;
    const apimErrorName = "APIM Failure";
    const apimErrorCode = 500;
    getSubscription.mockReturnValueOnce(
      TE.left({ statusCode, name: apimErrorName, code: apimErrorCode }),
    );

    await expect(() =>
      authorize(mockConfig)({ identity_token: "identity_token" }, {}),
    ).rejects.toThrowError(
      `Failed to fetch user subscription manage (MANAGE-${aValidApimUser.name})`,
    );

    expect(jwtVerify).toHaveBeenCalledOnce();
    expect(getApimService).toHaveBeenCalledTimes(2);
    expect(getUserByEmail).toHaveBeenCalledOnce();
    expect(getUserByEmail).toHaveBeenCalledWith(
      getExpectedUserEmailReqParam(aValidJwtPayload.organization),
      true,
    );
    expect(getSubscription).toHaveBeenCalledOnce();
    expect(getSubscription).toHaveBeenCalledWith(
      `MANAGE-${aValidApimUser.name}`,
    );
    expect(createOrUpdateUser).not.toHaveBeenCalled();
    expect(createGroupUser).not.toHaveBeenCalled();
    expect(upsertSubscription).not.toHaveBeenCalled();
    expect(getInstitutionById).not.toHaveBeenCalled();
  });

  it("should fail when manage subscription is not found and fail to create it", async () => {
    const statusCode = 500;
    jwtVerify.mockResolvedValueOnce({
      payload: aValidJwtPayload,
    });
    getUserByEmail.mockReturnValueOnce(TE.right(O.some(aValidApimUser)));
    getSubscription.mockReturnValueOnce(TE.left({ statusCode: 404 }));
    upsertSubscription.mockReturnValueOnce(TE.left({ statusCode }));

    await expect(() =>
      authorize(mockConfig)({ identity_token: "identity_token" }, {}),
    ).rejects.toThrowError(`Failed to create subscription manage`);

    expect(jwtVerify).toHaveBeenCalledOnce();
    expect(getApimService).toHaveBeenCalledTimes(2);
    expect(getUserByEmail).toHaveBeenCalledOnce();
    expect(getUserByEmail).toHaveBeenCalledWith(
      getExpectedUserEmailReqParam(aValidJwtPayload.organization),
      true,
    );
    expect(getSubscription).toHaveBeenCalledOnce();
    expect(getSubscription).toHaveBeenCalledWith(
      `MANAGE-${aValidApimUser.name}`,
    );
    expect(upsertSubscription).toHaveBeenCalledOnce();
    expect(upsertSubscription).toHaveBeenCalledWith(
      "MANAGE",
      aValidApimUser.name,
    );
    expect(createOrUpdateUser).not.toHaveBeenCalled();
    expect(createGroupUser).not.toHaveBeenCalled();
    expect(getInstitutionById).not.toHaveBeenCalled();
  });

  it("should fail when manage subscription is not found and the new one is not valid", async () => {
    const invalidSubscriptionName = undefined;
    jwtVerify.mockResolvedValueOnce({
      payload: aValidJwtPayload,
    });
    getUserByEmail.mockReturnValueOnce(TE.right(O.some(aValidApimUser)));
    getSubscription.mockReturnValueOnce(TE.left({ statusCode: 404 }));
    upsertSubscription.mockReturnValueOnce(
      TE.right({ ...aValidSubscription, name: invalidSubscriptionName }),
    );

    await expect(() =>
      authorize(mockConfig)({ identity_token: "identity_token" }, {}),
    ).rejects.toThrowError(/is not a valid/);

    expect(jwtVerify).toHaveBeenCalledOnce();
    expect(getApimService).toHaveBeenCalledTimes(2);
    expect(getUserByEmail).toHaveBeenCalledOnce();
    expect(getUserByEmail).toHaveBeenCalledWith(
      getExpectedUserEmailReqParam(aValidJwtPayload.organization),
      true,
    );
    expect(getSubscription).toHaveBeenCalledOnce();
    expect(getSubscription).toHaveBeenCalledWith(
      `MANAGE-${aValidApimUser.name}`,
    );
    expect(upsertSubscription).toHaveBeenCalledOnce();
    expect(upsertSubscription).toHaveBeenCalledWith(
      "MANAGE",
      aValidApimUser.name,
    );
    expect(createOrUpdateUser).not.toHaveBeenCalled();
    expect(createGroupUser).not.toHaveBeenCalled();
    expect(getInstitutionById).not.toHaveBeenCalled();
  });

  it("should fail when retrieve logged institution details", async () => {
    const errorMessage = "Rejected getInstitutionById";
    jwtVerify.mockResolvedValueOnce({
      payload: aValidJwtPayload,
    });
    getUserByEmail.mockImplementation(() => TE.right(O.some(aValidApimUser)));
    getSubscription.mockReturnValueOnce(TE.right(aValidSubscription));
    getInstitutionById.mockRejectedValueOnce(new Error(errorMessage));

    await expect(() =>
      authorize(mockConfig)({ identity_token: "identity_token" }, {}),
    ).rejects.toThrowError(errorMessage);

    expect(jwtVerify).toHaveBeenCalledOnce();
    expect(getApimService).toHaveBeenCalledTimes(2);
    expect(getUserByEmail).toHaveBeenCalledOnce();
    expect(getUserByEmail).toHaveBeenCalledWith(
      getExpectedUserEmailReqParam(aValidJwtPayload.organization),
      true,
    );
    expect(getSubscription).toHaveBeenCalledOnce();
    expect(getSubscription).toHaveBeenCalledWith(
      `MANAGE-${aValidApimUser.name}`,
    );
    expect(getInstitutionById).toHaveBeenCalledOnce();
    expect(getInstitutionById).toHaveBeenCalledWith(
      aValidJwtPayload.organization.id,
    );
    expect(createOrUpdateUser).not.toHaveBeenCalled();
    expect(createGroupUser).not.toHaveBeenCalled();
    expect(upsertSubscription).not.toHaveBeenCalled();
  });

  it("should return a valid backoffice User when both APIM users and its manage subscription exists", async () => {
    jwtVerify.mockResolvedValueOnce({
      payload: aValidJwtPayload,
    });
    getUserByEmail.mockImplementation(() => TE.right(O.some(aValidApimUser)));
    getSubscription.mockReturnValueOnce(TE.right(aValidSubscription));
    getInstitutionById.mockResolvedValueOnce(aValidInstitution);

    const user = await authorize(mockConfig)(
      { identity_token: "identity_token" },
      {},
    );

    expect(user).toEqual(
      getExpectedUser(
        aValidJwtPayload,
        aValidApimUser,
        aValidSubscription,
        aValidInstitution,
      ),
    );
    expect(jwtVerify).toHaveBeenCalledOnce();
    expect(getApimService).toHaveBeenCalledTimes(2);
    expect(getUserByEmail).toHaveBeenCalledOnce();
    expect(getUserByEmail).toHaveBeenCalledWith(aValidApimUser.email, true);
    expect(getSubscription).toHaveBeenCalledOnce();
    expect(getSubscription).toHaveBeenCalledWith(
      `MANAGE-${aValidApimUser.name}`,
    );
    expect(getInstitutionById).toHaveBeenCalledOnce();
    expect(getInstitutionById).toHaveBeenCalledWith(
      aValidJwtPayload.organization.id,
    );
    expect(createOrUpdateUser).not.toHaveBeenCalled();
    expect(createGroupUser).not.toHaveBeenCalled();
    expect(upsertSubscription).not.toHaveBeenCalled();
  });

  it("should return a valid backoffice User when both APIM users and its manage subscription does not exists", async () => {
    jwtVerify.mockResolvedValueOnce({
      payload: aValidJwtPayload,
    });
    getUserByEmail.mockReturnValueOnce(TE.right(O.none));
    createOrUpdateUser.mockReturnValueOnce(TE.right(aValidApimUser));
    createGroupUser.mockReturnValue(TE.right(aValidApimUser));
    getUserByEmail.mockReturnValueOnce(TE.right(O.some(aValidApimUser)));
    getSubscription.mockReturnValueOnce(TE.left({ statusCode: 404 }));
    upsertSubscription.mockReturnValueOnce(TE.right(aValidSubscription));
    getInstitutionById.mockResolvedValueOnce(aValidInstitution);

    const user = await authorize(mockConfig)(
      { identity_token: "identity_token" },
      {},
    );

    expect(user).toEqual(
      getExpectedUser(
        aValidJwtPayload,
        aValidApimUser,
        aValidSubscription,
        aValidInstitution,
      ),
    );

    const apimUserGroupsLength = mockConfig.APIM_USER_GROUPS.split(",").length;
    expect(jwtVerify).toHaveBeenCalledOnce();
    expect(getApimService).toHaveBeenCalledTimes(4 + apimUserGroupsLength);
    expect(getUserByEmail).toHaveBeenCalledTimes(2);
    expect(getUserByEmail).toHaveBeenCalledWith(
      getExpectedUserEmailReqParam(aValidJwtPayload.organization),
      true,
    );
    expect(createOrUpdateUser).toHaveBeenCalledOnce();
    expect(createOrUpdateUser).toHaveBeenCalledWith(
      getExpectedCreateUserReqParam(aValidJwtPayload.organization),
    );
    expect(createGroupUser).toHaveBeenCalledTimes(apimUserGroupsLength);
    mockConfig.APIM_USER_GROUPS.split(",").forEach((groupId, index) =>
      expect(createGroupUser).toHaveBeenNthCalledWith(
        index + 1, // The count starts at 1 (https://vitest.dev/api/expect.html#tohavebeennthcalledwith)
        groupId,
        aValidApimUser.name,
      ),
    );
    expect(getSubscription).toHaveBeenCalledOnce();
    expect(getSubscription).toHaveBeenCalledWith(
      `MANAGE-${aValidApimUser.name}`,
    );
    expect(upsertSubscription).toHaveBeenCalledOnce();
    expect(upsertSubscription).toHaveBeenCalledWith(
      "MANAGE",
      aValidApimUser.name,
    );
    expect(getInstitutionById).toHaveBeenCalledOnce();
    expect(getInstitutionById).toHaveBeenCalledWith(
      aValidJwtPayload.organization.id,
    );
  });
});
