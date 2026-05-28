import { describe, expect, it } from "vitest";

import { isBackOfficeUserToken } from "../token-guards";

const aValidToken = {
  id: "user-id",
  institution: {
    fiscalCode: "01234567890",
    id: "institution-id",
    isAggregate: false,
    isAggregator: true,
    name: "Institution",
    role: "admin",
  },
  permissions: {
    apimGroups: ["ApiServiceWrite", "ApiAdmin"],
    selcGroups: ["group-1", "group-2"],
  },
  parameters: {
    subscriptionId: "subscription-id",
    userEmail: "user@example.com",
    userId: "apim-user-id",
  },
};

describe("isBackOfficeUserToken", () => {
  it("should return true for a valid token", () => {
    expect(isBackOfficeUserToken(aValidToken)).toBe(true);
  });

  it("should return true when optional fields are omitted", () => {
    const tokenWithoutOptionalFields = {
      ...aValidToken,
      institution: {
        ...aValidToken.institution,
        logo_url: undefined,
      },
      permissions: {
        apimGroups: ["ApiServiceWrite"],
      },
    };

    expect(isBackOfficeUserToken(tokenWithoutOptionalFields)).toBe(true);
  });

  it("should return false when token id is invalid", () => {
    const tokenWithInvalidId = {
      ...aValidToken,
      id: 123,
    };

    expect(isBackOfficeUserToken(tokenWithInvalidId)).toBe(false);
  });

  it("should return false when institution is invalid", () => {
    const tokenWithInvalidInstitution = {
      ...aValidToken,
      institution: {
        ...aValidToken.institution,
        isAggregator: "yes",
      },
    };

    expect(isBackOfficeUserToken(tokenWithInvalidInstitution)).toBe(false);
  });

  it("should return false when permissions are invalid", () => {
    const tokenWithInvalidPermissions = {
      ...aValidToken,
      permissions: {
        ...aValidToken.permissions,
        apimGroups: ["ApiServiceWrite", 1],
      },
    };

    expect(isBackOfficeUserToken(tokenWithInvalidPermissions)).toBe(false);
  });

  it("should return false when parameters are invalid", () => {
    const tokenWithInvalidParameters = {
      ...aValidToken,
      parameters: {
        ...aValidToken.parameters,
        subscriptionId: 123,
      },
    };

    expect(isBackOfficeUserToken(tokenWithInvalidParameters)).toBe(false);
  });

  it("should return false for non-object values", () => {
    expect(isBackOfficeUserToken(null)).toBe(false);
    expect(isBackOfficeUserToken("token")).toBe(false);
    expect(isBackOfficeUserToken(123)).toBe(false);
  });
});
