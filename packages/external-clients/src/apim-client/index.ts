import {
  ApiManagementClient,
  GroupContract,
  ProductContract,
  Resource,
  SubscriptionContract,
  SubscriptionGetResponse,
  SubscriptionKeysContract,
  SubscriptionListSecretsResponse,
  SubscriptionState,
  UserContract,
  UserCreateParameters,
  UserGetResponse,
} from "@azure/arm-apimanagement";
import { AzureAuthorityHosts, ClientSecretCredential } from "@azure/identity";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import {
  IResponseErrorInternal,
  IResponseErrorNotFound,
  ResponseErrorInternal,
  ResponseErrorNotFound,
} from "@pagopa/ts-commons/lib/responses";
import { EmailString, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/Either";
import { parse } from "fp-ts/lib/Json";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, identity, pipe } from "fp-ts/lib/function";
import * as t from "io-ts";
import { ulid } from "ulid";

import {
  SubscriptionKeyType,
  SubscriptionKeyTypeEnum,
} from "../generated/api/SubscriptionKeyType";
import { subscriptionsExceptManageOneApimFilter } from "./apim-filters";
import { AzureClientSecretCredential } from "./definitions";

export type ApimMappedErrors = IResponseErrorInternal | IResponseErrorNotFound;

export const ApimRestError = t.intersection([
  t.type({
    statusCode: t.number,
  }),
  t.partial({
    code: t.string,
    details: t.unknown,
    name: t.string,
  }),
]);
export type ApimRestError = t.TypeOf<typeof ApimRestError>;

export const SUBSCRIPTION_MANAGE_PREFIX = "MANAGE-";
export const SUBSCRIPTION_MANAGE_GROUP_PREFIX = "MANAGE-GROUP-";

export const mapApimRestError =
  (resource: string) =>
  (apimRestError: ApimRestError): ApimMappedErrors =>
    apimRestError.statusCode === 404
      ? ResponseErrorNotFound("Not found", `${resource} Not found`)
      : ResponseErrorInternal(
          `Internal Error while retrieving ${resource} detail`,
        );

const chainApimMappedError = <T>(
  te: TE.TaskEither<unknown, T>,
): TE.TaskEither<ApimRestError, T> =>
  pipe(
    te,
    TE.orElseW(
      flow(
        JSON.stringify,
        parse,
        E.chainW(ApimRestError.decode),
        E.fold(
          () =>
            TE.left({
              statusCode: 500,
            }),
          TE.left,
        ),
      ),
    ),
  );

export function getApimClient(
  clientSecretCreds: AzureClientSecretCredential,
  subscriptionId: string,
): ApiManagementClient {
  return new ApiManagementClient(
    new ClientSecretCredential(
      clientSecretCreds.AZURE_CLIENT_SECRET_CREDENTIAL_TENANT_ID,
      clientSecretCreds.AZURE_CLIENT_SECRET_CREDENTIAL_CLIENT_ID,
      clientSecretCreds.AZURE_CLIENT_SECRET_CREDENTIAL_SECRET,
      {
        authorityHost: AzureAuthorityHosts.AzurePublicCloud,
      },
    ),
    subscriptionId,
  );
}

