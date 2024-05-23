import {
  ApiManagementClient,
  GroupContract,
  ProductContract,
  SubscriptionContract,
  SubscriptionListSecretsResponse,
  UserContract,
  UserCreateParameters,
  UserGetResponse,
} from "@azure/arm-apimanagement";
import { AzureAuthorityHosts, ClientSecretCredential } from "@azure/identity";
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

import {
  FilterCompositionEnum,
  FilterFieldEnum,
  FilterSupportedFunctionsEnum,
  buildApimFilter,
} from "./apim-filters";
import {
  AzureClientSecretCredential,
  MANAGE_APIKEY_PREFIX,
} from "./definitions";

export type ApimMappedErrors = IResponseErrorInternal | IResponseErrorNotFound;

export const ApimRestError = t.intersection([
  t.type({
    statusCode: t.number,
  }),
  t.partial({
    name: t.string,
    code: t.string,
    details: t.string,
  }),
]);
export type ApimRestError = t.TypeOf<typeof ApimRestError>;

export const mapApimRestError =
  (resource: string) =>
  (apimRestError: ApimRestError): ApimMappedErrors =>
    apimRestError.statusCode === 404
      ? ResponseErrorNotFound("Not found", `${resource} Not found`)
      : ResponseErrorInternal(
          `Internal Error while retrieving ${resource} detail`
        );

const chainApimMappedError = <T>(
  te: TE.TaskEither<unknown, T>
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
          TE.left
        )
      )
    )
  );

export function getApimClient(
  clientSecretCreds: AzureClientSecretCredential,
  subscriptionId: string
): ApiManagementClient {
  return new ApiManagementClient(
    new ClientSecretCredential(
      clientSecretCreds.AZURE_CLIENT_SECRET_CREDENTIAL_TENANT_ID,
      clientSecretCreds.AZURE_CLIENT_SECRET_CREDENTIAL_CLIENT_ID,
      clientSecretCreds.AZURE_CLIENT_SECRET_CREDENTIAL_SECRET,
      {
        authorityHost: AzureAuthorityHosts.AzurePublicCloud,
      }
    ),
    subscriptionId
  );
}

export type ApimService = {
  readonly getUser: (
    userId: string
  ) => TE.TaskEither<ApimRestError, UserGetResponse>;
  readonly getUserByEmail: (
    userEmail: EmailString,
    fetchGroups?: boolean
  ) => TE.TaskEither<ApimRestError, O.Option<UserContract>>;
  readonly getUserGroups: (
    userId: string
  ) => TE.TaskEither<ApimRestError, ReadonlyArray<GroupContract>>;
  readonly getSubscription: (
    serviceId: string
  ) => TE.TaskEither<ApimRestError, SubscriptionContract>;
  readonly listSecrets: (
    serviceId: string
  ) => TE.TaskEither<ApimRestError, SubscriptionContract>;
  readonly upsertSubscription: (
    productId: string,
    ownerId: string,
    subscriptionId: string
  ) => TE.TaskEither<ApimRestError, SubscriptionContract>;
  readonly getProductByName: (
    productName: NonEmptyString
  ) => TE.TaskEither<ApimRestError, O.Option<ProductContract>>;
  readonly getUserSubscriptions: (
    userId: string,
    offset?: number,
    limit?: number
  ) => TE.TaskEither<ApimRestError, ReadonlyArray<SubscriptionContract>>;
  readonly regenerateSubscriptionKey: (
    serviceId: string,
    keyType: SubscriptionKeyType
  ) => TE.TaskEither<ApimRestError, SubscriptionContract>;
  readonly getDelegateFromServiceId: (
    serviceId: NonEmptyString
  ) => TE.TaskEither<ApimRestError, Delegate>;
  readonly createOrUpdateUser: (
    user: UserCreateParameters,
    userId?: NonEmptyString
  ) => TE.TaskEither<ApimRestError, UserContract>;
  readonly createGroupUser: (
    groupId: NonEmptyString,
    userId: NonEmptyString
  ) => TE.TaskEither<ApimRestError, UserContract>;
};

