import { faker } from "@faker-js/faker/locale/it";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SelfcareRoles } from "../../../types/auth";
import { isAdmin, isInstitutionIdSameAsCaller } from "../authz";

const backofficeUserMock = {
  id: faker.string.uuid(),
  name: faker.person.fullName(),
  email: faker.internet.email(),
  institution: {
    id: "institutionId",
    name: faker.company.name(),
    fiscalCode: faker.string.numeric(),
    role: SelfcareRoles.admin,
    logo_url: faker.image.url(),
  },
  authorizedInstitutions: [
    {
      id: faker.string.uuid(),
      name: faker.company.name(),
      role: faker.helpers.arrayElement(Object.values(SelfcareRoles)),
      logo_url: faker.image.url(),
    },
  ],
  permissions: {
    apimGroups: faker.helpers.multiple(faker.string.alpha),
  },
  parameters: {
    userId: faker.string.uuid(),
    userEmail: faker.internet.email(),
    subscriptionId: faker.string.uuid(),
  },
};

const differentBackofficeOperatorUserMock = {
  ...backofficeUserMock,
  institution: {
    id: "differentInstitutionId",
    name: faker.company.name(),
    fiscalCode: faker.string.numeric(),
    role: SelfcareRoles.operator,
    logo_url: faker.image.url(),
  },
};

const institutionId = "institutionId";

afterEach(() => {
  vi.resetAllMocks();
  vi.restoreAllMocks();
});

describe("isAdmin", () => {
  it('should return true for "admin" user', () => {
    expect(isAdmin(backofficeUserMock)).toBe(true);
  });
  it('should return false for "operator" user', () => {
    expect(isAdmin(differentBackofficeOperatorUserMock)).toBe(false);
  });
});

describe("isInstitutionSameAsCaller", () => {
  it("should return true if caller institutionId is the same as user", () => {
    expect(isInstitutionIdSameAsCaller(backofficeUserMock, institutionId)).toBe(
      true,
    );
  });
  it("should return false if caller institutionId is not the same as user", () => {
    expect(
      isInstitutionIdSameAsCaller(
        differentBackofficeOperatorUserMock,
        institutionId,
      ),
    ).toBe(false);
  });
});
