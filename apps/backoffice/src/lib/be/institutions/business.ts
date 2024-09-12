import { Institution as BackofficeInstitution } from "@/generated/api/Institution";
import { UserAuthorizedInstitution } from "@/generated/api/UserAuthorizedInstitution";
import { UserAuthorizedInstitutions } from "@/generated/api/UserAuthorizedInstitutions";
import { Institution as SelfcareInstitution } from "@/generated/selfcare/Institution";
import {
  getInstitutionById,
  getUserAuthorizedInstitutions,
  getInstitutionGroups
} from "./selfcare";
import { GroupPagination } from "@/generated/api/GroupPagination";
import { ManagedInternalError } from "../errors";

// Type utility to extract the resolved type of a Promise
type PromiseValue<T> = T extends Promise<infer U> ? U : never; // TODO: move to an Utils monorepo package

// Type utility to extract the resolved type of a ReadonlyArray of Promises
type ReadonlyArrayElementType<T> = T extends ReadonlyArray<infer U> ? U : never; // TODO: move to an Utils monorepo package

// Type utility to extract the resolved type of an array of Promises
type ArrayElementType<T> = T extends (infer U)[] ? U : never; // TODO: move to an Utils monorepo package

export const retrieveUserAuthorizedInstitutions = async (
  selfCareUserId: string
): Promise<UserAuthorizedInstitutions> => {
  const apiResult = await getUserAuthorizedInstitutions(selfCareUserId);
  return { authorizedInstitutions: apiResult.map(toUserAuthorizedInstitution) };
};

export const retrieveInstitution = async (
  institutionId: string
): Promise<BackofficeInstitution> => {
  return toBackofficeInstitution(await getInstitutionById(institutionId));
};

export const retrieveUserGroups = async (
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
  id: institution.id,
  externalId: institution.externalId,
  originId: institution.originId,
  description: institution.description,
  digitalAddress: institution.digitalAddress,
  address: institution.address,
  zipCode: institution.zipCode,
  taxCode: institution.taxCode,
  origin: institution.origin,
  institutionType: institution.institutionType,
  geographicTaxonomies: institution.geographicTaxonomies
});

const toUserAuthorizedInstitution = (
  usesrInstitution: ReadonlyArrayElementType<
    PromiseValue<ReturnType<typeof getUserAuthorizedInstitutions>>
  >
): UserAuthorizedInstitution => ({
  id: usesrInstitution.institutionId,
  name: usesrInstitution.institutionDescription,
  role: usesrInstitution.products?.at(0)?.productRole,
  logo_url: `https://selfcare.pagopa.it/institutions/${usesrInstitution.institutionId}/logo.png`
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


// TODO : this need to be fixed
const toGroups = (
  userGroupResources: Exclude<
    PromiseValue<ReturnType<typeof getInstitutionGroups>>["content"],
    undefined
  >
): GroupPagination["value"] => {
  return userGroupResources?.map(userGroupResource => {
    if (userGroupResource.id && userGroupResource.name !== undefined) {
      return { id: userGroupResource.id, name: userGroupResource.name };
    } else {
      throw new ManagedInternalError("Error toGroups mapping");
    }
  });
};
