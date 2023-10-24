import { faker } from "@faker-js/faker/locale/it";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Configuration } from "../../../../../config";
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
  APIM_USER_GROUPS: faker.helpers.multiple(faker.string.alpha).join(",")
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
    }
  ]
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
  apimUser: typeof aValidApimUser
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
  authorizedInstitutions: [
    { id: "id_2", name: "Comune di Roma", role: "operator" }
  ],
  permissions: apimUser.groups
    .filter(group => group.type === "custom")
    .map(group => group.name),
  parameters: {
    userId: apimUser.name,
    userEmail: apimUser.email,
    subscriptionId: mockConfig.AZURE_SUBSCRIPTION_ID
  }
});

const mockApimClient = vi.hoisted(() => ({
  user: {
    createOrUpdate: vi.fn()
  },
  groupUser: {
    create: vi.fn()
  }
}));

const { getUserByEmail } = vi.hoisted(() => ({
  getUserByEmail: vi.fn()
}));

const { getApimClient, getApimService } = vi.hoisted(() => ({
  getApimClient: vi.fn().mockReturnValue(mockApimClient),
  getApimService: vi.fn().mockReturnValue({
    getUserByEmail
  })
}));

vi.mock("@io-services-cms/external-clients", () => ({
  ApimUtils: { getApimClient, getApimService }
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
    expect(mockApimClient.user.createOrUpdate).not.toHaveBeenCalled();
    expect(mockApimClient.groupUser.create).not.toHaveBeenCalled();
  });

  it("should fail when token is not a JWT", async () => {
    jwtVerify.mockRejectedValueOnce("Invalid Compact JWS");

    await expect(() =>
      authorize(mockConfig)({ identity_token: "identity_token" }, {})
    ).rejects.toThrowError("Invalid Compact JWS");

    expect(jwtVerify).toHaveBeenCalledOnce();
    expect(getApimClient).not.toHaveBeenCalled();
    expect(getApimService).not.toHaveBeenCalled();
    expect(mockApimClient.user.createOrUpdate).not.toHaveBeenCalled();
    expect(mockApimClient.groupUser.create).not.toHaveBeenCalled();
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
    expect(mockApimClient.user.createOrUpdate).not.toHaveBeenCalled();
    expect(mockApimClient.groupUser.create).not.toHaveBeenCalled();
  });

  it("should fail when creating a new Apim user", async () => {
    jwtVerify.mockResolvedValueOnce({
      payload: aValidJwtPayload
    });
    getUserByEmail.mockReturnValueOnce(TE.right(O.none));
    const errorMessage = "Reject user.createOrUpdate";
    mockApimClient.user.createOrUpdate.mockRejectedValueOnce(errorMessage);

    await expect(() =>
      authorize(mockConfig)({ identity_token: "identity_token" }, {})
    ).rejects.toThrowError(errorMessage);

    expect(jwtVerify).toHaveBeenCalledOnce();
    expect(getApimClient).toHaveBeenCalledOnce();
    expect(getApimClient).toHaveBeenCalledWith(
      mockConfig,
      mockConfig.AZURE_SUBSCRIPTION_ID
    );
    expect(getApimService).toHaveBeenCalledOnce();
    expect(getApimService).toHaveBeenCalledWith(
      mockApimClient,
      mockConfig.AZURE_APIM_RESOURCE_GROUP,
      mockConfig.AZURE_APIM
    );
    expect(getUserByEmail).toHaveBeenCalledOnce();
    expect(getUserByEmail).toHaveBeenCalledWith(
      getExpectedUserEmailReqParam(aValidJwtPayload.organization),
      true
    );
    expect(mockApimClient.user.createOrUpdate).toHaveBeenCalledOnce();
    expect(mockApimClient.user.createOrUpdate).toHaveBeenCalledWith(
      mockConfig.AZURE_APIM_RESOURCE_GROUP,
      mockConfig.AZURE_APIM,
      expect.any(String),
      getExpectedCreateUserReqParam(aValidJwtPayload.organization)
    );
    expect(mockApimClient.groupUser.create).not.toHaveBeenCalled();
  });

  it("should fail when adding a gruop to newly created user", async () => {
    jwtVerify.mockResolvedValueOnce({
      payload: aValidJwtPayload
    });
    getUserByEmail.mockReturnValueOnce(TE.right(O.none));
    const errorMessage = "Reject groupUser.create";
    mockApimClient.user.createOrUpdate.mockResolvedValueOnce(aValidApimUser);
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
    expect(getApimService).toHaveBeenCalledOnce();
    expect(getApimService).toHaveBeenCalledWith(
      mockApimClient,
      mockConfig.AZURE_APIM_RESOURCE_GROUP,
      mockConfig.AZURE_APIM
    );
    expect(getUserByEmail).toHaveBeenCalledOnce();
    expect(getUserByEmail).toHaveBeenCalledWith(
      getExpectedUserEmailReqParam(aValidJwtPayload.organization),
      true
    );
    expect(mockApimClient.user.createOrUpdate).toHaveBeenCalledOnce();
    expect(mockApimClient.user.createOrUpdate).toHaveBeenCalledWith(
      mockConfig.AZURE_APIM_RESOURCE_GROUP,
      mockConfig.AZURE_APIM,
      expect.any(String),
      getExpectedCreateUserReqParam(aValidJwtPayload.organization)
    );
    expect(mockApimClient.groupUser.create).toHaveBeenCalledOnce();
  });

  it("should fail when fetching the newly created user", async () => {
    jwtVerify.mockResolvedValueOnce({
      payload: aValidJwtPayload
    });
    getUserByEmail.mockReturnValueOnce(TE.right(O.none));
    const errorMessage = "Reject get.mockRejectedValueOnce";
    mockApimClient.user.createOrUpdate.mockResolvedValueOnce(aValidApimUser);
    mockApimClient.groupUser.create.mockResolvedValue(aValidApimUser);
    const statusCode = 500;
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
    expect(getApimService).toHaveBeenCalledTimes(2);
    expect(getApimService).toHaveBeenCalledWith(
      mockApimClient,
      mockConfig.AZURE_APIM_RESOURCE_GROUP,
      mockConfig.AZURE_APIM
    );
    expect(getUserByEmail).toHaveBeenCalledTimes(2);
    expect(getUserByEmail).toHaveBeenCalledWith(
      getExpectedUserEmailReqParam(aValidJwtPayload.organization),
      true
    );
    expect(mockApimClient.user.createOrUpdate).toHaveBeenCalledOnce();
    expect(mockApimClient.user.createOrUpdate).toHaveBeenCalledWith(
      mockConfig.AZURE_APIM_RESOURCE_GROUP,
      mockConfig.AZURE_APIM,
      expect.any(String),
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
  });

  it("should create and return a valid backoffice User", async () => {
    jwtVerify.mockResolvedValueOnce({
      payload: aValidJwtPayload
    });
    getUserByEmail.mockReturnValueOnce(TE.right(O.none));
    mockApimClient.user.createOrUpdate.mockResolvedValueOnce(aValidApimUser);
    mockApimClient.groupUser.create.mockResolvedValue(aValidApimUser);
    getUserByEmail.mockReturnValueOnce(TE.right(O.some(aValidApimUser)));

    const user = await authorize(mockConfig)(
      { identity_token: "identity_token" },
      {}
    );

    expect(user).toEqual(getExpectedUser(aValidJwtPayload, aValidApimUser));

    expect(jwtVerify).toHaveBeenCalledOnce();
    expect(getApimClient).toHaveBeenCalledOnce();
    expect(getApimClient).toHaveBeenCalledWith(
      mockConfig,
      mockConfig.AZURE_SUBSCRIPTION_ID
    );
    expect(getApimService).toHaveBeenCalledTimes(2);
    expect(getApimService).toHaveBeenCalledWith(
      mockApimClient,
      mockConfig.AZURE_APIM_RESOURCE_GROUP,
      mockConfig.AZURE_APIM
    );
    expect(getUserByEmail).toHaveBeenCalledTimes(2);
    expect(getUserByEmail).toHaveBeenCalledWith(
      getExpectedUserEmailReqParam(aValidJwtPayload.organization),
      true
    );
    expect(mockApimClient.user.createOrUpdate).toHaveBeenCalledOnce();
    expect(mockApimClient.user.createOrUpdate).toHaveBeenCalledWith(
      mockConfig.AZURE_APIM_RESOURCE_GROUP,
      mockConfig.AZURE_APIM,
      expect.any(String),
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
    expect(getApimService).toHaveBeenCalledWith(
      mockApimClient,
      mockConfig.AZURE_APIM_RESOURCE_GROUP,
      mockConfig.AZURE_APIM
    );
    expect(getUserByEmail).toHaveBeenCalledOnce();
    expect(getUserByEmail).toHaveBeenCalledWith(
      getExpectedUserEmailReqParam(aValidJwtPayload.organization),
      true
    );
    expect(mockApimClient.user.createOrUpdate).not.toHaveBeenCalled();
  });

  it("should return a valid backoffice User", async () => {
    jwtVerify.mockResolvedValueOnce({
      payload: aValidJwtPayload
    });
    getUserByEmail.mockImplementation(() => TE.right(O.some(aValidApimUser)));

    const user = await authorize(mockConfig)(
      { identity_token: "identity_token" },
      {}
    );

    expect(user).toEqual(getExpectedUser(aValidJwtPayload, aValidApimUser));
    expect(jwtVerify).toHaveBeenCalledOnce();
    expect(getApimClient).toHaveBeenCalledOnce();
    expect(getApimClient).toHaveBeenCalledWith(
      mockConfig,
      mockConfig.AZURE_SUBSCRIPTION_ID
    );
    expect(getApimService).toHaveBeenCalledOnce();
    expect(getApimService).toHaveBeenCalledWith(
      mockApimClient,
      mockConfig.AZURE_APIM_RESOURCE_GROUP,
      mockConfig.AZURE_APIM
    );
    expect(getUserByEmail).toHaveBeenCalledOnce();
    expect(getUserByEmail).toHaveBeenCalledWith(aValidApimUser.email, true);
    expect(mockApimClient.user.createOrUpdate).not.toHaveBeenCalled();
  });
});
