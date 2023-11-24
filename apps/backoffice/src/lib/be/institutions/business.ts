import { Institution as BackofficeInstitution } from "@/generated/api/Institution";
import { UserAuthorizedInstitution } from "@/generated/api/UserAuthorizedInstitution";
import {
  InstitutionResource,
  InstitutionResources
} from "@/types/selfcare/InstitutionResource";
import { getInstitutionById, getUserAuthorizedInstitutions } from "./selfcare";
import { UserAuthorizedInstitutions } from "@/generated/api/UserAuthorizedInstitutions";

export const retrieveUserAuthorizedInstitutions = async (
  selfCareUserId: string
): Promise<UserAuthorizedInstitutions> => {
  const apiResult = await getUserAuthorizedInstitutions(selfCareUserId);
  return { authorizedInstitutions: apiResult.map(toUserAuthorizedInstitution) };
};

export const retrieveInstitution = async (
  institutionId: string
): Promise<BackofficeInstitution> => {
  return await getInstitutionById(institutionId);
};

const toUserAuthorizedInstitution = (
  institutionResource: InstitutionResource
): UserAuthorizedInstitution => ({
  id: institutionResource.id,
  name: institutionResource.description,
  role: institutionResource.userProductRoles?.[0],
  logo_url: institutionResource.logo
});