export const getApimService = (
  apimClient: ApiManagementClient,
  apimResourceGroup: string,
  apimServiceName: string
): ApimService => ({
  getUser: (userId) =>
    getUser(apimClient, apimResourceGroup, apimServiceName, userId),
  getUserByEmail: (userEmail, fetchGroups) =>
    getUserByEmail(
      apimClient,
      apimResourceGroup,
      apimServiceName,
      userEmail,
      fetchGroups
    ),
  getUserGroups: (userId) =>
    getUserGroups(apimClient, apimResourceGroup, apimServiceName, userId),
  getSubscription: (serviceId) =>
    getSubscription(apimClient, apimResourceGroup, apimServiceName, serviceId),
  listSecrets: (serviceId) =>
    listSecrets(apimClient, apimResourceGroup, apimServiceName, serviceId),
  upsertSubscription: (productId, ownerId, subscriptionId) =>
    upsertSubscription(
      apimClient,
      apimResourceGroup,
      apimServiceName,
      productId,
      ownerId,
      subscriptionId
    ),
  getProductByName: (productName) =>
    getProductByName(
      apimClient,
      apimResourceGroup,
      apimServiceName,
      productName
    ),
  getUserSubscriptions: (userId, offset, limit) =>
    getUserSubscriptions(
      apimClient,
      apimResourceGroup,
      apimServiceName,
      userId,
      offset,
      limit
    ),
  regenerateSubscriptionKey: (serviceId, keyType) =>
    regenerateSubscriptionKey(
      apimClient,
      apimResourceGroup,
      apimServiceName,
      serviceId,
      keyType
    ),
  getDelegateFromServiceId: (serviceId) =>
    getDelegateFromServiceId(
      apimClient,
      apimResourceGroup,
      apimServiceName,
      serviceId
    ),
  createOrUpdateUser: (user, userId = ulid() as NonEmptyString) =>
    createOrUpdateUser(
      apimClient,
      apimResourceGroup,
      apimServiceName,
      userId,
      user
    ),
  createGroupUser: (groupId, userId) =>
    createGroupUser(
      apimClient,
      apimResourceGroup,
      apimServiceName,
      groupId,
      userId
    ),
});

const getUser = (
  apimClient: ApiManagementClient,
  apimResourceGroup: string,
  apimServiceName: string,
  userId: string
): TE.TaskEither<ApimRestError, UserGetResponse> =>
  pipe(
    TE.tryCatch(
      () => apimClient.user.get(apimResourceGroup, apimServiceName, userId),
      identity
    ),
    chainApimMappedError
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
  fetchGroups?: boolean
): TE.TaskEither<ApimRestError, O.Option<UserContract>> =>
  pipe(
    apimClient.user.listByService(apimResourceGroup, apimServiceName, {
      filter: `email eq '${userEmail}'`,
      expandGroups: fetchGroups,
    }),
    // the first element does the job
    (userListResponse) =>
      TE.tryCatch(async () => {
        for await (const x of userListResponse) {
          return O.some(x);
        }
        return O.none;
      }, identity),
    chainApimMappedError
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
  userId: string
): TE.TaskEither<ApimRestError, ReadonlyArray<GroupContract>> =>
  pipe(
    TE.tryCatch(async () => {
      const groupListResponse = apimClient.userGroup.list(
        apimResourceGroup,
        apimServiceName,
        userId
      );
      // eslint-disable-next-line functional/immutable-data
      const groupList: GroupContract[] = [];

      for await (const x of groupListResponse) {
        // eslint-disable-next-line functional/immutable-data
        groupList.push(x);
      }
      return groupList;
    }, E.toError),
    chainApimMappedError
  );

/**
 * Retrieve the APIM subscription by its Id
 *
 * @param apimClient
 * @param apimResourceGroup
 * @param apimServiceName
 * @param serviceId
 * @returns
 */
const getSubscription = (
  apimClient: ApiManagementClient,
  apimResourceGroup: string,
  apimServiceName: string,
  serviceId: string
) =>
  pipe(
    TE.tryCatch(
      () =>
        apimClient.subscription.get(
          apimResourceGroup,
          apimServiceName,
          serviceId
        ),
      identity
    ),
    chainApimMappedError
  );

/**
 * Retrieve the APIM secrets for a subscription
 *
 * @param apimClient
 * @param apimResourceGroup
 * @param apimServiceName
 * @param serviceId
 * @returns
 */
const listSecrets = (
  apimClient: ApiManagementClient,
  apimResourceGroup: string,
  apimServiceName: string,
  serviceId: string
) =>
  pipe(
    TE.tryCatch(
      () =>
        apimClient.subscription.listSecrets(
          apimResourceGroup,
          apimServiceName,
          serviceId
        ),
      identity
    ),
    chainApimMappedError
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
  subscriptionId: string
): TE.TaskEither<ApimRestError, SubscriptionContract> =>
  pipe(
    TE.tryCatch(
      () =>
        apimClient.subscription.createOrUpdate(
          apimResourceGroup,
          apimServiceName,
          subscriptionId,
          {
            displayName: subscriptionId,
            ownerId,
            scope: `/products/${productId}`,
            state: "active",
          }
        ),
      identity
    ),
    chainApimMappedError
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
  productName: NonEmptyString
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
    chainApimMappedError
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
  offset?: number,
  limit?: number
): TE.TaskEither<ApimRestError, ReadonlyArray<SubscriptionContract>> =>
  pipe(
    TE.tryCatch(async () => {
      const subscriptionListResponse = apimClient.userSubscription.list(
        resourceGroupName,
        apimServiceName,
        userId,
        {
          filter: subscriptionsExceptManageOneApimFilter(),
          top: limit,
          skip: offset,
        }
      );

      // eslint-disable-next-line functional/immutable-data
      const subscriptionList: SubscriptionContract[] = [];

      for await (const page of subscriptionListResponse.byPage({
        maxPageSize: limit,
      })) {
        for (const subscription of page) {
          // eslint-disable-next-line functional/immutable-data
          subscriptionList.push(subscription);
        }
        /**
         * FIXME: PagedAsyncIterableIterator returns:
         * - first filtered page (what we are filtering)
         * - all pages (starting from first value)
         * For this reason the `break` below is used to get only the first page.
         * **NOTE:** with latest `@azure/arm-apimanagement@9.0.0` the `byPage` iterator,
         * seems not to work, so we downgrade package to 8.x.x version.
         */
        break;
      }

      return subscriptionList;
    }, E.toError),
    chainApimMappedError
  );

