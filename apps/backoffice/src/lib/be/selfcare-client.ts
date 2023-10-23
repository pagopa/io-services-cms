
import { createClient } from "@/generated/selfcare/client";
import { BooleanFromString } from "@pagopa/ts-commons/lib/booleans";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as t from "io-ts";
import { cache } from "react";

const Config = t.type({
  SELFCARE_BASE_URL: NonEmptyString,
  SELFCARE_API_MOCKING: BooleanFromString
});

const getSelfcareClientConfig = () => {
  const result = Config.decode(process.env);

  if (E.isLeft(result)) {
    throw new Error("error parsing selfcare client config", {
      cause: readableReport(result.left)
    });
  }
  return result.right;
};

export const getSelfcareClient = cache(() => {
  const configuration = getSelfcareClientConfig();

  if (configuration.SELFCARE_API_MOCKING) {
    const { setupMocks } = require("../../../mocks");
    setupMocks();
  }

  return createClient({
    baseUrl: configuration.SELFCARE_BASE_URL,
    fetchApi: (fetch as any) as typeof fetch,
  });
});
