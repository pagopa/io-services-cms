import { createClient } from "@/lib/be/selfcare/client";
import { BooleanFromString } from "@pagopa/ts-commons/lib/booleans";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";
import * as t from "io-ts";
import { cache } from "react";
import { Institution } from "./selfcare/Institution";
import { InstitutionResources } from "./selfcare/InstitutionResource";

const Config = t.type({
  SELFCARE_BASE_URL: NonEmptyString,
  SELFCARE_BASE_PATH: NonEmptyString,
  SELFCARE_API_KEY: NonEmptyString,
  SELFCARE_API_MOCKING: BooleanFromString
});

const getSelfcareConfig = () => {
  const result = Config.decode(process.env);

  if (E.isLeft(result)) {
    throw new Error("error parsing selfcare config", {
      cause: readableReport(result.left)
    });
  }
  return result.right;
};

const getSelfcareClient = () => {
  const configuration = getSelfcareConfig();

  if (configuration.SELFCARE_API_MOCKING) {
    const { setupMocks } = require("../../../mocks");
    setupMocks();
  }

  return createClient({
    baseUrl: configuration.SELFCARE_BASE_URL,
    fetchApi: (fetch as any) as typeof fetch,
    basePath: configuration.SELFCARE_BASE_PATH
  });
};

export const getSelfcareService = cache(() => {
  const configuration = getSelfcareConfig();
  const selfcareClient = getSelfcareClient();

  const getUserAuthorizedInstitutions = (
    userIdForAuth: string
  ): TE.TaskEither<Error, InstitutionResources> =>
    pipe(
      TE.tryCatch(
        () =>
          selfcareClient.getInstitutionsUsingGET({
            apiKeyHeader: configuration.SELFCARE_API_KEY,
            userIdForAuth
          }),
        E.toError
      ),
      TE.chain(
        flow(
          E.chainW(InstitutionResources.decode),
          E.mapLeft(flow(readableReport, E.toError)),
          TE.fromEither
        )
      )
    );

  const getInstitutionById = (id: string): TE.TaskEither<Error, Institution> =>
    pipe(
      TE.tryCatch(
        () =>
          selfcareClient.getInstitution({
            apiKeyHeader: configuration.SELFCARE_API_KEY,
            id
          }),
        E.toError
      ),
      TE.chain(flow(E.mapLeft(flow(readableReport, E.toError)), TE.fromEither))
    );

  return {
    getUserAuthorizedInstitutions,
    getInstitutionById
  };
});
