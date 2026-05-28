import { faker } from "@faker-js/faker/locale/it";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SelfcareRoles } from "../../../types/auth";
import { isAdmin, isInstitutionIdSameAsCaller, userAuthz } from "../authz";
import { BackOfficeUserEnriched } from "../wrappers";

const backofficeUserMock: BackOfficeUserEnriched = {
  id: faker.string.uuid(),
  institution: {
    id: "institutionId",
    name: faker.company.name(),
    fiscalCode: faker.string.numeric(),
    role: SelfcareRoles.admin,
    logo_url: faker.image.url(),
    isAggregator: false,
    isAggregate: false,
    selcSpecialGroups: [],
  },
  permissions: {
    apimGroups: faker.helpers.multiple(faker.string.alpha),
    selcGroups: [],
  },
  parameters: {
    userId: faker.string.uuid(),
    userEmail: faker.internet.email(),
    subscriptionId: faker.string.uuid(),
  },
};

const differentBackofficeOperatorUserMock: BackOfficeUserEnriched = {
  ...backofficeUserMock,
  institution: {
    id: "differentInstitutionId",
    name: faker.company.name(),
    fiscalCode: faker.string.numeric(),
    role: SelfcareRoles.operator,
    logo_url: faker.image.url(),
    isAggregator: false,
    isAggregate: false,
    selcSpecialGroups: [],
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
      ${false}       | ${SelfcareRoles.adminAggregator}
      ${false}       | ${SelfcareRoles.operator}
    `(
      'should return $expectedResult for "$role" user',
      ({ expectedResult, role }) => {
        expect(
          userAuthz({
            institution: { role },
          } as unknown as BackOfficeUserEnriched).isAdmin(),
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
          } as unknown as BackOfficeUserEnriched).isAggregatorAdmin(),
        ).toBe(expectedResult);
      },
    );
  });

  describe("isAnInstitutionSpecialGroup", () => {
    it.each`
      scenario                                             | expectedResult | selcSpecialGroups                                                                                                                                                             | groupId
      ${"selcSpecialGroups is empty"}                      | ${false}       | ${[]}                                                                                                                                                                         | ${"groupId"}
      ${"groupId is in selcSpecialGroups"}                 | ${true}        | ${[{ id: "groupId", parentInstitutionId: "parentId", name: "groupName", state: "ACTIVE" }]}                                                                                   | ${"groupId"}
      ${"groupId is not in selcSpecialGroups"}             | ${false}       | ${[{ id: "groupId", parentInstitutionId: "parentId", name: "groupName", state: "ACTIVE" }]}                                                                                   | ${"different_groupId"}
      ${"groupId is in one of multiple selcSpecialGroups"} | ${true}        | ${[{ id: "other", parentInstitutionId: "parentId", name: "other", state: "ACTIVE" }, { id: "groupId", parentInstitutionId: "parentId", name: "groupName", state: "ACTIVE" }]} | ${"groupId"}
    `(
      "should return $expectedResult when $scenario",
      ({ expectedResult, selcSpecialGroups, groupId }) => {
        expect(
          userAuthz({
            institution: { selcSpecialGroups },
          } as unknown as BackOfficeUserEnriched).isAnInstitutionSpecialGroup(
            groupId,
          ),
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
          } as unknown as BackOfficeUserEnriched).isInstitutionAllowed(
            providedInstitutionId,
          ),
        ).toBe(expectedResult);
      },
    );
  });

  describe("isGroupAllowed", () => {
    it.each`
      scenario                                                                                                                               | expectedResult | role                      | selcGroups                                                    | groupId                | active
      ${"is admin"}                                                                                                                          | ${true}        | ${SelfcareRoles.admin}    | ${[]}                                                         | ${""}                  | ${undefined}
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
          } as unknown as BackOfficeUserEnriched).isGroupAllowed(
            groupId,
            active,
          ),
        ).toBe(expectedResult);
      },
    );
  });

  describe("isUserAllowedOnGroup", () => {
    it.each`
      scenario                                                                                             | expectedResult | selcGroups                                                    | groupId                | checkActive
      ${"selcGroups is empty"}                                                                             | ${false}       | ${[]}                                                         | ${"groupId"}           | ${undefined}
      ${"groupId is included in selcGroups as string"}                                                     | ${true}        | ${["groupId"]}                                                | ${"groupId"}           | ${undefined}
      ${"groupId is not included in selcGroups as string"}                                                 | ${false}       | ${["groupId"]}                                                | ${"different_groupId"} | ${undefined}
      ${"groupId is included in enriched selcGroups and active check is not required"}                     | ${true}        | ${[{ id: "groupId", name: "groupName", state: "SUSPENDED" }]} | ${"groupId"}           | ${undefined}
      ${"groupId is included in enriched selcGroups and active check is explicitly disabled"}              | ${true}        | ${[{ id: "groupId", name: "groupName", state: "SUSPENDED" }]} | ${"groupId"}           | ${false}
      ${"groupId is included in enriched selcGroups but group is not active and active check is required"} | ${false}       | ${[{ id: "groupId", name: "groupName", state: "SUSPENDED" }]} | ${"groupId"}           | ${true}
      ${"groupId is included in enriched selcGroups and group is active and active check is required"}     | ${true}        | ${[{ id: "groupId", name: "groupName", state: "ACTIVE" }]}    | ${"groupId"}           | ${true}
      ${"groupId is not included in enriched selcGroups and active check is required"}                     | ${false}       | ${[{ id: "groupId", name: "groupName", state: "ACTIVE" }]}    | ${"different_groupId"} | ${true}
    `(
      "should return $expectedResult when $scenario",
      ({ expectedResult, selcGroups, groupId, checkActive }) => {
        expect(
          userAuthz({
            institution: { role: SelfcareRoles.operator },
            permissions: { selcGroups },
          } as unknown as BackOfficeUserEnriched).isUserAllowedOnGroup(
            groupId,
            checkActive,
          ),
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
          } as unknown as BackOfficeUserEnriched).hasSelcGroups(),
        ).toBe(expectedResult);
      },
    );
  });
});
