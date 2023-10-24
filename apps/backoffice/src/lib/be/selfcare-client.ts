import { BooleanFromString } from "@pagopa/ts-commons/lib/booleans";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import axios, { AxiosError } from "axios";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, identity, pipe } from "fp-ts/lib/function";
import * as t from "io-ts";
//import { cache } from "react";
import { Institution } from "../../types/selfcare/Institution";
import { InstitutionResources } from "../../types/selfcare/InstitutionResource";
import { cache } from "react";

const institutionsApi = "/institutions";

const Config = t.type({
  SELFCARE_BASE_URL: NonEmptyString,
  SELFCARE_BASE_PATH: NonEmptyString,
  SELFCARE_API_KEY: NonEmptyString,
  SELFCARE_API_MOCKING: BooleanFromString
});

const getSelfcareConfig = cache(() => {
  const result = Config.decode(process.env);

  if (E.isLeft(result)) {
    throw new Error("error parsing selfcare config", {
      cause: readableReport(result.left)
    });
  }

  if (result.right.SELFCARE_API_MOCKING) {
    const { setupMocks } = require("../../../mocks");
    setupMocks();
  }
  return result.right;
});

const getAxiosInstance = cache(() => {
  const configuration = getSelfcareConfig();
  const endpoint = `${configuration.SELFCARE_BASE_URL}/${configuration.SELFCARE_BASE_PATH}`;

  return axios.create({
    baseURL: endpoint,
    timeout: 5000,
    headers: { "Ocp-Apim-Subscription-Key": configuration.SELFCARE_API_KEY }
  });
});

export const getSelfcareClient = cache(() => {
  const axiosInstance = getAxiosInstance();

  const getUserAuthorizedInstitutions = (
    userIdForAuth: string
  ): TE.TaskEither<Error, InstitutionResources> =>
    pipe(
      TE.tryCatch(
        () =>
          axiosInstance.get(institutionsApi, {
            params: {
              userIdForAuth
            }
          }),
        identity
      ),
      TE.mapLeft(e => {
        if (axios.isAxiosError(e)) {
          return new Error(`Axios error catched ${e.message}`);
        } else {
          return new Error(
            `Error calling selfcare getUserAuthorizedInstitutions API: ${e}`
          );
        }
      }),
      TE.chainW(response =>
        pipe(
          response.data,
          InstitutionResources.decode,
          E.mapLeft(flow(readableReport, E.toError)),
          TE.fromEither
        )
      )
    );

  const getInstitutionById = (
    id: string
  ): TE.TaskEither<Error | AxiosError, Institution> =>
    pipe(
      TE.tryCatch(
        () => axiosInstance.get(`${institutionsApi}/${id}`),
        identity
      ),
      TE.mapLeft(e => {
        if (axios.isAxiosError(e)) {
          return e;
        } else {
          return new Error(
            `Error calling selfcare getInstitutionById API: ${e}`
          );
        }
      }),
      TE.chainW(response =>
        pipe(
          response.data,
          Institution.decode,
          E.mapLeft(flow(readableReport, E.toError)),
          TE.fromEither
        )
      )
    );

  return {
    getUserAuthorizedInstitutions,
    getInstitutionById
  };
});
