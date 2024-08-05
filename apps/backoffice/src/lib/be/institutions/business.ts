import { Institution as BackofficeInstitution } from "@/generated/api/Institution";
import { UserAuthorizedInstitution } from "@/generated/api/UserAuthorizedInstitution";
import { UserAuthorizedInstitutions } from "@/generated/api/UserAuthorizedInstitutions";
import { Institution as SelfcareInstitution } from "@/generated/selfcare/Institution";
import { getInstitutionById, getUserAuthorizedInstitutions } from "./selfcare";

// Type utility to extract the resolved type of a Promise
type PromiseValue<T> = T extends Promise<infer U> ? U : never; // TODO: move to an Utils monorepo package

// Type utility to extract the resolved type of a ReadonlyArray of Promises
type ReadonlyArrayElementType<T> = T extends ReadonlyArray<infer U> ? U : never; // TODO: move to an Utils monorepo package

// Type utility to extract the resolved type of an array of Promises
type ArrayElementType<T> = T extends (infer U)[] ? U : never; // TODO: move to an Utils monorepo package

type test = ReadonlyArrayElementType<
  PromiseValue<ReturnType<typeof getUserAuthorizedInstitutions>>
>;

export const retrieveUserAuthorizedInstitutions = async (
  selfCareUserId: string
): Promise<UserAuthorizedInstitutions> => {
  const apiResult = await getUserAuthorizedInstitutions(selfCareUserId);
  console.log("apiResult", apiResult);
  return { authorizedInstitutions: apiResult.map(toUserAuthorizedInstitution) };
};

export const retrieveInstitution = async (
  institutionId: string
): Promise<BackofficeInstitution> => {
  return toBackofficeInstitution(await getInstitutionById(institutionId));
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
