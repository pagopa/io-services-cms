import { createClient } from "@/generated/selfcare/client";
import { BooleanFromString } from "@pagopa/ts-commons/lib/booleans";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as t from "io-ts";
import { cache } from "react";

const Config = t.type({
  SELFCARE_BASE_URL: NonEmptyString,
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
    fetchApi: (fetch as any) as typeof fetch
  });
};

export const getSelfcareService = cache(() => {
  const configuration = getSelfcareConfig();
  const selfcareClient = getSelfcareClient();

  const getUserAuthorizedInstitutions = async (userIdForAuth: string) => {
    const result = await selfcareClient.getInstitutionsUsingGET({
      apiKeyHeader: configuration.SELFCARE_API_KEY,
      userIdForAuth
    });
    return result;
  };

  const getInstitutionById = async (id: string) => {
    const result = await selfcareClient.getInstitution({
      apiKeyHeader: configuration.SELFCARE_API_KEY,
      id
    });
    return result;
  };

  return {
    getUserAuthorizedInstitutions,
    getInstitutionById
  };
});
