import { Cidr } from "@/generated/api/Cidr";
import { Group } from "@/generated/api/Group";
import { StateEnum, Subscription } from "@/generated/api/Subscription";
import { SubscriptionKeyType } from "@/generated/api/SubscriptionKeyType";
import { SubscriptionKeys } from "@/generated/api/SubscriptionKeys";
import {
  SubscriptionType,
  SubscriptionTypeEnum,
} from "@/generated/api/SubscriptionType";
import { getApimService, upsertSubscription } from "@/lib/be/apim-service";
import { SubscriptionState } from "@azure/arm-apimanagement";
import { ApimUtils } from "@io-services-cms/external-clients";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import archiver from "archiver";
import archiverZipEncrypted from "archiver-zip-encrypted";
import { randomBytes } from "crypto";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";

import { AggregatedInstitutionsManageKeysExportFileStateEnum } from "@/generated/api/AggregatedInstitutionsManageKeysExportFileState";
import { ApiKeysExportsAdapter } from "../api-keys-exports-adapter";
import {
  ManagedInternalError,
  PreconditionFailedError,
  SubscriptionOwnershipError,
  apimErrorToManagedInternalError,
} from "../errors";
import {
  getInstitutionDelegations,
  getInstitutionGroups,
} from "../institutions/selfcare";
import { listSubscriptionSecrets, regenerateSubscriptionKey } from "./apim";
import {
  getSubscriptionAuthorizedCIDRs,
  upsertSubscriptionAuthorizedCIDRs,
} from "./cosmos";

// Register zip-encrypted format with archiver (once per process)
try {
  archiver.registerFormat("zip-encrypted", archiverZipEncrypted);
} catch {
  // Format already registered
}

// Type utility to extract the right side of a TaskEither
type RightType<T> = T extends TE.TaskEither<unknown, infer R> ? R : never; // TODO: move to an Utils monorepo package

const parseState = (state: SubscriptionState): StateEnum => {
  switch (state) {
    case "active":
      return StateEnum.active;
    case "cancelled":
      return StateEnum.cancelled;
    case "expired":
      return StateEnum.expired;
    case "rejected":
      return StateEnum.rejected;
    case "submitted":
      return StateEnum.submitted;
    case "suspended":
      return StateEnum.suspended;
    default:
      // eslint-disable-next-line no-case-declarations
      const _: never = state;
      throw new Error(`Invalid state: ${state}`);
  }
};

const toSubscription = (
  subscription: RightType<ReturnType<typeof upsertSubscription>>,
) => {
  if (!subscription.name) {
    throw new ManagedInternalError(
      "Partial data received",
      "Subscription 'name' is not defined",
    );
  }
  if (!subscription.state) {
    throw new ManagedInternalError(
      "Partial data received",
      "Subscription 'state' is not defined",
    );
  }
  if (!subscription.displayName) {
    throw new ManagedInternalError(
      "Partial data received",
      "Subscription 'displayName' is not defined",
    );
  }
  return {
    id: subscription.name,
    name: subscription.displayName,
    state: parseState(subscription.state),
  };
};

/**
 * Validates that the subscription belongs to the user with the given apimUserId by fetching the subscription from APIM and checking its ownerId
 * @param subscriptionId the id of the subscription to validate
 * @param apimUserId the id of the user to check the subscription ownership for
 * @throws `SubscriptionOwnershipError` if the subscription doesn't belong to the user
 * @throws `ManagedInternalError` if an error occurs while retrieving the subscription from APIM
 */
const validateSubscriptionOwnership = async (
  subscriptionId: string,
  apimUserId: string,
): Promise<void> => {
  const filter =
    ApimUtils.apim_filters.subscriptionsByIdsApimFilter(subscriptionId);
  const maybeSubscription = await getApimService().getUserSubscriptions(
    apimUserId,
    undefined,
    undefined,
    filter,
  )();
  if (E.isLeft(maybeSubscription)) {
    throw apimErrorToManagedInternalError(
      "Error retrieving user's subscriptions",
      maybeSubscription.left,
    );
  }
  if (maybeSubscription.right.length === 0) {
    throw new SubscriptionOwnershipError(
      "The user doesn't own the subscription",
    );
  }
};

