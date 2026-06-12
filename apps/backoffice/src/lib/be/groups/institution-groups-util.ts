import type { Group } from "@/generated/api/Group";
import type { DomainGroup } from "@/lib/be/institutions/business";

export const toGroupResponse = (group: DomainGroup): Group => ({
  id: group.id,
  name: group.name,
  state: group.state,
});

export const toGroupsResponse = (groups: DomainGroup[]): Group[] =>
  groups.map(toGroupResponse);
