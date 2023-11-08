import { pipe } from "fp-ts/lib/function";
import { getApimRestClient } from "../apim-service";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { isAxiosError } from "axios";
import { SubscriptionCollection } from "@azure/arm-apimanagement";
import { HTTP_STATUS_NOT_FOUND } from "@/config/constants";

export const getServiceList = (
  userId: string,
  limit: number,
  offset: number,
  serviceId?: string
): TE.TaskEither<Error, SubscriptionCollection> =>
  pipe(
    TE.tryCatch(() => getApimRestClient(), E.toError),
    TE.chainW(apimRestClient =>
      pipe(
        apimRestClient.getServiceList(userId, limit, offset, serviceId),
        TE.orElse(error => {
          if (
            isAxiosError(error) &&
            error.response?.status === HTTP_STATUS_NOT_FOUND
          ) {
            return TE.right({
              value: [],
              count: 0
            });
          }
          return TE.left(error);
        })
      )
    )
  );
