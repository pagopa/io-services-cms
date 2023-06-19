import {
  ApiManagementClient,
  GroupContract,
  ProductContract,
  SubscriptionContract,
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
import { AzureClientSecretCredential } from "../../config";
import { subscriptionsExceptManageOneApimFilter } from "../../utils/api-keys";

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

export const chainApimMappedError = <T>(
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

export function getUser(
  apimClient: ApiManagementClient,
  apimResourceGroup: string,
  apim: string,
  userId: string
): TE.TaskEither<ApimRestError, UserGetResponse> {
  return pipe(
    TE.tryCatch(
      () => apimClient.user.get(apimResourceGroup, apim, userId),
      identity
    ),
    chainApimMappedError
  );
}

/**
 * Retrieve the APIM user by its email
 *
 * @param apimClient
 * @param apimResourceGroup
 * @param apim
 * @param userEmail
 * @returns
 */
export function getUserByEmail(
  apimClient: ApiManagementClient,
  apimResourceGroup: string,
  apim: string,
  userEmail: EmailString
): TE.TaskEither<ApimRestError, O.Option<UserContract>> {
  return pipe(
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
}

export function getUserGroups(
  apimClient: ApiManagementClient,
  apimResourceGroup: string,
  apim: string,
  userId: string
): TE.TaskEither<ApimRestError, ReadonlyArray<GroupContract>> {
  return pipe(
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
}

export const getSubscription = (
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
export const upsertSubscription = (
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
export function getProductByName(
  apimClient: ApiManagementClient,
  apimResourceGroup: string,
  apim: string,
  productName: NonEmptyString
): TE.TaskEither<ApimRestError, O.Option<ProductContract>> {
  return pipe(
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
}

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
export function getUserSubscriptions(
  apimClient: ApiManagementClient,
  resourceGroupName: string,
  serviceName: string,
  userId: string,
  offset?: number,
  limit?: number
): TE.TaskEither<ApimRestError, ReadonlyArray<SubscriptionContract>> {
  return pipe(
    TE.tryCatch(async () => {
      const subscriptionListResponse = apimClient.userSubscription.list(
        resourceGroupName,
        serviceName,
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
}

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
