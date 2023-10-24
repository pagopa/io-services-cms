import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";
import { getSelfcareService } from "../selfcare-service";
import { Institution } from "../selfcare/Institution";
import { InstitutionResources } from "../selfcare/InstitutionResource";
import { HTTP_STATUS_NOT_FOUND } from "@/config/constants";
import { InstitutionNotFoundError } from "../errors";

export const getUserAuthorizedInstitutions = async (
  userIdForAuth: string
): Promise<InstitutionResources> => {
  const apiResult = await getSelfcareService().getUserAuthorizedInstitutions(
    userIdForAuth
  );

  // errore validazione parametri chiamata
  if (E.isLeft(apiResult)) {
    const errorDetail = pipe(apiResult.left, readableReport);
    console.error(
      `An error has occurred while calling selfcare getInstitutionsUsingGET API, caused by: ${errorDetail}`
    );
    throw new Error("Error calling selfcare getInstitutionsUsingGET API");
  }

  // decodifica risposta
  const resultDecoded = pipe(
    apiResult.right.value,
    InstitutionResources.decode,
    E.mapLeft(flow(readableReport, E.toError))
  );

  if (E.isLeft(resultDecoded)) {
    console.error(
      `An error has occurred while decoding selfcare getInstitutionsUsingGET API response, caused by: ${resultDecoded.left}`
    );
    throw new Error("Error selfcare getInstitutionsUsingGET API response");
  }

  return resultDecoded.right;
};

export const getInstitutionById = async (id: string): Promise<Institution> => {
  const apiResult = await getSelfcareService().getInstitutionById(id);

  if (E.isLeft(apiResult)) {
    const errorDetail = pipe(apiResult.left, readableReport);
    console.error(
      `An error has occurred while calling selfcare getInstitution API, caused by: ${errorDetail}`
    );
    throw new Error("Error calling selfcare getInstitution API");
  }

  const { status, value } = apiResult.right;

  if (status === HTTP_STATUS_NOT_FOUND) {
    throw new InstitutionNotFoundError(
      `Institution having id '${id} does not exists`
    );
  }

  // decodifica risposta
  const resultDecoded = pipe(
    apiResult.right.value,
    Institution.decode,
    E.mapLeft(flow(readableReport, E.toError))
  );

  if (E.isLeft(resultDecoded)) {
    console.error(
      `An error has occurred while decoding selfcare getInstitution API response, caused by: ${resultDecoded.left}`
    );
    throw new Error("Error selfcare getInstitution API response");
  }

  return resultDecoded.right;
};