export interface ApimService {
  readonly createGroupUser: (
    groupId: NonEmptyString,
    userId: NonEmptyString,
  ) => TE.TaskEither<ApimRestError, UserContract>;
  readonly createOrUpdateUser: (
    user: UserCreateParameters,
    userId?: NonEmptyString,
  ) => TE.TaskEither<ApimRestError, UserContract>;
  /**
   * Deletes a subscription specified by its identifier.
   * @param subscriptionId Subscription entity Identifier
   * @param ifMatch ETag of the Entity. ETag should match the current entity state from the header response of the GET request or it should be * for unconditional update.
   */
  readonly deleteSubscription: (
    subscriptionId: string,
    ifMatch?: string,
  ) => TE.TaskEither<ApimRestError | Error, void>;
  readonly getDelegateFromServiceId: (
    serviceId: NonEmptyString,
  ) => TE.TaskEither<ApimRestError, Delegate>;
  readonly getProductByName: (
    productName: NonEmptyString,
  ) => TE.TaskEither<ApimRestError, O.Option<ProductContract>>;
  readonly getSubscription: (
    subscriptionId: string,
  ) => TE.TaskEither<ApimRestError, SubscriptionGetResponse>;
  readonly getUser: (
    userId: string,
  ) => TE.TaskEither<ApimRestError, UserGetResponse>;
  readonly getUserByEmail: (
    userEmail: EmailString,
    fetchGroups?: boolean,
  ) => TE.TaskEither<ApimRestError, O.Option<UserContract>>;
  readonly getUserGroups: (
    userId: string,
  ) => TE.TaskEither<ApimRestError, readonly GroupContract[]>;
  readonly getUserSubscriptions: (
    userId: string,
    offset?: number,
    limit?: number,
    filter?: string,
  ) => TE.TaskEither<ApimRestError, readonly SubscriptionContract[]>;
  readonly listSecrets: (
    subscriptionId: string,
  ) => TE.TaskEither<ApimRestError, SubscriptionKeysContract>;
  readonly regenerateSubscriptionKey: (
    subscriptionId: string,
    keyType: SubscriptionKeyType,
  ) => TE.TaskEither<ApimRestError, SubscriptionContract>;
  /**
   * Updates the details of a subscription specified by its identifier.
   * @param subscriptionId Subscription entity Identifier
   * @param parameters Update parameters details
   * @param ifMatch ETag of the Entity. ETag should match the current entity state from the header response of the GET request or it should be * for unconditional update.
   * @returns the updated Subscription
   */
  readonly updateSubscription: (
    subscriptionId: string,
    parameters: { displayName: string; state: SubscriptionState },
    ifMatch?: string,
  ) => TE.TaskEither<ApimRestError | Error, SubscriptionContract>;
  readonly upsertSubscription: (
    ownerId: string,
    subscriptionId: string,
    displayName?: string,
  ) => TE.TaskEither<ApimRestError | Error, SubscriptionContract>;
}

export const getApimService = (
  apimClient: ApiManagementClient,
  apimResourceGroup: string,
  apimServiceName: string,
  apimProductName: NonEmptyString,
): ApimService => ({
  createGroupUser: (groupId, userId) =>
    createGroupUser(
      apimClient,
      apimResourceGroup,
      apimServiceName,
      groupId,
      userId,
    ),
  createOrUpdateUser: (user, userId = ulid() as NonEmptyString) =>
    createOrUpdateUser(
      apimClient,
      apimResourceGroup,
      apimServiceName,
      userId,
      user,
    ),
  deleteSubscription: (subscriptionId, ifMatch = "*") =>
    deleteSubscription(
      apimClient,
      apimResourceGroup,
      apimServiceName,
      subscriptionId,
      ifMatch,
    ),
  getDelegateFromServiceId: (serviceId) =>
    getDelegateFromServiceId(
      apimClient,
      apimResourceGroup,
      apimServiceName,
      serviceId,
    ),
  getProductByName: (productName) =>
    getProductByName(
      apimClient,
      apimResourceGroup,
      apimServiceName,
      productName,
    ),
  getSubscription: (subscriptionId) =>
    getSubscription(
      apimClient,
      apimResourceGroup,
      apimServiceName,
      subscriptionId,
    ),
  getUser: (userId) =>
    getUser(apimClient, apimResourceGroup, apimServiceName, userId),
  getUserByEmail: (userEmail, fetchGroups) =>
    getUserByEmail(
      apimClient,
      apimResourceGroup,
      apimServiceName,
      userEmail,
      fetchGroups,
    ),
  getUserGroups: (userId) =>
    getUserGroups(apimClient, apimResourceGroup, apimServiceName, userId),
  getUserSubscriptions: (
    userId,
    offset,
    limit,
    filter = subscriptionsExceptManageOneApimFilter(),
  ) =>
    getUserSubscriptions(
      apimClient,
      apimResourceGroup,
      apimServiceName,
      userId,
      filter,
      offset,
      limit,
    ),
  listSecrets: (subscriptionId) =>
    listSecrets(apimClient, apimResourceGroup, apimServiceName, subscriptionId),
  regenerateSubscriptionKey: (subscriptionId, keyType) =>
    regenerateSubscriptionKey(
      apimClient,
      apimResourceGroup,
      apimServiceName,
      subscriptionId,
      keyType,
    ),
  updateSubscription: (subscriptionId, { displayName, state }, ifMatch = "*") =>
    pipe(
      updateSubscription(
        apimClient,
        apimResourceGroup,
        apimServiceName,
        subscriptionId,
        ifMatch,
        displayName,
        state,
      ),
    ),
  upsertSubscription: (ownerId, subscriptionId, displayName) =>
    pipe(
      getProductByName(
        apimClient,
        apimResourceGroup,
        apimServiceName,
        apimProductName,
      ),
      TE.chainW(
        TE.fromOption(
          () => new Error(`No product found with name '${apimProductName}'`),
        ),
      ),
      TE.chainW(pickId),
      TE.bindTo("productId"),
      TE.bind("userId", () =>
        pipe(
          getUser(apimClient, apimResourceGroup, apimServiceName, ownerId),
          TE.chainW(pickId),
        ),
      ),
      TE.chainW(({ productId, userId }) =>
        upsertSubscription(
          apimClient,
          apimResourceGroup,
          apimServiceName,
          productId,
          userId,
          subscriptionId,
          displayName,
        ),
      ),
    ),
});

