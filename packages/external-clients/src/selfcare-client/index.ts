import { Agent, HttpAgentConfig } from "@io-services-cms/fetch-utils";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import axios, { AxiosError, AxiosInstance } from "axios";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";
import * as t from "io-ts";

import { StateEnum } from "../generated/api/Group";
import { DelegationResponse } from "../generated/selfcare/DelegationResponse";
import { DelegationWithPaginationResponse } from "../generated/selfcare/DelegationWithPaginationResponse";
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

const PageInfoStrict = t.type({
  pageNo: t.number,
  pageSize: t.number,
  totalElements: t.number,
  totalPages: t.number,
});

export const DelegationWithPaginationResponseStrict = t.intersection([
  DelegationWithPaginationResponse,
  t.type({
    delegations: t.readonlyArray(DelegationResponse),
    pageInfo: PageInfoStrict,
  }),
]);
export type DelegationWithPaginationResponseStrict = t.TypeOf<
  typeof DelegationWithPaginationResponseStrict
>;

export interface SelfcareClient {
  getInstitutionById: (
    id: string,
  ) => TE.TaskEither<AxiosError | Error, InstitutionResponse>;
  /**
   * Returns paginated delegations for a broker institution (aggregator).
   * @param institutionId the broker/aggregator institution id
   * @param size max number of delegations per page
   * @param page page number (0-based)
   * @param search optional search term
   */
  getInstitutionDelegations: (
    institutionId: string,
    size?: number,
    page?: number,
    search?: string,
  ) => TE.TaskEither<Error, DelegationWithPaginationResponseStrict>;
}

const institutionsApi = "/institutions";
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

  const getInstitutionDelegations: SelfcareClient["getInstitutionDelegations"] =
    (institutionId, size, page, search) =>
      pipe(
        TE.tryCatch(
          () =>
            axiosInstance.get(`${delegationsApi}/delegations-with-pagination`, {
              params: {
                brokerId: institutionId,
                order: "ASC",
                page,
                search,
                size,
              },
            }),
          flow(
            E.fromPredicate(
              axios.isAxiosError,
              (e) =>
                new Error(
                  `Error calling selfcare getInstitutionDelegations API: ${e}`,
                ),
            ),
            E.toUnion,
          ),
        ),
        TE.chainEitherK((response) =>
          pipe(
            response.data,
            DelegationWithPaginationResponseStrict.decode,
            E.mapLeft((e) => pipe(e, readableReport, E.toError)),
          ),
        ),
      );

  return {
    getInstitutionById,
    getInstitutionDelegations,
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
