import {
  ApiManagementClient,
  GroupContract,
  ProductContract,
  SubscriptionContract,
  SubscriptionListSecretsResponse,
  UserContract,
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

import {
  SubscriptionKeyType,
  SubscriptionKeyTypeEnum,
} from "../generated/SubscriptionKeyType";
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

export const ApimRestError = t.interface({
  statusCode: t.number,
});
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
    userEmail: EmailString
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
};

export const getApimService = (
  apimClient: ApiManagementClient,
  apimResourceGroup: string,
  apim: string
): ApimService => ({
  getUser: (userId) => getUser(apimClient, apimResourceGroup, apim, userId),
  getUserByEmail: (userEmail) =>
    getUserByEmail(apimClient, apimResourceGroup, apim, userEmail),
  getUserGroups: (userId) =>
    getUserGroups(apimClient, apimResourceGroup, apim, userId),
  getSubscription: (serviceId) =>
    getSubscription(apimClient, apimResourceGroup, apim, serviceId),
  listSecrets: (serviceId) =>
    listSecrets(apimClient, apimResourceGroup, apim, serviceId),
  upsertSubscription: (productId, ownerId, subscriptionId) =>
    upsertSubscription(
      apimClient,
      apimResourceGroup,
      apim,
      productId,
      ownerId,
      subscriptionId
    ),
  getProductByName: (productName) =>
    getProductByName(apimClient, apimResourceGroup, apim, productName),
  getUserSubscriptions: (userId, offset, limit) =>
    getUserSubscriptions(
      apimClient,
      apimResourceGroup,
      apim,
      userId,
      offset,
      limit
    ),
  regenerateSubscriptionKey: (serviceId, keyType) =>
    regenerateSubscriptionKey(
      apimClient,
      apimResourceGroup,
      apim,
      serviceId,
      keyType
    ),
});

const getUser = (
  apimClient: ApiManagementClient,
  apimResourceGroup: string,
  apim: string,
  userId: string
): TE.TaskEither<ApimRestError, UserGetResponse> =>
  pipe(
    TE.tryCatch(
      () => apimClient.user.get(apimResourceGroup, apim, userId),
      identity
    ),
    chainApimMappedError
  );

/**
 * Retrieve the APIM user by its email
 *
 * @param apimClient
 * @param apimResourceGroup
 * @param apim
 * @param userEmail
 * @returns
 */
const getUserByEmail = (
  apimClient: ApiManagementClient,
  apimResourceGroup: string,
  apim: string,
  userEmail: EmailString
): TE.TaskEither<ApimRestError, O.Option<UserContract>> =>
  pipe(
    apimClient.user.listByService(apimResourceGroup, apim, {
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
    chainApimMappedError
  );

/**
 * Retrieve the APIM user groups by its userId
 *
 * @param apimClient
 * @param apimResourceGroup
 * @param apim
 * @param userId
 * @returns
 */
const getUserGroups = (
  apimClient: ApiManagementClient,
  apimResourceGroup: string,
  apim: string,
  userId: string
): TE.TaskEither<ApimRestError, ReadonlyArray<GroupContract>> =>
  pipe(
    TE.tryCatch(async () => {
      const groupListResponse = apimClient.userGroup.list(
        apimResourceGroup,
        apim,
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
 * @param apim
 * @param serviceId
 * @returns
 */
const getSubscription = (
  apimClient: ApiManagementClient,
  apimResourceGroup: string,
  apim: string,
  serviceId: string
) =>
  pipe(
    TE.tryCatch(
      () => apimClient.subscription.get(apimResourceGroup, apim, serviceId),
      identity
    ),
    chainApimMappedError
  );

/**
 * Retrieve the APIM secrets for a subscription
 *
 * @param apimClient
 * @param apimResourceGroup
 * @param apim
 * @param serviceId
 * @returns
 */
const listSecrets = (
  apimClient: ApiManagementClient,
  apimResourceGroup: string,
  apim: string,
  serviceId: string
) =>
  pipe(
    TE.tryCatch(
      () =>
        apimClient.subscription.listSecrets(apimResourceGroup, apim, serviceId),
      identity
    ),
    chainApimMappedError
  );

/**
 * Create or updates a subscription for a given user
 *
 * @param apimClient
 * @param apimResourceGroup
 * @param apim
 * @param productId
 * @param ownerId
 * @param subscriptionId
 * @returns
 */
const upsertSubscription = (
  apimClient: ApiManagementClient,
  apimResourceGroup: string,
  apim: string,
  productId: string,
  ownerId: string,
  subscriptionId: string
): TE.TaskEither<ApimRestError, SubscriptionContract> =>
  pipe(
    TE.tryCatch(
      () =>
        apimClient.subscription.createOrUpdate(
          apimResourceGroup,
          apim,
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
 * @param apim
 * @param productName
 * @returns
 */
const getProductByName = (
  apimClient: ApiManagementClient,
  apimResourceGroup: string,
  apim: string,
  productName: NonEmptyString
): TE.TaskEither<ApimRestError, O.Option<ProductContract>> =>
  pipe(
    apimClient.product.listByService(apimResourceGroup, apim, {
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
  apim: string,
  userId: string,
  offset?: number,
  limit?: number
): TE.TaskEither<ApimRestError, ReadonlyArray<SubscriptionContract>> =>
  pipe(
    TE.tryCatch(async () => {
      const subscriptionListResponse = apimClient.userSubscription.list(
        resourceGroupName,
        apim,
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
 * @param apim
 * @param serviceId
 * @param keyType
 * @returns updated subscription
 */
const regenerateSubscriptionKey = (
  apimClient: ApiManagementClient,
  apimResourceGroup: string,
  apim: string,
  serviceId: string,
  keyType: SubscriptionKeyType
): TE.TaskEither<ApimRestError, SubscriptionListSecretsResponse> =>
  pipe(
    TE.tryCatch(() => {
      switch (keyType) {
        case SubscriptionKeyTypeEnum.primary:
          return apimClient.subscription.regeneratePrimaryKey(
            apimResourceGroup,
            apim,
            serviceId
          );
        case SubscriptionKeyTypeEnum.secondary:
          return apimClient.subscription.regenerateSecondaryKey(
            apimResourceGroup,
            apim,
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
        () =>
          apimClient.subscription.listSecrets(
            apimResourceGroup,
            apim,
            serviceId
          ),
        E.toError
      )
    ),
    chainApimMappedError
  );

/**
 * User Subscription list filtered by name not startswith 'MANAGE-'
 *
 * @returns API Management `$filter` property
 */
const subscriptionsExceptManageOneApimFilter = () =>
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

export * as apim_filters from "./apim-filters";
export * as definitions from "./definitions";
