import { Agent, HttpAgentConfig } from "@io-services-cms/fetch-utils";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import axios, { AxiosError, AxiosInstance } from "axios";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, identity, pipe } from "fp-ts/lib/function";
import * as t from "io-ts";

import { StateEnum } from "../generated/api/Group";
import { DelegationWithPaginationResponse } from "../generated/selfcare/DelegationWithPaginationResponse";
import { InstitutionResponse } from "../generated/selfcare/InstitutionResponse";
import { PageOfUserGroupResource } from "../generated/selfcare/PageOfUserGroupResource";
import { ProductResource } from "../generated/selfcare/ProductResource";
import { UserGroupResource } from "../generated/selfcare/UserGroupResource";
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
  getGroup: (
    id: NonEmptyString,
  ) => TE.TaskEither<AxiosError | Error, UserGroupResource>;
  getInstitutionById: (
    id: string,
  ) => TE.TaskEither<AxiosError | Error, InstitutionResponse>;
  getInstitutionDelegations: (
    institutionId: string,
    size?: number,
    page?: number,
    search?: string,
  ) => TE.TaskEither<Error, DelegationWithPaginationResponse>;
  getInstitutionGroups: (
    institutionId: string,
    size?: number,
    page?: number,
    state?: GroupFilter,
    parentInstitutionId?: string,
  ) => TE.TaskEither<Error, PageOfUserGroupResource>;
  getInstitutionProducts: (
    institutionId: string,
    userId: string,
  ) => TE.TaskEither<Error, InstitutionProducts>;
  getUserAuthorizedInstitutions: (
    userId: string,
  ) => TE.TaskEither<Error, UserInstitutions>;
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

  const getInstitutionGroups: SelfcareClient["getInstitutionGroups"] = (
    institutionId,
    size?,
    page?,
    state = StateEnum.ACTIVE,
    parentInstitutionId?,
  ) =>
    pipe(
      TE.tryCatch(
        () =>
          axiosInstance.get(`${groupsApi}`, {
            params: {
              institutionId,
              page,
              parentInstitutionId,
              size,
              status: state === "*" ? undefined : state,
            },
          }),
        flow(
          E.fromPredicate(
            axios.isAxiosError,
            (e) => new Error(`Error calling selfcare getUserGroups API: ${e}`),
          ),
          E.toUnion,
        ),
      ),
      TE.chainW((response) =>
        pipe(
          response.data,
          PageOfUserGroupResource.decode,
          E.mapLeft(flow(readableReport, E.toError)),
          TE.fromEither,
        ),
      ),
    );

  const getGroup: SelfcareClient["getGroup"] = (id) =>
    pipe(
      TE.tryCatch(
        () => axiosInstance.get(`${groupsApi}/${id}`),
        flow(
          E.fromPredicate(
            axios.isAxiosError,
            (e) => new Error(`Error calling selfcare getGroup API: ${e}`),
          ),
          E.toUnion,
        ),
      ),
      TE.chainEitherK((response) =>
        pipe(
          response.data,
          UserGroupResource.decode,
          E.mapLeft((e) => pipe(e, readableReport, E.toError)),
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
                new Error(`Error calling selfcare getDelegations API: ${e}`),
            ),
            E.toUnion,
          ),
        ),
        TE.chainEitherK((response) =>
          pipe(
            response.data,
            DelegationWithPaginationResponse.decode,
            E.mapLeft((e) => pipe(e, readableReport, E.toError)),
          ),
        ),
      );

  const getInstitutionProducts: SelfcareClient["getInstitutionProducts"] = (
    institutionId,
    userId,
  ) =>
    pipe(
      TE.tryCatch(
        () =>
          axiosInstance.get(`${institutionsApi}/${institutionId}/products`, {
            params: {
              userId,
            },
          }),
        flow(
          E.fromPredicate(
            axios.isAxiosError,
            (e) =>
              new Error(
                `Error calling selfcare getInstitutionProducts API: ${e}`,
              ),
          ),
          E.toUnion,
        ),
      ),
      TE.chainEitherK((response) =>
        pipe(
          response.data,
          InstitutionProducts.decode,
          E.mapLeft((e) => pipe(e, readableReport, E.toError)),
        ),
      ),
    );

  return {
    getGroup,
    getInstitutionById,
    getInstitutionDelegations,
    getInstitutionGroups,
    getInstitutionProducts,
    getUserAuthorizedInstitutions,
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
