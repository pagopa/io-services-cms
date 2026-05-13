import { faker } from "@faker-js/faker/locale/it";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BackOfficeUser } from "../../../../types/next-auth";
import { SelfcareRoles } from "../../../types/auth";
import { isAdmin, isInstitutionIdSameAsCaller, userAuthz } from "../authz";

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
  describe("isAdmin", () => {
    it.each`
      expectedResult | role
      ${true}        | ${SelfcareRoles.admin}
    `(
      'should return $expectedResult for "$role" user',
      ({ expectedResult, role }) => {
        expect(
          userAuthz({
            institution: { role },
          } as BackOfficeUser).isAdmin(),
        ).toBe(expectedResult);
      },
    );
  });

  describe("isAggregatorAdmin", () => {
    it.each`
      expectedResult | role
      ${true}        | ${SelfcareRoles.adminAggregator}
      ${false}       | ${SelfcareRoles.admin}
      ${false}       | ${SelfcareRoles.operator}
    `(
      'should return $expectedResult for "$role" user',
      ({ expectedResult, role }) => {
        expect(
          userAuthz({
            institution: { role },
          } as BackOfficeUser).isAggregatorAdmin(),
        ).toBe(expectedResult);
      },
    );
  });

  describe("isAnAggregatorAdminAllowedOnGroup", () => {
    it.each`
      scenario                                                                          | expectedResult | role                             | selcGroups                                                  | groupId                | checkActive
      ${"It is an Aggregator Admin and the group is allowed"}                           | ${true}        | ${SelfcareRoles.adminAggregator} | ${[{ id: "groupId", name: "groupName", state: "ACTIVE" }]}  | ${"groupId"}           | ${undefined}
      ${"It is an Aggregator Admin and the group is both allowed and active (checked)"} | ${true}        | ${SelfcareRoles.adminAggregator} | ${[{ id: "groupId", name: "groupName", state: "ACTIVE" }]}  | ${"groupId"}           | ${true}
      ${"It is an Aggregator Admin and the group is allowed (explicitly unchecked)"}    | ${true}        | ${SelfcareRoles.adminAggregator} | ${[{ id: "groupId", name: "groupName", state: "ACTIVE" }]}  | ${"groupId"}           | ${false}
      ${"It is an Aggregator Admin and the group is allowed but not active"}            | ${true}        | ${SelfcareRoles.adminAggregator} | ${[{ id: "groupId", name: "groupName", state: "DELETED" }]} | ${"groupId"}           | ${true}
      ${"It is an Aggregator Admin and the group is allowed (groupId as string)"}       | ${true}        | ${SelfcareRoles.adminAggregator} | ${["groupId"]}                                              | ${"groupId"}           | ${undefined}
      ${"It is an Aggregator Admin but the group does not match"}                       | ${false}       | ${SelfcareRoles.adminAggregator} | ${[{ id: "groupId", name: "groupName", state: "ACTIVE" }]}  | ${"different_groupId"} | ${undefined}
      ${"It is an Aggregator Admin and there are no groups"}                            | ${false}       | ${SelfcareRoles.adminAggregator} | ${undefined}                                                | ${"groupId"}           | ${undefined}
      ${"It is an Aggregator Admin and the group list is empty"}                        | ${false}       | ${SelfcareRoles.adminAggregator} | ${[]}                                                       | ${"groupId"}           | ${undefined}
      ${"It is an Operator and the group is active"}                                    | ${false}       | ${SelfcareRoles.operator}        | ${[{ id: "groupId", name: "groupName", state: "ACTIVE" }]}  | ${"groupId"}           | ${undefined}
      ${"It is an Admin and the group is active"}                                       | ${false}       | ${SelfcareRoles.admin}           | ${[{ id: "groupId", name: "groupName", state: "ACTIVE" }]}  | ${"groupId"}           | ${undefined}
    `(
      'should return $expectedResult for "$role" user with selcGroups: $selcGroups and groupId: $groupId',
      ({ expectedResult, role, selcGroups, groupId }) => {
        expect(
          userAuthz({
            institution: { role },
            permissions: { selcGroups },
          } as BackOfficeUser).isAnAggregatorAdminAllowedOnGroup(groupId),
        ).toBe(expectedResult);
      },
    );
  });

  describe("isInstitutionAllowed", () => {
    it.each`
      scenario                                 | expectedResult | allowedInstitutionId | providedInstitutionId
      ${"provided institution is allowed"}     | ${true}        | ${"institutionId"}   | ${"institutionId"}
      ${"provided institution is not allowed"} | ${false}       | ${"institutionId"}   | ${"different_institutionId"}
    `(
      "should return $expectedResult when $scenario",
      ({ expectedResult, allowedInstitutionId, providedInstitutionId }) => {
        expect(
          userAuthz({
            institution: { id: allowedInstitutionId },
          } as BackOfficeUser).isInstitutionAllowed(providedInstitutionId),
        ).toBe(expectedResult);
      },
    );
  });

  describe("isGroupAllowed", () => {
    it.each`
      scenario                                                                                                                               | expectedResult | role                      | selcGroups                                                    | groupId                | active
      ${"is admin"}                                                                                                                          | ${true}        | ${SelfcareRoles.admin}    | ${undefined}                                                  | ${""}                  | ${undefined}
      ${"is not admin and selcGroups is not defined"}                                                                                        | ${true}        | ${SelfcareRoles.operator} | ${undefined}                                                  | ${""}                  | ${undefined}
      ${"is not admin and selcGroups is empty"}                                                                                              | ${true}        | ${SelfcareRoles.operator} | ${[]}                                                         | ${""}                  | ${undefined}
      ${"is not admin and provided groupId is included in selcGroups"}                                                                       | ${true}        | ${SelfcareRoles.operator} | ${["groupId"]}                                                | ${"groupId"}           | ${undefined}
      ${"is not admin and provided groupId is not included in selcGroups"}                                                                   | ${false}       | ${SelfcareRoles.operator} | ${["groupId"]}                                                | ${"different_groupId"} | ${undefined}
      ${"is not admin and provided groupId is included in selcGroups enriched"}                                                              | ${true}        | ${SelfcareRoles.operator} | ${[{ id: "groupId", name: "groupName", state: "ACTIVE" }]}    | ${"groupId"}           | ${false}
      ${"is not admin and provided groupId is not included in selcGroups enriched"}                                                          | ${false}       | ${SelfcareRoles.operator} | ${[{ id: "groupId", name: "groupName", state: "ACTIVE" }]}    | ${"different_groupId"} | ${false}
      ${"is not admin and provided groupId is included in selcGroups enriched and the group is not active"}                                  | ${false}       | ${SelfcareRoles.operator} | ${[{ id: "groupId", name: "groupName", state: "SUSPENDED" }]} | ${"groupId"}           | ${true}
      ${"is not admin and provided groupId is included in selcGroups enriched and the group is not active but the flag active is false"}     | ${true}        | ${SelfcareRoles.operator} | ${[{ id: "groupId", name: "groupName", state: "SUSPENDED" }]} | ${"groupId"}           | ${false}
      ${"is not admin and provided groupId is included in selcGroups enriched and the group is not active but the flag active is undefined"} | ${true}        | ${SelfcareRoles.operator} | ${[{ id: "groupId", name: "groupName", state: "SUSPENDED" }]} | ${"groupId"}           | ${undefined}
      ${"is not admin and provided groupId is not included in selcGroups enriched the group is active"}                                      | ${false}       | ${SelfcareRoles.operator} | ${[{ id: "groupId", name: "groupName", state: "ACTIVE" }]}    | ${"different_groupId"} | ${true}
    `(
      "should return $expectedResult when $scenario",
      ({ expectedResult, role, selcGroups, groupId, active }) => {
        expect(
          userAuthz({
            institution: { role },
            permissions: { selcGroups },
          } as BackOfficeUser).isGroupAllowed(groupId, active),
        ).toBe(expectedResult);
      },
    );
  });

  describe("hasSelcGroups", () => {
    it.each`
      scenario                                 | expectedResult | selcGroups
      ${"the user's selcGroup is not defined"} | ${false}       | ${undefined}
      ${"the user's selcGroup is empty"}       | ${false}       | ${[]}
      ${"the user's selcGroup is not empty"}   | ${true}        | ${["group1", "group2"]}
    `(
      "should return $expectedResult with $scenario",
      ({ expectedResult, selcGroups }) => {
        expect(
          userAuthz({
            permissions: { selcGroups },
          } as BackOfficeUser).hasSelcGroups(),
        ).toBe(expectedResult);
      },
    );
  });
});
