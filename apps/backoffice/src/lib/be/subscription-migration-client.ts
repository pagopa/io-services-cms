import { MigrationData } from "@/generated/api/MigrationData";
import { MigrationDelegateList } from "@/generated/api/MigrationDelegateList";
import { MigrationItemList } from "@/generated/api/MigrationItemList";
import {
  getKeepAliveAgentOptions,
  newHttpAgent,
  newHttpsAgent
} from "@pagopa/ts-commons/lib/agent";
import { BooleanFromString } from "@pagopa/ts-commons/lib/booleans";
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
  SUBSCRIPTION_MIGRATION_API_URL: NonEmptyString,
  SUBSCRIPTION_MIGRATION_API_KEY: NonEmptyString,
  SUBSCRIPTION_MIGRATION_API_MOCKING: BooleanFromString
});

const getSubscriptionsMigrationConfig: () => Config = cache(() => {
  const result = Config.decode(process.env);

  if (E.isLeft(result)) {
    throw new Error("error parsing subscriptions migration config", {
      cause: readableReport(result.left)
    });
  }

  if (result.right.SUBSCRIPTION_MIGRATION_API_MOCKING) {
    const { setupMocks } = require("../../../mocks");
    setupMocks();
  }
  return result.right;
});

const getAxiosInstance: () => AxiosInstance = () => {
  const configuration = getSubscriptionsMigrationConfig();

  return axios.create({
    baseURL: configuration.SUBSCRIPTION_MIGRATION_API_URL,
    timeout: 5000,
    headers: {
      "X-Functions-Key": configuration.SUBSCRIPTION_MIGRATION_API_KEY
    },
    httpAgent: newHttpAgent(getKeepAliveAgentOptions(process.env)),
    httpsAgent: newHttpsAgent(getKeepAliveAgentOptions(process.env))
  });
};

export type SubscriptionsMigrationClient = {
  getLatestOwnershipClaimStatus: (
    organizationFiscalCode: string
  ) => TE.TaskEither<Error, MigrationItemList>;
  getOwnershipClaimStatus: (
    organizationFiscalCode: string,
    delegateId: string
  ) => TE.TaskEither<Error, MigrationData>;
  claimOwnership: (
    organizationFiscalCode: string,
    delegateId: string
  ) => TE.TaskEither<Error, void>;
  getDelegatesByOrganization: (
    organizationFiscalCode: string
  ) => TE.TaskEither<Error, MigrationDelegateList>;
};

export const getSubscriptionsMigrationClient = cache(
  (): SubscriptionsMigrationClient => {
    const axiosInstance = getAxiosInstance();

    const getLatestOwnershipClaimStatus = (
      organizationFiscalCode: string
    ): TE.TaskEither<Error, MigrationItemList> =>
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

    const getOwnershipClaimStatus = (
      organizationFiscalCode: string,
      delegateId: string
    ): TE.TaskEither<Error, MigrationData> =>
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
            MigrationData.decode,
            E.mapLeft(flow(readableReport, E.toError)),
            TE.fromEither
          )
        )
      );

    const claimOwnership = (
      organizationFiscalCode: string,
      delegateId: string
    ): TE.TaskEither<Error, void> =>
      pipe(
        TE.tryCatch(
          () =>
            axiosInstance.post(
              `/organizations/${organizationFiscalCode}/ownership-claims/${delegateId}`
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

    const getDelegatesByOrganization = (
      organizationFiscalCode: string
    ): TE.TaskEither<Error, MigrationDelegateList> =>
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
              `subscriptions migration getDelegatesByOrganization Axios error catched ${e}, organizationFiscalCode: ${organizationFiscalCode}`
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
    throw new HealthChecksError("subscription-migration", e);
  }
}
