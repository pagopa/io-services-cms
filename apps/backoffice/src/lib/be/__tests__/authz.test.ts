import { describe, expect, it } from "vitest";
import { SelfcareRoles } from "../../../types/auth";
import { userAuthz } from "../authz";
import { BackOfficeUserEnriched } from "../wrappers";

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

  describe("isUserAllowedOnGroup", () => {
    it.each`
      scenario                                                                                             | expectedResult | selcGroups                                                    | groupId                | checkActive
      ${"selcGroups is empty"}                                                                             | ${true}        | ${[]}                                                         | ${"groupId"}           | ${undefined}
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
      scenario                               | expectedResult | selcGroups
      ${"the user's selcGroup is empty"}     | ${false}       | ${[]}
      ${"the user's selcGroup is not empty"} | ${true}        | ${["group1", "group2"]}
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