/**
 * Creates or updates a manage subscription for a given user.
 * @param ownerId The id of the user who will own the subscription
 * @param group The group information for the subscription (only for GROUP subscriptions)
 * @returns The created or updated subscription
 * @throws `ManagedInternalError` if an error occurs while processing the subscription data
 */
export async function upsertManageSubscription(
  ownerId: string,
  group?: { id: string; name: string },
): Promise<Subscription> {
  const maybeSubscription = await (
    group
      ? upsertSubscription("MANAGE_GROUP", ownerId, group)
      : upsertSubscription("MANAGE", ownerId)
  )();

  if (E.isLeft(maybeSubscription)) {
    if ("statusCode" in maybeSubscription.left) {
      if (maybeSubscription.left.statusCode === 412) {
        throw new PreconditionFailedError(
          maybeSubscription.left.name ?? "Precondition Failed",
          maybeSubscription.left.details ?? "",
        );
      }
      throw apimErrorToManagedInternalError(
        "Error creating subscription",
        maybeSubscription.left,
      );
    } else {
      throw new ManagedInternalError(
        "Error creating subscription",
        maybeSubscription.left.message,
      );
    }
  }

  return toSubscription(maybeSubscription.right);
}

/**
 * Retrieves the manage subscriptions for a given user.
 * @param subscriptionType The type of subscription to retrieve (ROOT or GROUP)
 * @param apimUserId The id of the user to check the subscription ownership for
 * @param limit The maximum number of subscriptions to retrieve
 * @param offset The number of subscriptions to skip
 * @param selcGroups The groups to filter the subscriptions by (only for GROUP subscriptions)
 * @returns The list of manage subscriptions for the user
 */
export async function getManageSubscriptions(
  subscriptionType: SubscriptionType,
  apimUserId: string,
  limit?: number,
  offset?: number,
  selcGroups?: Group[],
): Promise<Subscription[]> {
  let filter;
  switch (subscriptionType) {
    case SubscriptionTypeEnum.MANAGE_ROOT:
      if (selcGroups && selcGroups.length > 0) {
        // Non-admin users who have at least one group are not allowed to retrieve "ROOT MANAGE" subscription
        return Promise.resolve([]);
      }
      filter = ApimUtils.apim_filters.manageRootSubscriptionsFilter(apimUserId);
      break;
    case SubscriptionTypeEnum.MANAGE_GROUP:
      filter = ApimUtils.apim_filters.manageGroupSubscriptionsFilter(
        selcGroups?.map((group) => group.id),
      );
      break;
    default:
      // eslint-disable-next-line no-case-declarations
      const _: never = subscriptionType;
      throw new Error(`Invalid subscriptionType: '${subscriptionType}'`);
  }
  const maybeSubscriptions = await getApimService().getUserSubscriptions(
    apimUserId,
    offset,
    limit,
    filter,
  )();

  if (E.isLeft(maybeSubscriptions)) {
    throw apimErrorToManagedInternalError(
      "Error retrieving manage group subscriptions",
      maybeSubscriptions.left,
    );
  }

  return maybeSubscriptions.right.map(toSubscription);
}

/**
 * Deletes a subscription for a given user.
 * @param apimUserId The id of the user to check the subscription ownership for
 * @param subscriptionId The id of the subscription to delete
 * @throws see {@linkcode validateSubscriptionOwnership} for possible errors related to subscription ownership validation
 * @throws `ManagedInternalError` if an error occurs while deleting the subscription in APIM
 */
export async function deleteManageSubscription(
  apimUserId: string,
  subscriptionId: string,
): Promise<void> {
  await validateSubscriptionOwnership(subscriptionId, apimUserId);
  const deletionResult =
    await getApimService().deleteSubscription(subscriptionId)();
  if (E.isLeft(deletionResult)) {
    const errorMessage = "Error deleting subscription";
    if ("statusCode" in deletionResult.left) {
      throw apimErrorToManagedInternalError(errorMessage, deletionResult.left);
    } else {
      throw new ManagedInternalError(errorMessage, deletionResult.left.message);
    }
  }
}

