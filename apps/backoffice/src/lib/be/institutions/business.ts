import { GroupPagination } from "@/generated/api/GroupPagination";
import { Institution as BackofficeInstitution } from "@/generated/api/Institution";
import { UserAuthorizedInstitution } from "@/generated/api/UserAuthorizedInstitution";
import { UserAuthorizedInstitutions } from "@/generated/api/UserAuthorizedInstitutions";
import { Institution as SelfcareInstitution } from "@/generated/selfcare/Institution";

import { ManagedInternalError } from "../errors";
import {
  getInstitutionById,
  getInstitutionGroups,
  getUserAuthorizedInstitutions
} from "./selfcare";

// Type utility to extract the resolved type of a Promise
type PromiseValue<T> = T extends Promise<infer U> ? U : never; // TODO: move to an Utils monorepo package

// Type utility to extract the resolved type of a ReadonlyArray of Promises
type ReadonlyArrayElementType<T> = T extends readonly (infer U)[] ? U : never; // TODO: move to an Utils monorepo package

export const retrieveUserAuthorizedInstitutions = async (
  selfCareUserId: string
): Promise<UserAuthorizedInstitutions> => {
  const apiResult = await getUserAuthorizedInstitutions(selfCareUserId);
  return { authorizedInstitutions: apiResult.map(toUserAuthorizedInstitution) };
};

export const retrieveInstitution = async (
  institutionId: string
): Promise<BackofficeInstitution> =>
  toBackofficeInstitution(await getInstitutionById(institutionId));

export const retrieveInstitutionGroups = async (
  institutionId: string,
  limit?: number,
  offset?: number
): Promise<GroupPagination> => {
  const apiResult = await getInstitutionGroups(institutionId, limit, offset);
  return toGroupPagination(apiResult);
};

const toBackofficeInstitution = (
  institution: SelfcareInstitution
): BackofficeInstitution => ({
  address: institution.address,
  description: institution.description,
  digitalAddress: institution.digitalAddress,
  externalId: institution.externalId,
  geographicTaxonomies: institution.geographicTaxonomies,
  id: institution.id,
  institutionType: institution.institutionType,
  origin: institution.origin,
  originId: institution.originId,
  taxCode: institution.taxCode,
  zipCode: institution.zipCode
});

const toUserAuthorizedInstitution = (
  usesrInstitution: ReadonlyArrayElementType<
    PromiseValue<ReturnType<typeof getUserAuthorizedInstitutions>>
  >
): UserAuthorizedInstitution => ({
  id: usesrInstitution.institutionId,
  logo_url: `https://selfcare.pagopa.it/institutions/${usesrInstitution.institutionId}/logo.png`,
  name: usesrInstitution.institutionDescription,
  role: usesrInstitution.products?.at(0)?.productRole
});

const toGroupPagination = (
  pageOfUserGroupResource: PromiseValue<ReturnType<typeof getInstitutionGroups>>
): GroupPagination => ({
  pagination: {
    count: pageOfUserGroupResource.totalElements ?? 0,
    limit: pageOfUserGroupResource.size ?? 0,
    offset: pageOfUserGroupResource.number ?? 0
  },
  value: toGroups(pageOfUserGroupResource.content ?? [])
});

// is this the behavior we want ? , check institutions.test row 240
const toGroups = (
  userGroupResources: Exclude<
    PromiseValue<ReturnType<typeof getInstitutionGroups>>["content"],
    undefined
  >
): GroupPagination["value"] =>
  userGroupResources?.map(userGroupResource => {
    if (userGroupResource.id && userGroupResource.name !== undefined) {
      return { id: userGroupResource.id, name: userGroupResource.name };
    } else {
      throw new ManagedInternalError(
        "Error toGroups mapping",
        "group ID or group name are not defined"
      );
    }
  });
