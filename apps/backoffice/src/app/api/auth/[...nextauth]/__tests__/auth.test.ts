import { faker } from "@faker-js/faker/locale/it";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Configuration } from "../../../../../config";
import { authorize } from "../auth";

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

const mockConfig = ({
  SELFCARE_BASE_URL: "http://localhost:7075",
  SELFCARE_JWKS_PATH: "/.well-known/jwks.json",
  AZURE_SUBSCRIPTION_ID: faker.string.uuid(),
  AZURE_CLIENT_SECRET_CREDENTIAL_CLIENT_ID: faker.string.uuid(),
  AZURE_CLIENT_SECRET_CREDENTIAL_SECRET: faker.internet.password(),
  AZURE_CLIENT_SECRET_CREDENTIAL_TENANT_ID: faker.string.uuid(),
  AZURE_APIM_RESOURCE_GROUP: faker.string.alpha(),
  AZURE_APIM: faker.string.alpha()
} as unknown) as Configuration;

const mocks: {
  mockApimClient: {};
} = vi.hoisted(() => ({
  mockApimClient: {}
}));

const { getUserByEmail } = vi.hoisted(() => ({
  getUserByEmail: vi.fn()
}));

const { getApimClient, getApimService } = vi.hoisted(() => ({
  getApimClient: vi.fn().mockReturnValue(mocks.mockApimClient),
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
  });

  it("should fail when token is not a JWT", async () => {
    jwtVerify.mockRejectedValueOnce("Invalid Compact JWS");

    await expect(() =>
      authorize(mockConfig)({ identity_token: "identity_token" }, {})
    ).rejects.toThrowError("Invalid Compact JWS");

    expect(jwtVerify).toHaveBeenCalledOnce();
    expect(getApimClient).not.toHaveBeenCalled();
    expect(getApimService).not.toHaveBeenCalled();
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
  });

  it("should fail when Apim user is not found", async () => {
    jwtVerify.mockResolvedValueOnce({
      payload: aValidJwtPayload
    });
    getUserByEmail.mockReturnValueOnce(TE.right(O.none));

    await expect(() =>
      authorize(mockConfig)({ identity_token: "identity_token" }, {})
    ).rejects.toThrowError("Cannot find user");

    expect(jwtVerify).toHaveBeenCalledOnce();
    expect(getApimClient).toHaveBeenCalledOnce();
    expect(getApimClient).toHaveBeenCalledWith(
      mockConfig,
      mockConfig.AZURE_SUBSCRIPTION_ID
    );
    expect(getApimService).toHaveBeenCalledOnce();
    expect(getApimService).toHaveBeenCalledWith(
      mocks.mockApimClient,
      mockConfig.AZURE_APIM_RESOURCE_GROUP,
      mockConfig.AZURE_APIM
    );
    expect(getUserByEmail).toHaveBeenCalledOnce();
    expect(getUserByEmail).toHaveBeenCalledWith(
      `org.${aValidJwtPayload.organization.id}@selfcare.io.pagopa.it`,
      true
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
      mocks.mockApimClient,
      mockConfig.AZURE_APIM_RESOURCE_GROUP,
      mockConfig.AZURE_APIM
    );
    expect(getUserByEmail).toHaveBeenCalledOnce();
    expect(getUserByEmail).toHaveBeenCalledWith(
      `org.${aValidJwtPayload.organization.id}@selfcare.io.pagopa.it`,
      true
    );
  });

  it("should return a valid backoffice User", async () => {
    jwtVerify.mockResolvedValueOnce({
      payload: aValidJwtPayload
    });
    const aValidApimUser = {
      id: faker.string.uuid(),
      email: `org.${aValidJwtPayload.organization.id}@selfcare.io.pagopa.it`,
      groups: [
        {
          type: "custom",
          name: faker.string.alpha()
        }
      ]
    };
    getUserByEmail.mockImplementation(() => TE.right(O.some(aValidApimUser)));

    const user = await authorize(mockConfig)(
      { identity_token: "identity_token" },
      {}
    );

    expect(user).toEqual({
      id: aValidJwtPayload.uid,
      name: `${aValidJwtPayload.name} ${aValidJwtPayload.family_name}`,
      email: aValidJwtPayload.email,
      institution: {
        id: aValidJwtPayload.organization.id,
        name: aValidJwtPayload.organization.name,
        role: aValidJwtPayload.organization.roles[0].role,
        logo_url: "url"
      },
      authorizedInstitutions: [
        { id: "id_2", name: "name_2", role: "operator" }
      ],
      permissions: aValidApimUser.groups
        .filter(group => group.type === "custom")
        .map(group => group.name),
      parameters: {
        userId: aValidApimUser.id,
        userEmail: aValidApimUser.email,
        subscriptionId: mockConfig.AZURE_SUBSCRIPTION_ID
      }
    });
    expect(jwtVerify).toHaveBeenCalledOnce();
    expect(getApimClient).toHaveBeenCalledOnce();
    expect(getApimClient).toHaveBeenCalledWith(
      mockConfig,
      mockConfig.AZURE_SUBSCRIPTION_ID
    );
    expect(getApimService).toHaveBeenCalledOnce();
    expect(getApimService).toHaveBeenCalledWith(
      mocks.mockApimClient,
      mockConfig.AZURE_APIM_RESOURCE_GROUP,
      mockConfig.AZURE_APIM
    );
    expect(getUserByEmail).toHaveBeenCalledOnce();
    expect(getUserByEmail).toHaveBeenCalledWith(aValidApimUser.email, true);
  });
});