/******************
 * KEYS MANAGEMENT
 ******************/

/**
 * Retrieves the API keys for a given subscription.
 * @param apimUserId The id of the user to check the subscription ownership for
 * @param subscriptionId The id of the subscription to retrieve the keys for
 * @returns The API keys for the subscription
 * @throws see {@linkcode validateSubscriptionOwnership} for possible errors related to subscription ownership validation
 * @throws see {@linkcode listSubscriptionSecrets} for possible errors related to retrieving the keys from the database
 */
export async function retrieveManageSubscriptionApiKeys(
  apimUserId: string,
  subscriptionId: string,
) {
  await validateSubscriptionOwnership(subscriptionId, apimUserId);
  const subscriptionApiKeys = await listSubscriptionSecrets(subscriptionId);
  return {
    primary_key: subscriptionApiKeys.primaryKey,
    secondary_key: subscriptionApiKeys.secondaryKey,
  };
}

/**
 * Regenerates the API key for a given subscription.
 * @param apimUserId The id of the user to check the subscription ownership for
 * @param subscriptionId The id of the subscription to regenerate the key for
 * @param keyType The type of key to regenerate (primary or secondary)
 * @returns The updated API keys
 * @throws see {@linkcode validateSubscriptionOwnership} for possible errors related to subscription ownership validation
 * @throws see {@linkcode regenerateSubscriptionKey} for possible errors related to regenerating the key in the database
 */
export async function regenerateManageSubscriptionApiKey(
  apimUserId: string,
  subscriptionId: string,
  keyType: SubscriptionKeyType,
) {
  await validateSubscriptionOwnership(subscriptionId, apimUserId);

  const subscriptionApiKeys = await regenerateSubscriptionKey(
    subscriptionId,
    keyType,
  );

  return {
    primary_key: subscriptionApiKeys.primaryKey,
    secondary_key: subscriptionApiKeys.secondaryKey,
  };
}

/**
 * Retrieves the authorized CIDRs for the given subscription.
 * @param apimUserId The id of the user to check the subscription ownership for
 * @param subscriptionId The id of the subscription to retrieve the CIDRs for
 * @returns The list of authorized CIDRs
 * @throws see {@linkcode validateSubscriptionOwnership} for possible errors related to subscription ownership validation
 * @throws see {@linkcode getSubscriptionAuthorizedCIDRs} for possible errors related to retrieving the CIDRs from the database
 */
export async function retrieveManageSubscriptionAuthorizedCIDRs(
  apimUserId: string,
  subscriptionId: string,
) {
  await validateSubscriptionOwnership(subscriptionId, apimUserId);

  const authorizedCIDRsResponse =
    await getSubscriptionAuthorizedCIDRs(subscriptionId);

  if (O.isNone(authorizedCIDRsResponse)) {
    return new Array<Cidr>();
  }

  return Array.from(authorizedCIDRsResponse.value.cidrs);
}

/**
 * Upserts the authorized CIDRs for the given subscription. If the subscription doesn't have authorized CIDRs, they will be created, otherwise they will be updated.
 * @param apimUserId The id of the user to check the subscription ownership for
 * @param subscriptionId The id of the subscription to update
 * @param cidrs The CIDRs to upsert
 * @returns The updated list of CIDRs
 * @throws see {@linkcode validateSubscriptionOwnership} for possible errors related to subscription ownership validation
 * @throws see {@linkcode upsertSubscriptionAuthorizedCIDRs} for possible errors related to upserting the CIDRs in the database
 */
export async function upsertManageSubscriptionAuthorizedCIDRs(
  apimUserId: string,
  subscriptionId: string,
  cidrs: readonly Cidr[],
) {
  await validateSubscriptionOwnership(subscriptionId, apimUserId);

  const authorizedCIDRsResponse = await upsertSubscriptionAuthorizedCIDRs(
    subscriptionId,
    cidrs,
  );

  return Array.from(authorizedCIDRsResponse.cidrs);
}