const getUser = (
  apimClient: ApiManagementClient,
  apimResourceGroup: string,
  apimServiceName: string,
  userId: string,
): TE.TaskEither<ApimRestError, UserGetResponse> =>
  pipe(
    TE.tryCatch(
      () => apimClient.user.get(apimResourceGroup, apimServiceName, userId),
      identity,
    ),
    chainApimMappedError,
  );

/**
 * Retrieve the APIM user by its email
 *
 * @param apimClient
 * @param apimResourceGroup
 * @param apimServiceName
 * @param userEmail
 * @returns
 */
const getUserByEmail = (
  apimClient: ApiManagementClient,
  apimResourceGroup: string,
  apimServiceName: string,
  userEmail: EmailString,
  fetchGroups?: boolean,
): TE.TaskEither<ApimRestError, O.Option<UserContract>> =>
  pipe(
    apimClient.user.listByService(apimResourceGroup, apimServiceName, {
      expandGroups: fetchGroups,
      filter: `email eq '${userEmail}'`,
    }),
    // the first element does the job
    (userListResponse) =>
      TE.tryCatch(async () => {
        for await (const x of userListResponse) {
          return O.some(x);
        }
        return O.none;
      }, identity),
    chainApimMappedError,
  );

/**
 * Retrieve the APIM user groups by its userId
 *
 * @param apimClient
 * @param apimResourceGroup
 * @param apimServiceName
 * @param userId
 * @returns
 */
const getUserGroups = (
  apimClient: ApiManagementClient,
  apimResourceGroup: string,
  apimServiceName: string,
  userId: string,
): TE.TaskEither<ApimRestError, readonly GroupContract[]> =>
  pipe(
    TE.tryCatch(async () => {
      const groupListResponse = apimClient.userGroup.list(
        apimResourceGroup,
        apimServiceName,
        userId,
      );
      const groupList: GroupContract[] = [];

      for await (const x of groupListResponse) {
        groupList.push(x);
      }
      return groupList;
    }, E.toError),
    chainApimMappedError,
  );

/**
 * Retrieve the APIM subscription by its Id
 *
 * @param apimClient
 * @param apimResourceGroup
 * @param apimServiceName
 * @param subscriptionId
 * @returns
 */
const getSubscription = (
  apimClient: ApiManagementClient,
  apimResourceGroup: string,
  apimServiceName: string,
  subscriptionId: string,
) =>
  pipe(
    TE.tryCatch(
      () =>
        apimClient.subscription.get(
          apimResourceGroup,
          apimServiceName,
          subscriptionId,
        ),
      identity,
    ),
    chainApimMappedError,
  );

/**
 * Retrieve the APIM secrets for a subscription
 *
 * @param apimClient
 * @param apimResourceGroup
 * @param apimServiceName
 * @param subscriptionId
 * @returns
 */
const listSecrets = (
  apimClient: ApiManagementClient,
  apimResourceGroup: string,
  apimServiceName: string,
  subscriptionId: string,
) =>
  pipe(
    TE.tryCatch(
      () =>
        apimClient.subscription.listSecrets(
          apimResourceGroup,
          apimServiceName,
          subscriptionId,
        ),
      identity,
    ),
    chainApimMappedError,
  );

/**
 * Create or updates a subscription for a given user
 *
 * @param apimClient
 * @param apimResourceGroup
 * @param apimServiceName
 * @param productId
 * @param ownerId
 * @param subscriptionId
 * @returns
 */
const upsertSubscription = (
  apimClient: ApiManagementClient,
  apimResourceGroup: string,
  apimServiceName: string,
  productId: string,
  ownerId: string,
  subscriptionId: string,
  displayName?: string,
): TE.TaskEither<ApimRestError, SubscriptionContract> =>
  pipe(
    TE.tryCatch(
      () =>
        apimClient.subscription.createOrUpdate(
          apimResourceGroup,
          apimServiceName,
          subscriptionId,
          {
            displayName: displayName ?? subscriptionId,
            ownerId,
            scope: `/products/${productId}`,
            state: "active",
          },
          {
            ifMatch: "*",
          },
        ),
      identity,
    ),
    chainApimMappedError,
  );

