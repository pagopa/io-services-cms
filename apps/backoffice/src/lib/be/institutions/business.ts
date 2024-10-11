import { GroupPagination } from "@/generated/api/GroupPagination";
import { Institution as BackofficeInstitution } from "@/generated/api/Institution";
import { UserAuthorizedInstitution } from "@/generated/api/UserAuthorizedInstitution";
import { UserAuthorizedInstitutions } from "@/generated/api/UserAuthorizedInstitutions";
import { Institution as SelfcareInstitution } from "@/generated/selfcare/Institution";
import {
  getInstitutionById,
  getInstitutionGroups,
  getUserAuthorizedInstitutions,
} from "@/lib/be/institutions/selfcare";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";

import { ManagedInternalError } from "../errors";

// Type utility to extract the resolved type of a Promise
type PromiseValue<T> = T extends Promise<infer U> ? U : never; // TODO: move to an Utils monorepo package

// Type utility to extract the resolved type of a ReadonlyArray of Promises
type ReadonlyArrayElementType<T> = T extends readonly (infer U)[] ? U : never; // TODO: move to an Utils monorepo package

export const retrieveUserAuthorizedInstitutions = async (
  selfCareUserId: string,
): Promise<UserAuthorizedInstitutions> => {
  const apiResult = await getUserAuthorizedInstitutions(selfCareUserId);
  return { authorizedInstitutions: apiResult.map(toUserAuthorizedInstitution) };
};

export const retrieveInstitution = async (
  institutionId: string,
): Promise<BackofficeInstitution> =>
  toBackofficeInstitution(await getInstitutionById(institutionId));

export const retrieveInstitutionGroups = async (
  institutionId: string,
  size?: number,
  page?: number,
): Promise<GroupPagination> => {
  const apiResult = await getInstitutionGroups(institutionId, size, page);
  return toGroupPagination(apiResult);
};

const toBackofficeInstitution = (
  institution: SelfcareInstitution,
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
  zipCode: institution.zipCode,
});

const toUserAuthorizedInstitution = (
  userInstitution: ReadonlyArrayElementType<
    PromiseValue<ReturnType<typeof getUserAuthorizedInstitutions>>
  >,
): UserAuthorizedInstitution => ({
  id: userInstitution.institutionId,
  logo_url: `https://selfcare.pagopa.it/institutions/${userInstitution.institutionId}/logo.png`,
  name: userInstitution.institutionDescription,
  role: userInstitution.products?.at(0)?.productRole,
});

const toGroupPagination = (
  pageOfUserGroupResource: PromiseValue<
    ReturnType<typeof getInstitutionGroups>
  >,
): GroupPagination => ({
  pagination: {
    number: pageOfUserGroupResource.number ?? 0,
    size: pageOfUserGroupResource.size ?? 0,
    totalElements: pageOfUserGroupResource.totalElements ?? 0,
    totalPages: pageOfUserGroupResource.totalPages ?? 0,
  },
  value: toGroups(pageOfUserGroupResource.content ?? []),
});

const toGroups = (
  userGroupResources: Exclude<
    PromiseValue<ReturnType<typeof getInstitutionGroups>>["content"],
    undefined
  >,
): GroupPagination["value"] =>
  userGroupResources?.map((userGroupResource) => {
    if (userGroupResource.id && userGroupResource.name !== undefined) {
      return { id: userGroupResource.id, name: userGroupResource.name };
    } else {
      throw new ManagedInternalError(
        "Error toGroups mapping",
        "group ID or group name are not defined",
      );
    }
  });

export const groupExists = async (
  institutionId: string,
  groupId: NonEmptyString,
): Promise<boolean> => {
  // TODO: replace the fallowing API call with retrieveInstitutionGroupById "future" API (not already implemented by Selfcare)
  const institutionGroupsResponse = await retrieveInstitutionGroups(
    institutionId,
    1000, // FIXME: workaround to get all groups in a single call
    0,
  );
  return institutionGroupsResponse.value.some((group) => group.id === groupId);
};
