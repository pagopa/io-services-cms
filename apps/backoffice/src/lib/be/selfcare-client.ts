import { PageOfUserGroupResource } from "@/generated/selfcare/PageOfUserGroupResource";
import {
  getKeepAliveAgentOptions,
  newHttpAgent,
  newHttpsAgent,
} from "@pagopa/ts-commons/lib/agent";
import { BooleanFromString } from "@pagopa/ts-commons/lib/booleans";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import axios, { AxiosError, AxiosInstance } from "axios";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, identity, pipe } from "fp-ts/lib/function";
import * as t from "io-ts";

import { Institution } from "../../generated/selfcare/Institution";
import { UserInstitutionResponse } from "../../generated/selfcare/UserInstitutionResponse";
import { HealthChecksError } from "./errors";

export const UserInstitutions = t.readonlyArray(
  UserInstitutionResponse,
  "UserInstitutions",
);
export type UserInstitutions = t.TypeOf<typeof UserInstitutions>;

export interface SelfcareClient {
  getInstitutionById: (
    id: string,
  ) => TE.TaskEither<AxiosError | Error, Institution>;
  getInstitutionGroups: (
    institutionId: string,
    limit?: number,
    offset?: number,
  ) => TE.TaskEither<Error, PageOfUserGroupResource>;
  getUserAuthorizedInstitutions: (
    userId: string,
  ) => TE.TaskEither<Error, UserInstitutions>;
}

type Config = t.TypeOf<typeof Config>;
const Config = t.type({
  SELFCARE_API_KEY: NonEmptyString,
  SELFCARE_API_MOCKING: BooleanFromString,
  SELFCARE_EXTERNAL_API_BASE_URL: NonEmptyString,
});

const institutionsApi = "/institutions";
const usersApi = "/users";
const groupsApi = "/user-groups";
let selfcareConfig: Config;
let selfcareClient: SelfcareClient;

const getSelfcareConfig = (): Config => {
  if (!selfcareConfig) {
    const result = Config.decode(process.env);

    if (E.isLeft(result)) {
      throw new Error("error parsing selfcare config", {
        cause: readableReport(result.left),
      });
    }

    if (result.right.SELFCARE_API_MOCKING) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
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
    headers: { "Ocp-Apim-Subscription-Key": configuration.SELFCARE_API_KEY },
    httpAgent: newHttpAgent(getKeepAliveAgentOptions(process.env)),
    httpsAgent: newHttpsAgent(getKeepAliveAgentOptions(process.env)),
    timeout: 5000,
  });
};

const buildSelfcareClient = (): SelfcareClient => {
  const axiosInstance = getAxiosInstance();

  const getUserAuthorizedInstitutions: SelfcareClient["getUserAuthorizedInstitutions"] =
    (userId) =>
      pipe(
        TE.tryCatch(
          () =>
            axiosInstance.get(usersApi, {
              params: {
                size: 10000,
                states: "ACTIVE",
                userId,
              },
            }),
          identity,
        ),
        TE.mapLeft((e) => {
          if (axios.isAxiosError(e)) {
            return new Error(`Axios error catched ${e.message}`);
          } else {
            return new Error(
              `Error calling selfcare getUserAuthorizedInstitutions API: ${e}`,
            );
          }
        }),
        TE.chainW((response) =>
          pipe(
            response.data,
            UserInstitutions.decode,
            E.mapLeft(flow(readableReport, E.toError)),
            TE.fromEither,
          ),
        ),
      );

  const getInstitutionById: SelfcareClient["getInstitutionById"] = (id) =>
    pipe(
      TE.tryCatch(
        () => axiosInstance.get(`${institutionsApi}/${id}`),
        identity,
      ),
      TE.mapLeft((e) => {
        if (axios.isAxiosError(e)) {
          return e;
        } else {
          return new Error(
            `Error calling selfcare getInstitutionById API: ${e}`,
          );
        }
      }),
      TE.chainW((response) =>
        pipe(
          response.data,
          Institution.decode,
          E.mapLeft(flow(readableReport, E.toError)),
          TE.fromEither,
        ),
      ),
    );

  const getInstitutionGroups: SelfcareClient["getInstitutionGroups"] = (
    institutionId: string,
    limit?: number,
    offset?: number,
  ) =>
    pipe(
      TE.tryCatch(
        () =>
          axiosInstance.get(`${groupsApi}`, {
            params: {
              institutionId,
              page: offset,
              size: limit,
              status: "ACTIVE",
            },
          }),
        identity,
      ),
      TE.mapLeft((e) => {
        if (axios.isAxiosError(e)) {
          return e;
        } else {
          return new Error(`Error calling selfcare getUserGroups API: ${e}`);
        }
      }),
      TE.chainW((response) =>
        pipe(
          response.data,
          PageOfUserGroupResource.decode,
          E.mapLeft(flow(readableReport, E.toError)),
          TE.fromEither,
        ),
      ),
    );

  return {
    getInstitutionById,
    getInstitutionGroups,
    getUserAuthorizedInstitutions,
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
