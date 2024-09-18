import { HTTP_STATUS_NOT_FOUND } from "@/config/constants";
import { SubscriptionCollection } from "@azure/arm-apimanagement";
import { isAxiosError } from "axios";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

import { getApimRestClient } from "../apim-service";

export const getServiceList = (
  userId: string,
  limit: number,
  offset: number,
  serviceId?: string,
): TE.TaskEither<Error, SubscriptionCollection> =>
  pipe(
    TE.tryCatch(() => getApimRestClient(), E.toError),
    TE.chainW((apimRestClient) =>
      pipe(
        apimRestClient.getServiceList(userId, limit, offset, serviceId),
        TE.orElse((error) => {
          if (
            isAxiosError(error) &&
            error.response?.status === HTTP_STATUS_NOT_FOUND
          ) {
            return TE.right({
              count: 0,
              value: [],
            });
          }
          return TE.left(error);
        }),
      ),
    ),
  );
