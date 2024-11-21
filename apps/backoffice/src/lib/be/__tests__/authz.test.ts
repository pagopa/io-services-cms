import { faker } from "@faker-js/faker/locale/it";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SelfcareRoles } from "../../../types/auth";
import { isAdmin, isInstitutionIdSameAsCaller, userAuthz } from "../authz";
import { BackOfficeUser } from "../../../../types/next-auth";

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

describe("userAuthz", () => {
  describe("isGroupAllowed", () => {
    it.each`
      scenario                                                             | expectedResult | role                      | selcGroups     | groupId
      ${"is admin"}                                                        | ${true}        | ${SelfcareRoles.admin}    | ${undefined}   | ${""}
      ${"is not admin and selcGroups is not defined"}                      | ${true}        | ${SelfcareRoles.operator} | ${undefined}   | ${""}
      ${"is not admin and selcGroups is empty"}                            | ${true}        | ${SelfcareRoles.operator} | ${[]}          | ${""}
      ${"is not admin and provided groupId is included in selcGroups"}     | ${true}        | ${SelfcareRoles.operator} | ${["groupId"]} | ${"groupId"}
      ${"is not admin and provided groupId is not included in selcGroups"} | ${false}       | ${SelfcareRoles.operator} | ${["groupId"]} | ${"different_groupId"}
    `(
      "should return $expectedResult when $scenario",
      ({ expectedResult, role, selcGroups, groupId }) => {
        expect(
          userAuthz({
            institution: { role },
            permissions: { selcGroups },
          } as BackOfficeUser).isGroupAllowed(groupId),
        ).toBe(expectedResult);
      },
    );
  });
});
