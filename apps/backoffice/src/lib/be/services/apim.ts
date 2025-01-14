import { HTTP_STATUS_NOT_FOUND } from "@/config/constants";
import { SubscriptionCollection } from "@azure/arm-apimanagement";
import { ApimUtils } from "@io-services-cms/external-clients";
import { isAxiosError } from "axios";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

import { getApimRestClient } from "../apim-service";

const emptySubscriptions: SubscriptionCollection = {
  count: 0,
  value: [],
};

export const getSubscriptions = (
  userId: string,
  limit?: number,
  offset?: number,
  serviceIdFilter?: readonly string[] | string,
): TE.TaskEither<Error, SubscriptionCollection> =>
  Array.isArray(serviceIdFilter) && serviceIdFilter.length === 0
    ? TE.right(emptySubscriptions)
    : pipe(
        TE.tryCatch(() => getApimRestClient(), E.toError),
        TE.chainW((apimRestClient) =>
          pipe(
            apimRestClient.getUserSubscriptions(
              userId,
              serviceIdFilter
                ? ApimUtils.apim_filters.subscriptionsByIdsApimFilter(
                    serviceIdFilter,
                  )
                : ApimUtils.apim_filters.subscriptionsExceptManageOneApimFilter(),
              limit,
              offset,
            ),
            TE.orElse((error) =>
              isAxiosError(error) &&
              error.response?.status === HTTP_STATUS_NOT_FOUND
                ? TE.right(emptySubscriptions)
                : TE.left(error),
            ),
          ),
        ),
      );
