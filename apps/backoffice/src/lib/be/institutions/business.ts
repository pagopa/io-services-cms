import { Group, StateEnum } from "@/generated/api/Group";
import { Institution as BackofficeInstitution } from "@/generated/api/Institution";
import { UserAuthorizedInstitution } from "@/generated/api/UserAuthorizedInstitution";
import { UserAuthorizedInstitutions } from "@/generated/api/UserAuthorizedInstitutions";
import { Institution as SelfcareInstitution } from "@/generated/selfcare/Institution";
import { StatusEnum } from "@/generated/selfcare/UserGroupResource";
import {
  getInstitutionById,
  getInstitutionGroups,
  getUserAuthorizedInstitutions,
} from "@/lib/be/institutions/selfcare";
import { ApimUtils } from "@io-services-cms/external-clients";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";

import { ManagedInternalError } from "../errors";
import { getManageSubscriptions } from "../subscriptions/business";

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

/**
 * Fetch all group related to provided institution
 * @param institutionId the institution id
 * @returns all institution groups
 */
export const retrieveInstitutionGroups = async (
  institutionId: string,
): Promise<Group[]> => {
  const groups: Group[] = [];
  let page = 0;
  let hasMoreItems = false;
  do {
    const apiResult = await getInstitutionGroups(institutionId, 1000, page++);
    groups.push(...toGroups(apiResult.content ?? []));
    hasMoreItems = !!apiResult.totalPages && apiResult.totalPages >= page;
  } while (hasMoreItems);
  return groups;
};

export const retrieveUnboundInstitutionGroups = async (
  apimUserId: string,
  institutionId: string,
): Promise<Group[]> => {
  const results = await Promise.all([
    getManageSubscriptions(apimUserId),
    retrieveInstitutionGroups(institutionId),
  ]);
  const subscriptions = results[0];
  const groups = results[1];
  const groupIdsWithoutSubscriptions = subscriptions.reduce(
    (acc, item) =>
      acc.add(
        item.id.substring(ApimUtils.SUBSCRIPTION_MANAGE_GROUP_PREFIX.length),
      ),
    new Set<Group["id"]>(),
  );
  groups.filter((group) => !groupIdsWithoutSubscriptions.has(group.id));
  return groups;
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

const parseState = (state?: StatusEnum): StateEnum => {
  switch (state) {
    case StatusEnum.ACTIVE:
      return StateEnum.ACTIVE;
    case StatusEnum.SUSPENDED:
      return StateEnum.SUSPENDED;
    case StatusEnum.DELETED:
      return StateEnum.DELETED;
    case undefined:
      return StateEnum.ACTIVE;
    default:
      // eslint-disable-next-line no-case-declarations
      const _: never = state;
      throw new Error(`Invalid state: ${state}`);
  }
};

const toGroups = (
  userGroupResources: Exclude<
    PromiseValue<ReturnType<typeof getInstitutionGroups>>["content"],
    undefined
  >,
): Group[] =>
  userGroupResources.map((userGroupResource) => {
    if (
      userGroupResource.id &&
      userGroupResource.name !== undefined &&
      userGroupResource.status !== undefined
    ) {
      return {
        id: userGroupResource.id,
        name: userGroupResource.name,
        state: parseState(userGroupResource.status),
      };
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
  const institutionGroupsResponse =
    await retrieveInstitutionGroups(institutionId);
  return institutionGroupsResponse.some((group) => group.id === groupId);
};

export const checkInstitutionGroupsExistence = async (
  institutionId: string,
): Promise<boolean> => {
  const apiResult = await getInstitutionGroups(institutionId, 1, 0);
  return !!apiResult.totalElements;
};
