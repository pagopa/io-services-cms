// Handle Feature Flags
import { ApiManagementClient } from "@azure/arm-apimanagement";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { IConfig } from "../config";
import {
  getSubscription,
  parseOwnerIdFullPath,
} from "../lib/clients/apim-client";

const wildcard = "*" as NonEmptyString;

// Return True if the element is in the list or if the list contains the wildcard
const isElementAllowedOnList =
  (list: ReadonlyArray<NonEmptyString>) => (element: NonEmptyString) =>
    list.includes(wildcard) || list.includes(element);

const isUserEnabledToSync = (
  config: IConfig,
  apimClient: ApiManagementClient,
  serviceId: NonEmptyString,
  inclusionList: ReadonlyArray<NonEmptyString>
): TE.TaskEither<Error, boolean> =>
  pipe(
    getSubscription(
      apimClient,
      config.AZURE_APIM_RESOURCE_GROUP,
      config.AZURE_APIM,
      serviceId
    ),
    TE.mapLeft(
      (_) =>
        new Error(
          `An error has occurred while retrieving service '${serviceId}'`
        )
    ),
    TE.map(({ ownerId }) =>
      pipe(
        ownerId as NonEmptyString,
        parseOwnerIdFullPath,
        isElementAllowedOnList(inclusionList)
      )
    )
  );

/**
 *
 * @param config
 * @param apimClient
 * @param serviceId
 * @returns
 */
export const isUserEnabledForCmsToLegacySync = (
  config: IConfig,
  apimClient: ApiManagementClient,
  serviceId: NonEmptyString
): TE.TaskEither<Error, boolean> =>
  isUserEnabledToSync(
    config,
    apimClient,
    serviceId,
    config.USERID_CMS_TO_LEGACY_SYNC_INCLUSION_LIST
  );

/**
 *
 * @param config
 * @param apimClient
 * @param serviceId
 * @returns
 */
export const isUserEnabledForLegacyToCmsSync = (
  config: IConfig,
  apimClient: ApiManagementClient,
  serviceId: NonEmptyString
): TE.TaskEither<Error, boolean> =>
  isUserEnabledToSync(
    config,
    apimClient,
    serviceId,
    config.USERID_LEGACY_TO_CMS_SYNC_INCLUSION_LIST
  );