/**
 * Regenerates primary or secondary key of an existing subscription
 *
 * @param apimClient
 * @param apimResourceGroup
 * @param apimServiceName
 * @param serviceId
 * @param keyType
 * @returns updated subscription
 */
const regenerateSubscriptionKey = (
  apimClient: ApiManagementClient,
  apimResourceGroup: string,
  apimServiceName: string,
  serviceId: string,
  keyType: SubscriptionKeyType
): TE.TaskEither<ApimRestError, SubscriptionListSecretsResponse> =>
  pipe(
    TE.tryCatch(() => {
      switch (keyType) {
        case SubscriptionKeyTypeEnum.primary:
          return apimClient.subscription.regeneratePrimaryKey(
            apimResourceGroup,
            apimServiceName,
            serviceId
          );
        case SubscriptionKeyTypeEnum.secondary:
          return apimClient.subscription.regenerateSecondaryKey(
            apimResourceGroup,
            apimServiceName,
            serviceId
          );
        default:
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const _: never = keyType;
          throw new Error(`should not have executed this with ${keyType}`);
      }
    }, E.toError),
    TE.chain(() =>
      // retrieve updated subscription
      TE.tryCatch(
        // eslint-disable-next-line sonarjs/no-identical-functions
        () =>
          apimClient.subscription.listSecrets(
            apimResourceGroup,
            apimServiceName,
            serviceId
          ),
        E.toError
      )
    ),
    chainApimMappedError
  );

const getDelegateFromServiceId = (
  apimClient: ApiManagementClient,
  apimResourceGroup: string,
  apimServiceName: string,
  serviceId: NonEmptyString
): TE.TaskEither<ApimRestError, Delegate> =>
  pipe(
    getSubscription(apimClient, apimResourceGroup, apimServiceName, serviceId),
    TE.map((subscription) =>
      parseOwnerIdFullPath(subscription.ownerId as NonEmptyString)
    ),
    TE.chain((ownerId) =>
      getUser(apimClient, apimResourceGroup, apimServiceName, ownerId)
    ),
    TE.chainW((user) =>
      pipe(
        getUserGroups(
          apimClient,
          apimResourceGroup,
          apimServiceName,
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
  user: UserCreateParameters
): TE.TaskEither<ApimRestError, UserContract> =>
  pipe(
    TE.tryCatch(
      () =>
        apimClient.user.createOrUpdate(
          apimResourceGroup,
          apimServiceName,
          userId,
          user
        ),
      identity
    ),
    chainApimMappedError
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
  userId: NonEmptyString
): TE.TaskEither<ApimRestError, UserContract> =>
  pipe(
    TE.tryCatch(
      () =>
        apimClient.groupUser.create(
          apimResourceGroup,
          apimServiceName,
          groupIdId,
          userId
        ),
      identity
    ),
    chainApimMappedError
  );

/**
 * User Subscription list filtered by name not startswith 'MANAGE-'
 *
 * @returns API Management `$filter` property
 */
export const subscriptionsExceptManageOneApimFilter = () =>
  pipe(
    buildApimFilter({
      composeFilter: FilterCompositionEnum.none,
      field: FilterFieldEnum.name,
      filterType: FilterSupportedFunctionsEnum.startswith,
      inverse: true,
      value: MANAGE_APIKEY_PREFIX,
    }),
    O.getOrElse(() => "")
  );

/*
 ** The right full path for ownerID is in this kind of format:
 ** "/subscriptions/subid/resourceGroups/{resourceGroup}/providers/Microsoft.ApiManagement/service/{apimService}/users/5931a75ae4bbd512a88c680b",
 ** resouce link: https://docs.microsoft.com/en-us/rest/api/apimanagement/current-ga/subscription/get
 */
export const parseOwnerIdFullPath = (
  fullPath: NonEmptyString
): NonEmptyString =>
  pipe(
    fullPath,
    (f) => f.split("/"),
    (a) => a[a.length - 1] as NonEmptyString
  );

// TODO: remove when jira-proxy.ts is moved in this package
type Delegate = {
  firstName?: string;
  lastName?: string;
  email?: string;
  permissions: Array<string | undefined>;
};

export * as apim_filters from "./apim-filters";
export * as definitions from "./definitions";