/**
 * Retrieves the subscription keys for the manage-group subscription of a given institution aggregate related to a specific aggregator.
 * @param aggregateId The id of the aggregate
 * @param aggregatorId The id of the aggregator
 * @returns The subscription keys for the manage subscription
 */
export const retrieveInstitutionAggregateManageSubscriptionsKeys = async (
  aggregateId: string,
  aggregatorId: string,
): Promise<SubscriptionKeys> => {
  const subscriptionId =
    await retrieveInstitutionAggregateInstitutionAggregatorSubscriptionId(
      aggregateId,
      aggregatorId,
    );
  const { primaryKey, secondaryKey } =
    await listSubscriptionSecrets(subscriptionId);

  if (!primaryKey || !secondaryKey) {
    throw new ManagedInternalError(
      "Data inconsistency",
      `Missing subscription keys for manage-group subscription '${subscriptionId}'`,
    );
  }

  return {
    primary_key: primaryKey,
    secondary_key: secondaryKey,
  };
};

/**
 * Regenerates the API keys for the manage-group subscription of a given institution aggregate related to a specific aggregator.
 * @param aggregateId The id of the aggregate
 * @param aggregatorInstitutionId The id of the aggregator's institution
 * @param keyType The type of key to regenerate (primary or secondary)
 * @returns The updated API keys
 * @throws see {@linkcode retrieveInstitutionAggregateInstitutionAggregatorSubscriptionId} for possible errors related to retrieving the subscription id for the given aggregate and aggregator
 * @throws see {@linkcode validateSubscriptionOwnership} for possible errors related to subscription ownership validation
 * @throws see {@linkcode regenerateSubscriptionKey} for possible errors related to regenerating the key in the database
 * @throws `ManagedInternalError` if the subscription keys are not returned after regeneration
 */
export const regenerateInstitutionAggregateManageSubscriptionApiKeyByAggregator =
  async (
    aggregateId: string,
    aggregatorInstitutionId: string,
    keyType: SubscriptionKeyType,
  ): Promise<SubscriptionKeys> => {
    const subscriptionId =
      await retrieveInstitutionAggregateInstitutionAggregatorSubscriptionId(
        aggregateId,
        aggregatorInstitutionId,
      );

    const aggregateEmail = ApimUtils.formatEmailForOrganization(aggregateId);

    const maybeAggregateApimUserOrError =
      await getApimService().getUserByEmail(aggregateEmail)();

    if (E.isLeft(maybeAggregateApimUserOrError)) {
      throw apimErrorToManagedInternalError(
        "Error retrieving APIM user for the aggregate",
        maybeAggregateApimUserOrError.left,
      );
    }

    const maybeAggregateApimUser = maybeAggregateApimUserOrError.right;
    if (O.isNone(maybeAggregateApimUser)) {
      throw new ManagedInternalError(
        "Data inconsistency",
        `No APIM user found for aggregate '${aggregateId}' with email '${aggregateEmail}'`,
      );
    }

    const aggregateApimUserFullPathId = maybeAggregateApimUser.value.id;

    if (!aggregateApimUserFullPathId) {
      throw new ManagedInternalError(
        "Data inconsistency",
        `APIM user for aggregate '${aggregateId}' does not have an id`,
      );
    }

    const aggregateApimUserId = ApimUtils.parseIdFromFullPath(
      aggregateApimUserFullPathId as NonEmptyString,
    );

    const { primary_key: primaryKey, secondary_key: secondaryKey } =
      await regenerateManageSubscriptionApiKey(
        aggregateApimUserId,
        subscriptionId,
        keyType,
      );

    if (!primaryKey || !secondaryKey) {
      throw new ManagedInternalError(
        "Data inconsistency",
        `Missing subscription keys for manage-group subscription '${subscriptionId}'`,
      );
    }

    return {
      primary_key: primaryKey,
      secondary_key: secondaryKey,
    };
  };

