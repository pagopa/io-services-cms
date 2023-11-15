import { Institution as BackofficeInstitution } from "@/generated/api/Institution";
import { getInstitutionById } from "./selfcare";

export const retrieveInstitution = async (
  institutionId: string
): Promise<BackofficeInstitution> => {
  return await getInstitutionById(institutionId);
};
