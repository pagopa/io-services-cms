import { ApimUtils } from "@io-services-cms/external-clients";
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
import * as E from "fp-ts/lib/Either";
import { Either } from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { TaskEither } from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

type ErrorResponses =
  | IResponseErrorForbiddenNotAuthorized
  | IResponseErrorInternal
  | IResponseErrorNotFound
  | IResponseErrorTooManyRequests;

const isManageKey = (ownerSubscriptionId: NonEmptyString) =>
  ownerSubscriptionId.startsWith(ApimUtils.SUBSCRIPTION_MANAGE_PREFIX);

const extractOwnerId = (
  fullPath?: string,
): Either<IResponseErrorNotFound, NonEmptyString> =>
  pipe(
    fullPath,
    O.fromNullable,
    O.foldW(
      () => E.left(ResponseErrorNotFound("Not found", "ownerId not found")),
      (f) => E.right(pipe(f as NonEmptyString, ApimUtils.parseIdFromFullPath)),
    ),
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
  apimService: ApimUtils.ApimService,
  serviceId: NonEmptyString,
  ownerSubscriptionId: NonEmptyString,
  userId: NonEmptyString,
): TaskEither<ErrorResponses, NonEmptyString> =>
  pipe(
    ownerSubscriptionId,
    TE.fromPredicate(isManageKey, () => ResponseErrorForbiddenNotAuthorized),
    TE.chainW(() =>
      pipe(
        serviceId,
        apimService.getSubscription,
        TE.mapLeft(({ statusCode }) =>
          statusCode === 404
            ? ResponseErrorNotFound("Not found", `${serviceId} not found`)
            : ResponseErrorInternal(
                `An error has occurred while retrieving service '${serviceId}'`,
              ),
        ),
      ),
    ),
    TE.chainW((serviceSubscription) =>
      pipe(
        serviceSubscription.ownerId,
        extractOwnerId,
        TE.fromEither,
        TE.chainW((ownerId) =>
          ownerId === userId
            ? TE.right(serviceId)
            : TE.left(ResponseErrorForbiddenNotAuthorized),
        ),
      ),
    ),
  );
