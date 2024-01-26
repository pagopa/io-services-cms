import { SupportRequestDto } from "@/types/selfcare/SupportRequestDto";
import { SupportResponse } from "@/types/selfcare/SupportResponse";
import {
  getKeepAliveAgentOptions,
  newHttpAgent,
  newHttpsAgent
} from "@pagopa/ts-commons/lib/agent";
import { BooleanFromString } from "@pagopa/ts-commons/lib/booleans";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import axios, { AxiosError, AxiosInstance } from "axios";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, identity, pipe } from "fp-ts/lib/function";
import * as t from "io-ts";
import { Institution } from "../../types/selfcare/Institution";
import { InstitutionResources } from "../../types/selfcare/InstitutionResources";
import { HealthChecksError } from "./errors";

export type SelfcareClient = {
  getUserAuthorizedInstitutions: (
    userIdForAuth: string
  ) => TE.TaskEither<Error, InstitutionResources>;
  getInstitutionById: (
    id: string
  ) => TE.TaskEither<Error | AxiosError, Institution>;
  sendSupportRequest: (
    request: SupportRequestDto
  ) => TE.TaskEither<Error, SupportResponse>;
};

type Config = t.TypeOf<typeof Config>;
const Config = t.type({
  SELFCARE_EXTERNAL_API_BASE_URL: NonEmptyString,
  SELFCARE_API_KEY: NonEmptyString,
  SELFCARE_API_MOCKING: BooleanFromString
});

const institutionsApi = "/institutions";
const supportApi = "/support";
let selfcareConfig: Config;
let selfcareClient: SelfcareClient;

const getSelfcareConfig = (): Config => {
  if (!selfcareConfig) {
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
    selfcareConfig = result.right;
  }

  return selfcareConfig;
};

const getAxiosInstance = (): AxiosInstance => {
  const configuration = getSelfcareConfig();
  const endpoint = `${configuration.SELFCARE_EXTERNAL_API_BASE_URL}`;

  return axios.create({
    baseURL: endpoint,
    timeout: 5000,
    headers: { "Ocp-Apim-Subscription-Key": configuration.SELFCARE_API_KEY },
    httpAgent: newHttpAgent(getKeepAliveAgentOptions(process.env)),
    httpsAgent: newHttpsAgent(getKeepAliveAgentOptions(process.env))
  });
};

const buildSelfcareClient = (): SelfcareClient => {
  const axiosInstance = getAxiosInstance();

  const getUserAuthorizedInstitutions: SelfcareClient["getUserAuthorizedInstitutions"] = userIdForAuth =>
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

  const getInstitutionById: SelfcareClient["getInstitutionById"] = id =>
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

  const sendSupportRequest: SelfcareClient["sendSupportRequest"] = request =>
    pipe(
      TE.tryCatch(() => axiosInstance.post(supportApi, request), identity),
      TE.mapLeft(e => {
        if (axios.isAxiosError(e)) {
          return new Error(`REST client error catched: ${e.message}`);
        } else {
          return new Error(`Unexpected error: ${e}`);
        }
      }),
      TE.chainW(response =>
        pipe(
          response.data,
          SupportResponse.decode,
          E.mapLeft(flow(readableReport, E.toError)),
          TE.fromEither
        )
      )
    );

  return {
    getUserAuthorizedInstitutions,
    getInstitutionById,
    sendSupportRequest
  };
};

export const getSelfcareClient = (): SelfcareClient => {
  if (!selfcareClient) {
    selfcareClient = buildSelfcareClient();
  }
  return selfcareClient;
};

export const resetInstance = () => {
  selfcareClient = buildSelfcareClient();
};

export async function getSelfcareHealth() {
  try {
    getSelfcareConfig();
  } catch (e) {
    throw new HealthChecksError("selfcare-client", e);
  }
}
