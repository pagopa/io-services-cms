import { Configuration } from "@/config";
import {
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NOT_FOUND
} from "@/config/constants";
import { CosmosClient } from "@azure/cosmos";
import {
  SUBSCRIPTION_CIDRS_COLLECTION_NAME,
  SubscriptionCIDRsModel
} from "@pagopa/io-functions-commons/dist/src/models/subscription_cidrs";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { NextResponse } from "next/server";
import { BackOfficeUser } from "../../../../types/next-auth";

export const buildSubscriptionCIDRsModel = (
  configuration: Configuration
): SubscriptionCIDRsModel => {
  const cosmosdbClient = new CosmosClient({
    endpoint: configuration.LEGACY_COSMOSDB_URI,
    key: configuration.LEGACY_COSMOSDB_KEY
  });

  const cosmosdbInstance = cosmosdbClient.database(
    configuration.LEGACY_COSMOSDB_NAME
  );

  return new SubscriptionCIDRsModel(
    cosmosdbInstance.container(SUBSCRIPTION_CIDRS_COLLECTION_NAME)
  );
};

export const retrieveManageKeyCIDRs = (
  subscriptionCIDRsModel: SubscriptionCIDRsModel
) => (backOfficeUser: BackOfficeUser) =>
  pipe(
    subscriptionCIDRsModel.findLastVersionByModelId([
      backOfficeUser.parameters.subscriptionId as NonEmptyString
    ]),
    TE.mapLeft(error =>
      NextResponse.json(
        {
          title: "ManageKeyCIDRsError",
          status: HTTP_STATUS_INTERNAL_SERVER_ERROR,
          detail: JSON.stringify(error)
        },
        { status: HTTP_STATUS_INTERNAL_SERVER_ERROR }
      )
    ),
    TE.chainW(
      TE.fromOption(() =>
        NextResponse.json(
          {
            title: "ManageKeyCIDRsNotFound",
            status: HTTP_STATUS_NOT_FOUND,
            detail: "Manage Key CIDRs not found"
          },
          { status: HTTP_STATUS_NOT_FOUND }
        )
      )
    ),
    TE.map(response =>
      NextResponse.json({
        cidrs: response.cidrs
      })
    ),
    TE.toUnion
  );