/**
 * Retrieves the subscription id of the ApiKey Manage Group related to a given institution aggregate and aggregator.
 * @param aggregateId The id of the aggregate
 * @param aggregatorId The id of the aggregator
 * @returns The subscription id of the ApiKey Manage Group
 * @throws `ManagedInternalError` if there are no groups or more than one group related to the aggregate and the aggregator which is an indication of data inconsistency
 */
const retrieveInstitutionAggregateInstitutionAggregatorSubscriptionId = async (
  aggregateId: string,
  aggregatorId: string,
): Promise<string> => {
  const aggregatorGroups = await getInstitutionGroups({
    institutionId: aggregateId,
    parentInstitutionId: aggregatorId,
  });

  // Data inconsistency: if there are no groups or more than one group related to the aggregate and the aggregator, we cannot determine the subscription to retrieve the keys for
  if (aggregatorGroups.totalElements !== 1) {
    throw new ManagedInternalError(
      "Data inconsistency",
      `${aggregatorGroups.totalElements === 0 ? "No" : "Multiple"} groups exist for aggregate '${aggregateId}' related to aggregator '${aggregatorId}'`,
    );
  }
  const subscriptionId =
    ApimUtils.SUBSCRIPTION_MANAGE_GROUP_PREFIX + aggregatorGroups.content[0].id;

  return subscriptionId;
};

/**
 * Generates API keys exports for a given institution and user.
 * @param aggregatorId The institution id of the aggregator
 * @param userId The id of the user
 * @param password The password to use for the export
 * @returns A promise that resolves when the export is complete
 * @throws `PreconditionFailedError` if there is already an export in progress
 * @throws `ManagedInternalError` if there is an error during the export generation
 */
export async function generateApiKeysExports(
  aggregatorId: string,
  userId: string,
  password: string,
): Promise<void> {
  const apiKeysExportsAdapter = ApiKeysExportsAdapter.getInstance(process.env);
  const exportsFiles = await apiKeysExportsAdapter.findExportsFiles(
    aggregatorId,
    userId,
    AggregatedInstitutionsManageKeysExportFileStateEnum.IN_PROGRESS,
  );
  if (exportsFiles.length > 0) {
    throw new PreconditionFailedError(
      "An export file is already being generated",
      `There are ${exportsFiles.length} export files in state 'IN_PROGRESS' for institution '${aggregatorId}' and user '${userId}'`,
    );
  }

  const fileName = randomBytes(16).toString("hex") + ".zip"; // generate a random string to be used as file name for the export file to avoid conflicts in case of multiple export generation requests

  await apiKeysExportsAdapter.initializeFile(fileName, aggregatorId, userId);

  generateApiKeysExportsInner(aggregatorId, userId, password, fileName).catch(
    (error) => {
      // In case of error, we mark the export file as failed to allow the user to retry the export
      apiKeysExportsAdapter
        .markFileAsFailed(fileName, aggregatorId, userId)
        .catch((markFileAsFailedError) => {
          console.error(
            `Error marking export file '${fileName}' as failed after an error occurred during the export generation:`,
            markFileAsFailedError,
          );
        });
      console.error(
        `Error generating API keys export file '${fileName}' :`,
        error,
      );
    },
  );

  return Promise.resolve();
}

