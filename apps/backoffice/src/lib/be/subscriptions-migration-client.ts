import { MigrationDataValue } from "@/generated/api/MigrationDataValue";
import { MigrationDelegateList } from "@/generated/api/MigrationDelegateList";
import { MigrationItemList } from "@/generated/api/MigrationItemList";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import axios, { AxiosInstance } from "axios";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, identity, pipe } from "fp-ts/lib/function";
import * as t from "io-ts";
import { cache } from "react";
import { HealthChecksError } from "./errors";

type Config = t.TypeOf<typeof Config>;
const Config = t.type({
  SUBSCRIPTION_MIGRATIONS_URL: NonEmptyString,
  SUBSCRIPTION_MIGRATIONS_APIKEY: NonEmptyString
});

const getSubscriptionsMigrationConfig: () => Config = cache(() => {
  const result = Config.decode(process.env);

  if (E.isLeft(result)) {
    throw new Error("error parsing subscriptions migration config", {
      cause: readableReport(result.left)
    });
  }

  //   if (result.right.SELFCARE_API_MOCKING) {
  //     const { setupMocks } = require("../../../mocks");
  //     setupMocks();
  //   }
  return result.right;
});

const getAxiosInstance: () => AxiosInstance = cache(() => {
  const configuration = getSubscriptionsMigrationConfig();

  return axios.create({
    baseURL: configuration.SUBSCRIPTION_MIGRATIONS_URL,
    timeout: 5000,
    headers: { "X-Functions-Key": configuration.SUBSCRIPTION_MIGRATIONS_APIKEY }
  });
});

export type SubscriptionsMigrationClient = {
  getLatestOwnershipClaimStatus: (
    organizationFiscalCode: string
  ) => TE.TaskEither<Error, MigrationItemList>;
  getOwnershipClaimStatus: (
    organizationFiscalCode: string,
    delegateId: string
  ) => TE.TaskEither<Error, MigrationDataValue>;
  claimOwnership: (
    organizationFiscalCode: string,
    delegateId: string,
    body?: unknown
  ) => TE.TaskEither<Error, void>;
  getDelegatesByOrganization: (
    organizationFiscalCode: string
  ) => TE.TaskEither<Error, MigrationDelegateList>;
};

export const getSubscriptionsMigrationClient: () => SubscriptionsMigrationClient = cache(
  () => {
    const axiosInstance = getAxiosInstance();

    const getLatestOwnershipClaimStatus: SubscriptionsMigrationClient["getLatestOwnershipClaimStatus"] = organizationFiscalCode =>
      pipe(
        TE.tryCatch(
          () =>
            axiosInstance.get(
              `/organizations/${organizationFiscalCode}/ownership-claims/latest`
            ),
          identity
        ),
        TE.mapLeft(e => {
          if (axios.isAxiosError(e)) {
            return new Error(
              `subscriptions migration getLatestOwnershipClaimStatus Axios error catched ${e.message}`
            );
          } else {
            return new Error(
              `Error calling subscriptions migration getLatestOwnershipClaimStatus API: ${e}`
            );
          }
        }),
        TE.chainW(response =>
          pipe(
            response.data,
            MigrationItemList.decode,
            E.mapLeft(flow(readableReport, E.toError)),
            TE.fromEither
          )
        )
      );

    const getOwnershipClaimStatus: SubscriptionsMigrationClient["getOwnershipClaimStatus"] = (
      organizationFiscalCode,
      delegateId
    ) =>
      pipe(
        TE.tryCatch(
          () =>
            axiosInstance.get(
              `/organizations/${organizationFiscalCode}/ownership-claims/${delegateId}`
            ),
          identity
        ),
        TE.mapLeft(e => {
          if (axios.isAxiosError(e)) {
            return new Error(
              `subscriptions migration getOwnershipClaimStatus Axios error catched ${e.message}`
            );
          } else {
            return new Error(
              `Error calling subscriptions migration getOwnershipClaimStatus API: ${e}`
            );
          }
        }),
        TE.chainW(response =>
          pipe(
            response.data,
            MigrationDataValue.decode,
            E.mapLeft(flow(readableReport, E.toError)),
            TE.fromEither
          )
        )
      );

    const claimOwnership: SubscriptionsMigrationClient["claimOwnership"] = (
      organizationFiscalCode,
      delegateId,
      body
    ) =>
      pipe(
        TE.tryCatch(
          () =>
            axiosInstance.post(
              `/organizations/${organizationFiscalCode}/ownership-claims/${delegateId}`,
              body // TODO: verify f body is necessary
            ),
          identity
        ),
        TE.mapLeft(e => {
          if (axios.isAxiosError(e)) {
            return new Error(
              `subscriptions migration claimOwnership Axios error catched ${e.message}`
            );
          } else {
            return new Error(
              `Error calling subscriptions migration claimOwnership API: ${e}`
            );
          }
        }),
        TE.map(_ => void 0)
      );

    const getDelegatesByOrganization: SubscriptionsMigrationClient["getDelegatesByOrganization"] = organizationFiscalCode =>
      pipe(
        TE.tryCatch(
          () =>
            axiosInstance.get(
              `/organizations/${organizationFiscalCode}/delegates`
            ),
          identity
        ),
        TE.mapLeft(e => {
          if (axios.isAxiosError(e)) {
            return new Error(
              `subscriptions migration getDelegatesByOrganization Axios error catched ${e.message}`
            );
          } else {
            return new Error(
              `Error calling subscriptions migration getDelegatesByOrganization API: ${e}`
            );
          }
        }),
        TE.chainW(response =>
          pipe(
            response.data,
            MigrationDelegateList.decode,
            E.mapLeft(flow(readableReport, E.toError)),
            TE.fromEither
          )
        )
      );

    return {
      getLatestOwnershipClaimStatus,
      getOwnershipClaimStatus,
      claimOwnership,
      getDelegatesByOrganization
    };
  }
);

export async function getSubscriptionsMigrationHealth() {
  try {
    getSubscriptionsMigrationConfig();
  } catch (e) {
    throw new HealthChecksError("subscriptions-migration", e);
  }
}
