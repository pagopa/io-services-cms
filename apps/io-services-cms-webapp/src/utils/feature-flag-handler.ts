// Handle Feature Flags
import { ApimUtils } from "@io-services-cms/external-clients";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { IConfig } from "../config";

const wildcard = "*" as NonEmptyString;

const allAllowed = (inclusionList: ReadonlyArray<NonEmptyString>) =>
  isElementAllowedOnList(inclusionList)(wildcard);

// Return True if the element is in the list or if the list contains the wildcard
const isElementAllowedOnList =
  (list: ReadonlyArray<NonEmptyString>) => (element: NonEmptyString) =>
    list.includes(wildcard) || list.includes(element);

const isServiceOwnerIncludedInList = (
  apimService: ApimUtils.ApimService,
  serviceId: NonEmptyString,
  inclusionList: ReadonlyArray<NonEmptyString>
): TE.TaskEither<Error, boolean> => {
  if (allAllowed(inclusionList)) {
    return TE.right(true);
  }

  if (inclusionList.length === 0) {
    return TE.right(false);
  }

  return pipe(
    apimService.getSubscription(serviceId),
    TE.mapLeft(
      ({ statusCode }) =>
        new Error(
          `An error has occurred while retrieving service '${serviceId}', statusCode : ${statusCode}`
        )
    ),
    TE.map(({ ownerId }) =>
      pipe(
        ownerId as NonEmptyString,
        ApimUtils.parseOwnerIdFullPath,
        isElementAllowedOnList(inclusionList)
      )
    )
  );
};

/**
 *
 * @param config
 * @param apimService
 * @param serviceId
 * @returns
 */
export const isUserEnabledForCmsToLegacySync = (
  config: IConfig,
  apimService: ApimUtils.ApimService,
  serviceId: NonEmptyString
): TE.TaskEither<Error, boolean> =>
  isServiceOwnerIncludedInList(
    apimService,
    serviceId,
    config.USERID_CMS_TO_LEGACY_SYNC_INCLUSION_LIST
  );

/**
 *
 * @param config
 * @param apimService
 * @param serviceId
 * @returns
 */
export const isUserEnabledForLegacyToCmsSync = (
  config: IConfig,
  apimService: ApimUtils.ApimService,
  serviceId: NonEmptyString
): TE.TaskEither<Error, boolean> =>
  isServiceOwnerIncludedInList(
    apimService,
    serviceId,
    config.USERID_LEGACY_TO_CMS_SYNC_INCLUSION_LIST
  );

/**
 *
 * @param config
 * @param apimService
 * @param serviceId
 * @returns
 */
export const isUserAllowedForAutomaticApproval = (
  config: IConfig,
  apimService: ApimUtils.ApimService,
  serviceId: NonEmptyString
): TE.TaskEither<Error, boolean> =>
  isServiceOwnerIncludedInList(
    apimService,
    serviceId,
    config.USERID_AUTOMATIC_SERVICE_APPROVAL_INCLUSION_LIST
  );

/**
 *
 * @param config
 * @param serviceId
 * @returns
 */
export const isServiceAllowedForQualitySkip = (
  config: IConfig,
  serviceId: NonEmptyString
  // eslint-disable-next-line sonarjs/no-identical-functions
): boolean =>
  pipe(
    serviceId,
    isElementAllowedOnList(config.SERVICEID_QUALITY_CHECK_EXCLUSION_LIST)
  );

/**
 *
 * @param config
 * @param serviceId
 * @returns
 */
export const isUserEnabledForRequestReviewLegacy = (
  config: IConfig,
  apimUserId: NonEmptyString
): boolean =>
  pipe(
    apimUserId,
    ApimUtils.parseOwnerIdFullPath,
    isElementAllowedOnList(config.USERID_REQUEST_REVIEW_LEGACY_INCLUSION_LIST)
  );
