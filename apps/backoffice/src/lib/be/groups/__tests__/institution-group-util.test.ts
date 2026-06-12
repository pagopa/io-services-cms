import { beforeEach, describe, expect, it, vi } from "vitest";
import { StateEnum } from "../../../../generated/api/Group";
import { DomainGroup } from "../../institutions/business";
import { toGroupResponse, toGroupsResponse } from "../institution-groups-util";

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("institutionGroupsUtil", () => {
  describe("toGroupResponse", () => {
    it("should map a domain group to a group response without parentInstitutionId", () => {
      // given
      const domainGroup: DomainGroup = {
        id: "groupId",
        name: "groupName",
        parentInstitutionId: "institutionId",
        state: StateEnum.ACTIVE,
      };

      // when
      const result = toGroupResponse(domainGroup);

      // then
      expect(result).toEqual({
        id: "groupId",
        name: "groupName",
        state: StateEnum.ACTIVE,
      });
      expect(result).not.toHaveProperty("parentInstitutionId");
    });
  });

  describe("toGroupsResponse", () => {
    it("should map domain groups to group responses without parentInstitutionId", () => {
      // given
      const domainGroups: DomainGroup[] = [
        {
          id: "groupId1",
          name: "groupName1",
          parentInstitutionId: "institutionId1",
          state: StateEnum.ACTIVE,
        },
        {
          id: "groupId2",
          name: "groupName2",
          parentInstitutionId: "institutionId2",
          state: StateEnum.SUSPENDED,
        },
      ];

      // when
      const result = toGroupsResponse(domainGroups);

      // then
      expect(result).toEqual([
        {
          id: "groupId1",
          name: "groupName1",
          state: StateEnum.ACTIVE,
        },
        {
          id: "groupId2",
          name: "groupName2",
          state: StateEnum.SUSPENDED,
        },
      ]);
      expect(result[0]).not.toHaveProperty("parentInstitutionId");
      expect(result[1]).not.toHaveProperty("parentInstitutionId");
    });
  });
});
