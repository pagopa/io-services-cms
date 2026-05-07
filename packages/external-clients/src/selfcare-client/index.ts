import { Agent, HttpAgentConfig } from "@io-services-cms/fetch-utils";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import axios, { AxiosError, AxiosInstance } from "axios";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";
import * as t from "io-ts";

import { StateEnum } from "../generated/api/Group";
import { InstitutionResponse } from "../generated/selfcare/InstitutionResponse";
import { ProductResource } from "../generated/selfcare/ProductResource";
import { UserInstitutionResource } from "../generated/selfcare/UserInstitutionResource";

export const UserInstitutions = t.readonlyArray(
  UserInstitutionResource,
  "UserInstitutions",
);
export type UserInstitutions = t.TypeOf<typeof UserInstitutions>;

export type GroupFilter = "*" | StateEnum;

export const InstitutionProducts = t.readonlyArray(
  ProductResource,
  "InstitutionProducts",
);
export type InstitutionProducts = t.TypeOf<typeof InstitutionProducts>;

export interface SelfcareClient {
  getInstitutionById: (
    id: string,
  ) => TE.TaskEither<AxiosError | Error, InstitutionResponse>;
}

const institutionsApi = "/institutions";
const usersApi = "/users";
const groupsApi = "/user-groups";
const delegationsApi = "/delegations";
let selfcareClient: SelfcareClient;

const getAxiosInstance = (
  url: string,
  apiKey: string,
  httpAgentConfig: HttpAgentConfig,
): AxiosInstance => {
  const endpoint = `${url}`;

  return axios.create({
    baseURL: endpoint,
    headers: { "Ocp-Apim-Subscription-Key": apiKey },
    httpAgent: Agent.getHttpAgent(httpAgentConfig),
    httpsAgent: Agent.getHttpsAgent(httpAgentConfig),
    timeout: 5000,
  });
};

const buildSelfcareClient = (
  url: string,
  apiKey: string,
  httpAgentConfig: HttpAgentConfig,
): SelfcareClient => {
  const axiosInstance = getAxiosInstance(url, apiKey, httpAgentConfig);

  const getInstitutionById: SelfcareClient["getInstitutionById"] = (id) =>
    pipe(
      TE.tryCatch(
        () => axiosInstance.get(`${institutionsApi}/${id}`),
        flow(
          E.fromPredicate(
            axios.isAxiosError,
            (e) =>
              new Error(`Error calling selfcare getInstitutionById API: ${e}`),
          ),
          E.toUnion,
        ),
      ),
      TE.chainW((response) =>
        pipe(
          response.data,
          InstitutionResponse.decode,
          E.mapLeft(flow(readableReport, E.toError)),
          TE.fromEither,
        ),
      ),
    );

  return {
    getInstitutionById,
  };
};

export const getSelfcareClient = (
  url: string,
  apiKey: string,
  httpAgentConfig: HttpAgentConfig,
): SelfcareClient => {
  if (!selfcareClient) {
    selfcareClient = buildSelfcareClient(url, apiKey, httpAgentConfig);
  }
  return selfcareClient;
};

export const resetInstance = (
  url: string,
  apiKey: string,
  httpAgentConfig: HttpAgentConfig,
) => {
  selfcareClient = buildSelfcareClient(url, apiKey, httpAgentConfig);
};