async function generateApiKeysExportsInner(
  aggregatorId: string,
  userId: string,
  password: string,
  fileName: string,
): Promise<void> {
  const { aggregateMap, groupsCounter } =
    await retrieveAggregatorGroups(aggregatorId);

  const { aggregatesCounter, enrichedAggregateData } = await retrieveAggregates(
    aggregatorId,
    aggregateMap,
  );

  if (aggregatesCounter !== groupsCounter) {
    throw new ManagedInternalError(
      "Data inconsistency",
      `The number of aggregates related to the aggregator '${aggregatorId}' is different from the number of groups related to the aggregator. Groups count: ${groupsCounter}, Aggregates count: ${aggregatesCounter}`,
    );
  }

  const enrichedAggregateDataWithKeys = [];
  for (const aggregate of enrichedAggregateData) {
    const subscriptionManageGroupId = `${ApimUtils.SUBSCRIPTION_MANAGE_GROUP_PREFIX}${aggregate.groupId}`;
    const { primaryKey, secondaryKey } = await listSubscriptionSecrets(
      subscriptionManageGroupId,
    );

    if (!primaryKey || !secondaryKey) {
      throw new ManagedInternalError(
        "Data inconsistency",
        `Missing subscription keys for manage-group subscription '${subscriptionManageGroupId}' related to aggregate '${aggregate.aggregateId}' and group '${aggregate.groupId}'`,
      );
    }

    enrichedAggregateDataWithKeys.push({
      fc: aggregate.aggregateFiscalCode,
      pk: primaryKey,
      sk: secondaryKey,
    });
  }

  const archive = archiver.create(
    "zip-encrypted" as archiver.Format,
    {
      encryptionMethod: "aes256",
      password,
      zlib: { level: 8 },
    } as archiver.ArchiverOptions,
  );

  try {
    archive
      .append(JSON.stringify(enrichedAggregateDataWithKeys), {
        name: "api-keys.json",
      })
      .finalize();
  } catch (error) {
    throw new ManagedInternalError(
      "Error creating export archive",
      error instanceof Error ? error.message : error,
    );
  }

  try {
    const apiKeysExportsAdapter = ApiKeysExportsAdapter.getInstance(
      process.env,
    );
    await apiKeysExportsAdapter.finalizeFile(
      aggregatorId,
      userId,
      fileName,
      archive,
      "application/zip",
    );
  } catch (error) {
    throw error instanceof ManagedInternalError
      ? error
      : new ManagedInternalError(
          "Error uploading export file",
          error instanceof Error ? error.message : error,
        );
  }
}

async function retrieveAggregatorGroups(aggregatorId: string): Promise<{
  aggregateMap: Map<string, string>;
  groupsCounter: number;
}> {
  let page = 0;
  let groupsCounter = 0;
  const aggregateToGroupMap = new Map<string, string>();
  while (true) {
    const aggregatorGroups = await getInstitutionGroups({
      page: page++,
      parentInstitutionId: aggregatorId,
      size: 2000,
    });
    aggregatorGroups.content.forEach((group) => {
      aggregateToGroupMap.set(group.institutionId, group.id);
    });
    groupsCounter += aggregatorGroups.content.length;

    if (page >= aggregatorGroups.totalPages) {
      break;
    }
  }
  return {
    aggregateMap: aggregateToGroupMap,
    groupsCounter: groupsCounter,
  };
}

async function retrieveAggregates(
  aggregatorId: string,
  aggregateToGroupMap: Map<string, string>,
): Promise<{
  aggregatesCounter: number;
  enrichedAggregateData: {
    aggregateFiscalCode: string;
    aggregateId: string;
    groupId: string;
  }[];
}> {
  let aggregatesCounter = 0;
  const enrichedAggregateData: {
    aggregateFiscalCode: string;
    aggregateId: string;
    groupId: string;
  }[] = [];
  let page = 0;
  while (true) {
    const aggregates = await getInstitutionDelegations(
      aggregatorId,
      10000,
      page++,
    ); // we need to retrieve all delegations to make sure that the groups related to the aggregates are included in the export, otherwise we might end up with aggregates without groups in the export file which is an indication of data inconsistency that we want to avoid

    aggregates.delegations.forEach((delegation) => {
      const groupId = aggregateToGroupMap.get(delegation.institutionId);
      if (!groupId) {
        throw new ManagedInternalError(
          "Data inconsistency",
          `No group found for aggregate with institution id '${delegation.institutionId}'`,
        );
      }
      if (!delegation.taxCode) {
        throw new ManagedInternalError(
          "Data inconsistency",
          `Missing tax code for delegation with institution id '${delegation.institutionId}'`,
        );
      }
      enrichedAggregateData.push({
        aggregateFiscalCode: delegation.taxCode,
        aggregateId: delegation.institutionId,
        groupId: groupId,
      });
    });
    aggregatesCounter += aggregates.delegations.length;
    if (page >= aggregates.pageInfo.totalPages) {
      break;
    }
  }

  return { aggregatesCounter, enrichedAggregateData };
}