/**
 * Update an existing subscription for a given user
 *
 * @param apimClient
 * @param apimResourceGroup
 * @param apimServiceName
 * @param productId
 * @param ownerId
 * @param subscriptionId
 * @returns
 */
const updateSubscription = (
  apimClient: ApiManagementClient,
  apimResourceGroup: string,
  apimServiceName: string,
  subscriptionId: string,
  ifMatch: string,
  displayName: string,
  state: SubscriptionState,
): TE.TaskEither<ApimRestError, SubscriptionContract> =>
  pipe(
    TE.tryCatch(
      () =>
        apimClient.subscription.update(
          apimResourceGroup,
          apimServiceName,
          subscriptionId,
          ifMatch,
          {
            displayName,
            state,
          },
        ),
      identity,
    ),
    chainApimMappedError,
  );

/**
 * Delete an existing subscription
 *
 * @param apimClient
 * @param apimResourceGroup
 * @param apimServiceName
 * @param subscriptionId
 * @returns
 */
const deleteSubscription = (
  apimClient: ApiManagementClient,
  apimResourceGroup: string,
  apimServiceName: string,
  subscriptionId: string,
  ifMatch: string,
): TE.TaskEither<ApimRestError, void> =>
  pipe(
    TE.tryCatch(
      () =>
        apimClient.subscription.delete(
          apimResourceGroup,
          apimServiceName,
          subscriptionId,
          ifMatch,
        ),
      identity,
    ),
    chainApimMappedError,
  );

/**
 * Get a APIM product by its name
 *
 * @param apimClient
 * @param apimResourceGroup
 * @param apimServiceName
 * @param productName
 * @returns
 */
const getProductByName = (
  apimClient: ApiManagementClient,
  apimResourceGroup: string,
  apimServiceName: string,
  productName: NonEmptyString,
): TE.TaskEither<ApimRestError, O.Option<ProductContract>> =>
  pipe(
    apimClient.product.listByService(apimResourceGroup, apimServiceName, {
      filter: `name eq '${productName}'`,
    }),
    // the first element does the job
    (productListResponse) =>
      TE.tryCatch(async () => {
        for await (const x of productListResponse) {
          return O.some(x);
        }
        return O.none;
      }, identity),
    chainApimMappedError,
  );

/**
 * Lists the collection of subscriptions for the specified `userId`
 *
 * @param apimClient
 * @param resourceGroupName
 * @param serviceName
 * @param userId Api Management User Id
 * @param offset Number of records to skip
 * @param limit Number of records to return
 * @returns
 */
const getUserSubscriptions = (
  apimClient: ApiManagementClient,
  resourceGroupName: string,
  apimServiceName: string,
  userId: string,
  filter: string,
  offset?: number,
  limit?: number,
): TE.TaskEither<ApimRestError, readonly SubscriptionContract[]> =>
  pipe(
    TE.tryCatch(async () => {
      const subscriptionListResponse = apimClient.userSubscription.list(
        resourceGroupName,
        apimServiceName,
        userId,
        {
          filter,
          skip: offset,
          top: limit,
        },
      );

      const subscriptionList: SubscriptionContract[] = [];

      for await (const page of subscriptionListResponse.byPage({
        maxPageSize: limit,
      })) {
        subscriptionList.push(...page);
        if (limit !== undefined || offset !== undefined) {
          /**
           * FIXME: PagedAsyncIterableIterator returns:
           * - first filtered page (what we are filtering)
           * - all pages (starting from first value)
           * For this reason the `break` below is used to get only the first page in case the pagination is required (whether the offset or limit is defined).
           * **NOTE:** with latest `@azure/arm-apimanagement@9.0.0` the `byPage` iterator,
           * seems not to work, so we downgrade package to 8.x.x version.
           */
          break;
        }
      }

      return subscriptionList;
    }, E.toError),
    chainApimMappedError,
  );

/**
 * Regenerates primary or secondary key of an existing subscription
 *
 * @param apimClient
 * @param apimResourceGroup
 * @param apimServiceName
 * @param subscriptionId
 * @param keyType
 * @returns updated subscription
 */
