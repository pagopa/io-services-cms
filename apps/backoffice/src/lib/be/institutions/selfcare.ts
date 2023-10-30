import { HTTP_STATUS_NOT_FOUND } from "@/config/constants";
import {
  InstitutionNotFoundError,
  ManagedInternalError
} from "@/lib/be/errors";
import { getSelfcareClient } from "@/lib/be/selfcare-client";
import { Institution } from "@/types/selfcare/Institution";
import { InstitutionResources } from "@/types/selfcare/InstitutionResource";
import { isAxiosError } from "axios";
import * as E from "fp-ts/lib/Either";

export const getUserAuthorizedInstitutions = async (
  userIdForAuth: string
): Promise<InstitutionResources> => {
  const apiResult = await getSelfcareClient().getUserAuthorizedInstitutions(
    userIdForAuth
  )();

  // errore validazione parametri chiamata
  if (E.isLeft(apiResult)) {
    console.error(
      `An error has occurred while calling selfcare getInstitutionsUsingGET API, caused by: ${apiResult.left}`
    );
    throw new ManagedInternalError(
      "Error calling selfcare getInstitutionsUsingGET API"
    );
  }

  return apiResult.right;
};

export const getInstitutionById = async (id: string): Promise<Institution> => {
  const apiResult = await getSelfcareClient().getInstitutionById(id)();

  if (E.isLeft(apiResult)) {
    const errorResult = apiResult.left;
    if (
      isAxiosError(errorResult) &&
      errorResult.response?.status === HTTP_STATUS_NOT_FOUND
    ) {
      throw new InstitutionNotFoundError(
        `Institution having id '${id}' does not exists`
      );
    }
    console.error(
      `An error has occurred while calling selfcare getInstitution API, caused by: ${apiResult.left}`
    );
    throw new ManagedInternalError("Error calling selfcare getInstitution API");
  }

  return apiResult.right;
};
