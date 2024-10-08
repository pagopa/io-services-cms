import { SubscriptionCIDRsModel } from "@pagopa/io-functions-commons/dist/src/models/subscription_cidrs";
import { IAzureUserAttributesManage } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/azure_user_attributes_manage";
import { IRequestMiddleware } from "@pagopa/ts-commons/lib/request_middleware";
import { IResponse } from "@pagopa/ts-commons/lib/responses";
import * as E from "fp-ts/lib/Either";

import { BackofficeInternalSubnetCIDRs } from "../config";
import { AzureUserAttributesManageMiddleware } from "../lib/middlewares/azure_user_attributes_manage-middleware";

export const AzureUserAttributesManageMiddlewareWrapper =
  (
    subscriptionCIDRsModel: SubscriptionCIDRsModel,
    { BACKOFFICE_INTERNAL_SUBNET_CIDRS }: BackofficeInternalSubnetCIDRs,
  ): IRequestMiddleware<
    | "IResponseErrorForbiddenNotAuthorized"
    | "IResponseErrorInternal"
    | "IResponseErrorQuery",
    IAzureUserAttributesManage
  > =>
  async (
    request,
  ): Promise<
    E.Either<
      IResponse<
        | "IResponseErrorForbiddenNotAuthorized"
        | "IResponseErrorInternal"
        | "IResponseErrorQuery"
      >,
      IAzureUserAttributesManage
    >
  > => {
    // Execute the AzureUserAttributesManageMiddleware
    const originalMiddelwareResult = await AzureUserAttributesManageMiddleware(
      subscriptionCIDRsModel,
    )(request);

    // If the middleware fails or the request comes outside the Backoffice subnet
    // return the originale middleware result
    if (
      E.isLeft(originalMiddelwareResult) ||
      originalMiddelwareResult.right.authorizedCIDRs.size === 0
    ) {
      return originalMiddelwareResult;
    }

    // Otherwise, return the original middleware result with an empty list of CIDRs
    // This will skip all Authorized CIDRs checks

    return E.right({
      ...originalMiddelwareResult.right,
      authorizedCIDRs: new Set([
        ...originalMiddelwareResult.right.authorizedCIDRs,
        ...BACKOFFICE_INTERNAL_SUBNET_CIDRS,
      ]),
    });
  };