const regenerateSubscriptionKey = (
  apimClient: ApiManagementClient,
  apimResourceGroup: string,
  apimServiceName: string,
  subscriptionId: string,
  keyType: SubscriptionKeyType,
): TE.TaskEither<ApimRestError, SubscriptionListSecretsResponse> =>
  pipe(
    TE.tryCatch(() => {
      switch (keyType) {
        case SubscriptionKeyTypeEnum.primary:
          return apimClient.subscription.regeneratePrimaryKey(
            apimResourceGroup,
            apimServiceName,
            subscriptionId,
          );
        case SubscriptionKeyTypeEnum.secondary:
          return apimClient.subscription.regenerateSecondaryKey(
            apimResourceGroup,
            apimServiceName,
            subscriptionId,
          );
        default:
          // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-case-declarations
          const _: never = keyType;
          throw new Error(`should not have executed this with ${keyType}`);
      }
    }, E.toError),
    TE.chain(() =>
      // retrieve updated subscription
      TE.tryCatch(
        () =>
          apimClient.subscription.listSecrets(
            apimResourceGroup,
            apimServiceName,
            subscriptionId,
          ),
        E.toError,
      ),
    ),
    chainApimMappedError,
  );

const getDelegateFromServiceId = (
  apimClient: ApiManagementClient,
  apimResourceGroup: string,
  apimServiceName: string,
  serviceId: NonEmptyString,
): TE.TaskEither<ApimRestError, Delegate> =>
  pipe(
    getSubscription(apimClient, apimResourceGroup, apimServiceName, serviceId),
    TE.map((subscription) =>
      parseIdFromFullPath(subscription.ownerId as NonEmptyString),
    ),
    TE.chain((ownerId) =>
      getUser(apimClient, apimResourceGroup, apimServiceName, ownerId),
    ),
    TE.chainW((user) =>
      pipe(
        getUserGroups(
          apimClient,
          apimResourceGroup,
          apimServiceName,
          user.name as NonEmptyString,
        ),
        TE.map((userGroups) => ({
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          permissions: userGroups.map((group) => group.name),
        })),
      ),
    ),
  );

/**
 * Create or updates (if not exists) an user
 * @param apimClient
 * @param apimResourceGroup
 * @param apimServiceName
 * @param userId
 * @param user
 * @returns the created user resource **without** groups field
 */
const createOrUpdateUser = (
  apimClient: ApiManagementClient,
  apimResourceGroup: string,
  apimServiceName: string,
  userId: NonEmptyString,
  user: UserCreateParameters,
): TE.TaskEither<ApimRestError, UserContract> =>
  pipe(
    TE.tryCatch(
      () =>
        apimClient.user.createOrUpdate(
          apimResourceGroup,
          apimServiceName,
          userId,
          user,
        ),
      identity,
    ),
    chainApimMappedError,
  );

/**
 * Create a relationship between a group and user
 * @param apimClient
 * @param apimResourceGroup
 * @param apimServiceName
 * @param groupIdId
 * @param userId
 * @returns the user resource **without** groups field
 */
const createGroupUser = (
  apimClient: ApiManagementClient,
  apimResourceGroup: string,
  apimServiceName: string,
  groupIdId: NonEmptyString,
  userId: NonEmptyString,
): TE.TaskEither<ApimRestError, UserContract> =>
  pipe(
    TE.tryCatch(
      () =>
        apimClient.groupUser.create(
          apimResourceGroup,
          apimServiceName,
          groupIdId,
          userId,
        ),
      identity,
    ),
    chainApimMappedError,
  );

/**
 * Parse the ID from a "full path" ID format
 * @param fullPath a full path ID in this kind of format: "/some/kind/of/prefix/id-value"
 * @returns the parsed id value
 */
export const parseIdFromFullPath = (fullPath: NonEmptyString): NonEmptyString =>
  pipe(
    fullPath,
    (f) => f.split("/"),
    (a) => a[a.length - 1] as NonEmptyString,
  );

// TODO: remove when jira-proxy.ts is moved in this package
interface Delegate {
  email?: string;
  firstName?: string;
  lastName?: string;
  permissions: (string | undefined)[];
}

// utility to extract a non-empty id from an object
const pickId = (obj: Resource): TE.TaskEither<Error, NonEmptyString> =>
  pipe(
    obj,
    t.type({ id: NonEmptyString }).decode,
    TE.fromEither,
    TE.mapLeft(
      (err) =>
        new Error(`Cannot decode object to get id, ${readableReport(err)}`),
    ),
    TE.map((_) => _.id),
  );

export * as apim_filters from "./apim-filters";
export * as definitions from "./definitions";
