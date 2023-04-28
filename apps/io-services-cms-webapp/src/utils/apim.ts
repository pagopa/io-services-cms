import { ApiManagementClient } from "@azure/arm-apimanagement";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";
import {
  ApimRestError,
  getSubscription,
  getUser,
  getUserGroups,
  parseOwnerIdFullPath,
} from "../apim_client";
import { Delegate } from "./service_review_proxy";

export const getDelegateFromServiceId = (
  apimClient: ApiManagementClient,
  apimResourceGroup: string,
  apim: string,
  serviceId: NonEmptyString
): TE.TaskEither<ApimRestError, Delegate> =>
  pipe(
    getSubscription(apimClient, apimResourceGroup, apim, serviceId),
    TE.chain((subscription) =>
      pipe(
        parseOwnerIdFullPath(subscription.ownerId as NonEmptyString),
        (ownerId) => getUser(apimClient, apimResourceGroup, apim, ownerId),
        TE.chainW((user) =>
          pipe(
            getUserGroups(
              apimClient,
              apimResourceGroup,
              apim,
              user.name as NonEmptyString
            ),
            TE.map(
              (userGroups) =>
                ({
                  name: `${user.firstName} ${user.lastName}`,
                  email: user.email,
                  permissions: userGroups.map((group) => group.name),
                } as Delegate)
            )
          )
        )
      )
    )
  );
