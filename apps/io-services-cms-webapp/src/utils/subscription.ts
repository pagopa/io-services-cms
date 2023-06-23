import { ApiManagementClient } from "@azure/arm-apimanagement";
import {
  IResponseErrorForbiddenNotAuthorized,
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorTooManyRequests,
  ResponseErrorForbiddenNotAuthorized,
  ResponseErrorInternal,
  ResponseErrorNotFound,
} from "@pagopa/ts-commons/lib/responses";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { TaskEither } from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { IConfig } from "../config";
import {
  getSubscription,
  parseOwnerIdFullPath,
} from "../lib/clients/apim-client";
import { MANAGE_APIKEY_PREFIX } from "./api-keys";

type ErrorResponses =
  | IResponseErrorNotFound
  | IResponseErrorForbiddenNotAuthorized
  | IResponseErrorInternal
  | IResponseErrorTooManyRequests;

const isManageKey = (ownerSubscriptionId: NonEmptyString) =>
  ownerSubscriptionId.startsWith(MANAGE_APIKEY_PREFIX);

const areUserAndOwnerEquals = (
  ownerId: NonEmptyString,
  userId: NonEmptyString
) => ownerId === userId;

const extractOwnerId = (
  fullPath?: string
): TaskEither<IResponseErrorNotFound, NonEmptyString> =>
  pipe(
    fullPath,
    O.fromNullable,
    O.foldW(
      () => TE.left(ResponseErrorNotFound("Not found", "ownerId not found")),
      (f) => TE.right(pipe(f as NonEmptyString, parseOwnerIdFullPath))
    )
  );

/**
 * Using the **API Manage key** as 'Ocp-Apim-Subscription-Key', the Subscription relating to this key will have a name starting with "MANAGE-"
 * and accordingly no longer equal to the serviceId.
 *
 * Therefore, since it is no longer possible to verify the equality *subscriptionId == serviceId*,
 * it is necessary to verify that the owner of the subscription of the API Key is the same owner of the Subscription to which the ServiceId belongs
 *
 * @param config
 * @param apimClient
 * @param serviceId
 * @param ownerSubscriptionId subscriptionId related to 'Ocp-Apim-Subscription-Key'
 * @param userId APIM userId
 * @returns
 */
export const serviceOwnerCheckManageTask = (
  config: IConfig,
  apimClient: ApiManagementClient,
  serviceId: NonEmptyString,
  ownerSubscriptionId: NonEmptyString,
  userId: NonEmptyString
): TaskEither<ErrorResponses, NonEmptyString> =>
  pipe(
    ownerSubscriptionId,
    TE.fromPredicate(isManageKey, () => ResponseErrorForbiddenNotAuthorized),
    TE.chainW(() =>
      pipe(
        getSubscription(
          apimClient,
          config.AZURE_APIM_RESOURCE_GROUP,
          config.AZURE_APIM,
          serviceId
        ),
        TE.mapLeft(() =>
          ResponseErrorInternal(
            `An error has occurred while retrieving service '${serviceId}'`
          )
        )
      )
    ),
    TE.chainW((serviceSubscription) =>
      pipe(
        serviceSubscription.ownerId,
        extractOwnerId,
        TE.chainW((ownerId) =>
          areUserAndOwnerEquals(ownerId, userId)
            ? TE.right(serviceId)
            : TE.left(ResponseErrorForbiddenNotAuthorized)
        )
      )
    )
  );
