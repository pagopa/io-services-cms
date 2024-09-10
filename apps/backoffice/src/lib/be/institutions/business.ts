import { Institution as BackofficeInstitution } from "@/generated/api/Institution";
import { UserAuthorizedInstitution } from "@/generated/api/UserAuthorizedInstitution";
import { UserAuthorizedInstitutions } from "@/generated/api/UserAuthorizedInstitutions";
import { Institution as SelfcareInstitution } from "@/generated/selfcare/Institution";

import { getInstitutionById, getUserAuthorizedInstitutions } from "./selfcare";

// Type utility to extract the resolved type of a Promise
type PromiseValue<T> = T extends Promise<infer U> ? U : never; // TODO: move to an Utils monorepo package

// Type utility to extract the resolved type of a ReadonlyArray of Promises
type ReadonlyArrayElementType<T> = T extends readonly (infer U)[] ? U : never; // TODO: move to an Utils monorepo package

// Type utility to extract the resolved type of an array of Promises
type ArrayElementType<T> = T extends (infer U)[] ? U : never; // TODO: move to an Utils monorepo package

type test = ReadonlyArrayElementType<
  PromiseValue<ReturnType<typeof getUserAuthorizedInstitutions>>
>;

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
  usesrInstitution: ReadonlyArrayElementType<
    PromiseValue<ReturnType<typeof getUserAuthorizedInstitutions>>
  >,
): UserAuthorizedInstitution => ({
  id: usesrInstitution.institutionId,
  logo_url: `https://selfcare.pagopa.it/institutions/${usesrInstitution.institutionId}/logo.png`,
  name: usesrInstitution.institutionDescription,
  role: usesrInstitution.products?.at(0)?.productRole,
});
