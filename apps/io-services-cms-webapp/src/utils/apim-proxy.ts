import { ApiManagementClient } from "@azure/arm-apimanagement";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import {
  ApimRestError,
  getSubscription,
  getUser,
  getUserGroups,
  parseOwnerIdFullPath,
} from "../lib/clients/apim-client";
import { Delegate } from "./jira-proxy";

/**
 * Service review specific wrapper utility
 *
 * Apim client is used to retrieve information about subscription's owner
 *
 * @param apimClient
 * @param apimResourceGroup
 * @param apim
 * @returns instance of `apimProxy`
 */
export const apimProxy = (
  apimClient: ApiManagementClient,
  apimResourceGroup: string,
  apim: string
) => ({
  /**
   * Retrieve service delegate _(owner of the subscription to which the service refers)_
   * @param serviceId
   * @returns delegate information _(name, email, authorizations)_ for specified service id
   */
  getDelegateFromServiceId: (
    serviceId: NonEmptyString
  ): TE.TaskEither<ApimRestError, Delegate> =>
    pipe(
      getSubscription(apimClient, apimResourceGroup, apim, serviceId),
      TE.map((subscription) =>
        parseOwnerIdFullPath(subscription.ownerId as NonEmptyString)
      ),
      TE.chain((ownerId) =>
        getUser(apimClient, apimResourceGroup, apim, ownerId)
      ),
      TE.chainW((user) =>
        pipe(
          getUserGroups(
            apimClient,
            apimResourceGroup,
            apim,
            user.name as NonEmptyString
          ),
          TE.map((userGroups) => ({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            permissions: userGroups.map((group) => group.name),
          }))
        )
      )
    ),
});

export type ApimProxy = ReturnType<typeof apimProxy>;
